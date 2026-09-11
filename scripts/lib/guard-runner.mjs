import { execSync, spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { getRepoRoot } from '../shared/path.mjs'

export const DEFAULT_TIMEOUT_MS = 25000
export const DEFAULT_FIX_TIMEOUT_MS = 30000
export const DEFAULT_MAX_CONCURRENCY = 8
export const MIN_CONCURRENCY = 1
export const TIMEOUT_EXIT_CODE = 124
export const PROCESS_ERROR_EXIT_CODE = 1
export const SUCCESS_EXIT_CODE = 0
export const DEFAULT_DIAGNOSTIC_LINE = 1
export const MILLISECONDS_PER_SECOND = 1000
export const MAX_STREAM_BUFFER_BYTES = 10 * 1024 * 1024

const ROOT = getRepoRoot()
const LOCAL_TSX = path.resolve(ROOT, 'node_modules/tsx/dist/cli.mjs')
const HAS_LOCAL_TSX = existsSync(LOCAL_TSX)

/**
 * 跨平台强制终止进程树，防止 Windows 或 POSIX 孤儿子进程遗留
 * @param {import('node:child_process').ChildProcess} child
 * @param {string} [signal='SIGTERM']
 */
export function killProcessTree(child, signal = 'SIGTERM') {
  if (!child || !child.pid || child.killed) return
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' })
    } else {
      try {
        process.kill(-child.pid, signal)
      } catch {
        child.kill(signal)
      }
    }
  } catch {
    try {
      child.kill(signal)
    } catch {}
  }
}

/**
 * 获取跨平台适用的脚本运行器命令与参数
 * @param {string} scriptRelPath 脚本相对路径
 * @param {string[]} extraArgs 附加参数
 * @returns {{ cmd: string, args: string[] }}
 */
export function getRunner(scriptRelPath, extraArgs = []) {
  if (scriptRelPath.endsWith('.ts')) {
    if (HAS_LOCAL_TSX) {
      return {
        cmd: process.execPath,
        args: [LOCAL_TSX, scriptRelPath, ...extraArgs],
      }
    }
    return {
      cmd: process.platform === 'win32' ? 'npx.cmd' : 'npx',
      args: ['tsx', scriptRelPath, ...extraArgs],
    }
  }
  return {
    cmd: process.execPath,
    args: [scriptRelPath, ...extraArgs],
  }
}

/**
 * 基于受控并发池调度异步任务（含防御性参数容错与错误熔断机制）
 * @template T
 * @param {Array<() => Promise<T>>} taskFactories
 * @param {number} [concurrency=DEFAULT_MAX_CONCURRENCY]
 * @returns {Promise<T[]>}
 */
export async function runWithConcurrency(taskFactories, concurrency = DEFAULT_MAX_CONCURRENCY) {
  if (!Array.isArray(taskFactories) || taskFactories.length === 0) {
    return []
  }

  const validConcurrency = Number.isFinite(concurrency) ? Math.floor(concurrency) : DEFAULT_MAX_CONCURRENCY
  const safeConcurrency = Math.max(MIN_CONCURRENCY, validConcurrency)
  const results = new Array(taskFactories.length)
  let nextIndex = 0
  let hasAborted = false

  async function worker() {
    while (!hasAborted && nextIndex < taskFactories.length) {
      const currentIndex = nextIndex++
      try {
        results[currentIndex] = await taskFactories[currentIndex]()
      } catch (err) {
        hasAborted = true
        throw err
      }
    }
  }

  const poolSize = Math.min(safeConcurrency, taskFactories.length)
  const workers = Array.from({ length: poolSize }, () => worker())
  await Promise.all(workers)
  return results
}

/**
 * 从可能包含杂质输出的文本中提取标准 JSON 结构
 * @param {string} text
 * @returns {any}
 */
function extractJsonPayload(text) {
  if (!text) return null
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {}

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1))
    } catch {}
  }
  return null
}

/**
 * 门禁调度套件执行器
 */
export class GuardSuite {
  /**
   * @param {Object} config
   * @param {string} config.name 门禁套件中文名称
   * @param {string} config.suiteId 门禁套件标识（如 check:contracts）
   * @param {string} config.category 错误分类
   * @param {string} config.errorCode 违规错误码
   * @param {string} config.defaultCommand 建议运行的整体校验指令
   * @param {string} [config.silentSuccessMessage] 成功时的单行极简确认输出
   * @param {number} [config.defaultTimeoutMs] 默认超时时间（毫秒）
   * @param {number} [config.concurrency] 并发执行上限
   * @param {Array<Object>} config.guards 门禁项列表
   */
  constructor(config) {
    this.config = {
      defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
      concurrency: Math.max(MIN_CONCURRENCY, Math.min(os.cpus().length, DEFAULT_MAX_CONCURRENCY)),
      ...config,
    }
    this.activeChildren = new Set()
  }

  /**
   * 注册受控作用域信号监听，执行完毕后通过返回的函数精准注销
   * @returns {() => void} 注销监听器回调
   */
  registerScopedSignals() {
    const handleSignal = () => {
      for (const child of this.activeChildren) {
        killProcessTree(child, 'SIGKILL')
      }
      this.activeChildren.clear()
      process.exit(PROCESS_ERROR_EXIT_CODE)
    }

    process.on('SIGINT', handleSignal)
    process.on('SIGTERM', handleSignal)

    return () => {
      process.removeListener('SIGINT', handleSignal)
      process.removeListener('SIGTERM', handleSignal)
    }
  }

  /**
   * 执行单个门禁检查任务
   * @param {Object} guard
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  executeGuard(guard, options) {
    return new Promise((resolve) => {
      const runner = getRunner(guard.target, guard.args ?? [])
      const finalArgs = [...runner.args]
      if (options.json && !finalArgs.includes('--json')) {
        finalArgs.push('--json')
      }

      const timeoutMs = guard.timeoutMs ?? this.config.defaultTimeoutMs
      let child
      try {
        const isWindowsScript = process.platform === 'win32' && runner.cmd.endsWith('.cmd')
        child = spawn(runner.cmd, finalArgs, {
          cwd: ROOT,
          env: process.env,
          shell: isWindowsScript,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      } catch (err) {
        return resolve({
          ...guard,
          code: PROCESS_ERROR_EXIT_CODE,
          stdout: '',
          stderr: `子进程拉起同步异常: ${err.message}`,
          diagnostics: [
            {
              file: guard.target ?? guard.id,
              line: DEFAULT_DIAGNOSTIC_LINE,
              ruleId: `${guard.id}/spawn-error`,
              message: `子进程拉起同步异常: ${err.message}`,
              severity: 'error',
            },
          ],
          jsonSummary: null,
        })
      }

      this.activeChildren.add(child)

      const stdoutDecoder = new StringDecoder('utf8')
      const stderrDecoder = new StringDecoder('utf8')
      let stdout = ''
      let stderr = ''
      let isSettled = false

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true
          this.activeChildren.delete(child)
          killProcessTree(child, 'SIGKILL')
          stdout += stdoutDecoder.end()
          stderr += stderrDecoder.end()

          const timeoutSec = (timeoutMs / MILLISECONDS_PER_SECOND).toFixed(0)
          resolve({
            ...guard,
            code: TIMEOUT_EXIT_CODE,
            stdout: stdout.trim(),
            stderr: (stderr + `\n执行超时（超过 ${timeoutSec}s 熔断）`).trim(),
            diagnostics: [
              {
                file: guard.target ?? guard.id,
                line: DEFAULT_DIAGNOSTIC_LINE,
                ruleId: `${guard.id}/timeout`,
                message: `门禁检查执行超时，超过 ${timeoutSec} 秒被熔断终止`,
                severity: 'error',
              },
            ],
            jsonSummary: null,
          })
        }
      }, timeoutMs)

      child.stdout.on('data', (data) => {
        if (stdout.length < MAX_STREAM_BUFFER_BYTES) {
          stdout += stdoutDecoder.write(data)
        }
      })

      child.stderr.on('data', (data) => {
        if (stderr.length < MAX_STREAM_BUFFER_BYTES) {
          stderr += stderrDecoder.write(data)
        }
      })

      child.on('close', (code) => {
        if (isSettled) return
        isSettled = true
        this.activeChildren.delete(child)
        clearTimeout(timer)
        stdout += stdoutDecoder.end()
        stderr += stderrDecoder.end()

        let diagnostics = []
        let jsonSummary = null

        if (options.json && stdout.trim()) {
          const parsed = extractJsonPayload(stdout)
          if (parsed && Array.isArray(parsed.diagnostics)) {
            diagnostics = parsed.diagnostics
            jsonSummary = parsed.summary ?? null
          }
        }

        const effectiveCode = code ?? SUCCESS_EXIT_CODE
        if (effectiveCode !== SUCCESS_EXIT_CODE && diagnostics.length === 0) {
          diagnostics.push({
            file: guard.target ?? guard.id,
            line: DEFAULT_DIAGNOSTIC_LINE,
            ruleId: `${guard.id}/unstructured-failure`,
            message: stderr.trim() || stdout.trim() || `检查 ${guard.id} 失败（退出码: ${effectiveCode}）`,
            severity: 'error',
          })
        }

        resolve({
          ...guard,
          code: effectiveCode,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          diagnostics,
          jsonSummary,
        })
      })

      child.on('error', (err) => {
        if (isSettled) return
        isSettled = true
        this.activeChildren.delete(child)
        clearTimeout(timer)
        stdout += stdoutDecoder.end()
        stderr += stderrDecoder.end()

        resolve({
          ...guard,
          code: PROCESS_ERROR_EXIT_CODE,
          stdout: stdout.trim(),
          stderr: `${stderr}\n子进程拉起失败: ${err.message}`.trim(),
          diagnostics: [
            {
              file: guard.target ?? guard.id,
              line: DEFAULT_DIAGNOSTIC_LINE,
              ruleId: `${guard.id}/process-error`,
              message: `子进程拉起失败: ${err.message}`,
              severity: 'error',
            },
          ],
          jsonSummary: null,
        })
      })
    })
  }

  /**
   * 执行声明式自愈前置流程
   * @param {Object} options
   * @returns {{ success: boolean, actions: Array<Object> }}
   */
  executeAutoFix(options) {
    const fixableGuards = this.config.guards.filter((g) => Boolean(g.fix))
    const actions = []
    let overallSuccess = true

    for (const guard of fixableGuards) {
      const fixConfig = guard.fix
      const timeoutMs = fixConfig.timeoutMs ?? DEFAULT_FIX_TIMEOUT_MS
      let res
      if (fixConfig.command) {
        res = spawnSync(fixConfig.command, {
          cwd: ROOT,
          shell: true,
          encoding: 'utf-8',
          env: process.env,
          timeout: timeoutMs,
        })
      } else if (Array.isArray(fixConfig.args)) {
        const runner = getRunner(guard.target, fixConfig.args)
        const isWindowsScript = process.platform === 'win32' && runner.cmd.endsWith('.cmd')
        res = spawnSync(runner.cmd, runner.args, {
          cwd: ROOT,
          shell: isWindowsScript,
          encoding: 'utf-8',
          env: process.env,
          timeout: timeoutMs,
        })
      }

      if (res) {
        const success = res.status === SUCCESS_EXIT_CODE && !res.error
        if (!success) overallSuccess = false
        const stdout = res.stdout?.trim() ?? ''
        const stderr = (res.stderr?.trim() || res.error?.message) ?? ''
        actions.push({
          guardId: guard.id,
          description: fixConfig.description,
          success,
          stdout,
          stderr,
        })

        if (!options.json && !options.silent) {
          if (!success) {
            console.error(`自动修复 [${guard.id}] 执行未通过：\n${stderr || stdout}`)
          } else if (options.verbose || (stdout && !fixConfig.silentStdoutFilter?.(stdout))) {
            console.log(stdout)
          }
        }
      }
    }

    return {
      success: overallSuccess,
      actions,
    }
  }

  /**
   * 运行门禁套件
   * @param {Object} [overrideOptions]
   * @returns {Promise<Object>}
   */
  async run(overrideOptions = {}) {
    const unregisterSignals = this.registerScopedSignals()

    const argv = process.argv
    const options = {
      json: argv.includes('--json'),
      verbose: argv.includes('--verbose') || argv.includes('-v'),
      fix: argv.includes('--fix'),
      autoExit: true,
      ...overrideOptions,
    }

    const startedAt = new Date().toISOString()
    const startTs = Date.now()

    try {
      let fixResult = null
      if (options.fix) {
        fixResult = this.executeAutoFix(options)
      }

      const taskFactories = this.config.guards.map((guard) => () => this.executeGuard(guard, options))
      const results = await runWithConcurrency(taskFactories, this.config.concurrency)

      const finishedAt = new Date().toISOString()
      const durationMs = Date.now() - startTs
      const durationSec = (durationMs / MILLISECONDS_PER_SECOND).toFixed(2)

      const failures = results.filter((r) => r.code !== SUCCESS_EXIT_CODE)
      const successes = results.filter((r) => r.code === SUCCESS_EXIT_CODE)

      let status = 'success'
      if (results.length > 0 && failures.length === results.length) {
        status = 'error'
      } else if (failures.length > 0) {
        status = 'partial_success'
      }

      const hasEffectiveUpdates = Boolean(
        options.fix &&
          fixResult?.success &&
          fixResult.actions.some((a) => a.success && a.stdout.length > 0),
      )

      const envelope = {
        status,
        result: {
          summary: {
            total: results.length,
            succeeded: successes.length,
            failed: failures.length,
          },
          checks: results.map((r) => ({
            id: r.id,
            desc: r.desc,
            status: r.code === SUCCESS_EXIT_CODE ? 'success' : 'error',
            exit_code: r.code,
            summary: r.jsonSummary,
            diagnostics: r.diagnostics,
            stdout: r.stdout,
            stderr: r.stderr,
          })),
        },
        error:
          failures.length > 0
            ? {
                code: this.config.errorCode,
                message: `${failures.length} of ${results.length} checks failed.`,
                category: this.config.category,
                retryable: false,
                details: {
                  failed_check_ids: failures.map((f) => f.id),
                  diagnostics: failures.flatMap((f) => f.diagnostics),
                },
              }
            : null,
        control: {
          retry: {
            allowed: false,
            after_ms: null,
          },
          suggested_actions: failures.map((f) => ({
            check_id: f.id,
            desc: f.desc,
            ...f.action,
          })),
        },
        effect: {
          type: hasEffectiveUpdates ? 'updated' : 'none',
          details: options.fix ? fixResult : null,
        },
        meta: {
          started_at: startedAt,
          finished_at: finishedAt,
          duration_ms: durationMs,
        },
      }

      if (options.json) {
        if (!options.silent) {
          console.log(JSON.stringify(envelope, null, 2))
        }
        if (options.autoExit && status !== 'success') {
          process.exit(PROCESS_ERROR_EXIT_CODE)
        }
        return { envelope, results, failures, successes }
      }

      if (failures.length > 0) {
        if (!options.silent) {
          console.error(`\n✖ [${this.config.suiteId}] ${this.config.name}检查未通过：\n`)
          for (const f of failures) {
            console.error(`--- 【${f.desc} (${f.id}) 失败】---`)
            if (f.stdout) console.error(f.stdout)
            if (f.stderr) console.error(f.stderr)
            if (f.action?.description) {
              console.error(`\n👉 建议排查: ${f.action.description}`)
            }
            if (f.action?.command) {
              console.error(`👉 修复指令: ${f.action.command}\n`)
            }
          }
        }
        if (options.autoExit) {
          process.exit(PROCESS_ERROR_EXIT_CODE)
        }
        return { envelope, results, failures, successes }
      }

      const defaultSilentMessage = `✓ ${this.config.suiteId} passed`
      const silentMessage = this.config.silentSuccessMessage ?? defaultSilentMessage

      if (!options.silent) {
        if (options.verbose) {
          console.log(`\n=== BrutxUI ${this.config.name}详细报告（耗时 ${durationSec}s）===`)
          for (const r of results) {
            console.log(`\n--- ${r.desc} (${r.id}) ---`)
            if (r.stdout) console.log(r.stdout)
          }
          console.log(`\n${silentMessage} (${results.length} checks, ${durationSec}s)`)
        } else {
          console.log(silentMessage)
        }
      }

      if (options.autoExit) {
        process.exit(SUCCESS_EXIT_CODE)
      }

      return { envelope, results, failures, successes }
    } catch (err) {
      if (options.json) {
        const errorEnvelope = {
          status: 'error',
          result: null,
          error: {
            code: 'RUNNER_EXCEPTION',
            message: err.message,
            category: 'runtime_error',
            retryable: false,
          },
          control: { retry: { allowed: false, after_ms: null }, suggested_actions: [] },
          effect: { type: 'none', details: null },
          meta: {
            started_at: startedAt,
            finished_at: new Date().toISOString(),
            duration_ms: Date.now() - startTs,
            error: err.stack,
          },
        }
        if (!options.silent) {
          console.log(JSON.stringify(errorEnvelope, null, 2))
        }
      } else if (!options.silent) {
        console.error(`\n✖ [${this.config.suiteId}] 门禁调度引擎异常：`, err)
      }

      if (options.autoExit) {
        process.exit(PROCESS_ERROR_EXIT_CODE)
      }
      throw err
    } finally {
      unregisterSignals()
    }
  }
}

/**
 * 声明并创建门禁套件
 * @param {Object} config
 * @returns {GuardSuite}
 */
export function defineGuardSuite(config) {
  return new GuardSuite(config)
}
