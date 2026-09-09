#!/usr/bin/env node
/**
 * 全量文档健康度门禁聚合工具（check:docs）
 *
 * 设计哲学（Unix Rule of Silence 变体 + Agent Result Envelope 协议）：
 *   - 纯只读文档与 AST 静态扫描，多任务异步高并发调度；
 *   - 默认模式：遵循 Unix 沉默原则，成功输出单行极简确认（~0.3s），失败打破静默精准定位；
 *   - --json 模式：输出严格的 Agent Result Envelope 结构（status、result、error、control、effect、meta），
 *     三态状态机建模（success / partial_success / error），提供结构化建议自愈动作（suggested_actions）。
 */

import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { StringDecoder } from 'node:string_decoder'

const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))

const isFix = process.argv.includes('--fix')
const isJson = process.argv.includes('--json')
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
const TIMEOUT_MS = 15000 // 15s 进程超时熔断

const LOCAL_TSX = path.resolve(ROOT, 'node_modules/tsx/dist/cli.mjs')
const HAS_LOCAL_TSX = existsSync(LOCAL_TSX)

function getRunner(scriptRelPath, extraArgs = []) {
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

const CHECKS = [
  {
    name: 'links',
    desc: '文档链接与绝对路径',
    ...getRunner('scripts/docs/check-doc-links.mjs', ['check']),
    action: {
      type: 'auto_fix',
      command: 'pnpm check:docs:fix',
      description: '自动扫描并纠偏文档内的相对链接路径。',
    },
  },
  {
    name: 'status',
    desc: '方案 Frontmatter 契约',
    ...getRunner('scripts/docs/scan-doc-status.mjs', ['--check']),
    action: {
      type: 'manual_fix',
      command: null,
      description: '请检查并补充方案文档顶部的标准 YAML Frontmatter（title、status、author 等）。',
    },
  },
  {
    name: 'guides',
    desc: '规范指南类名守卫',
    ...getRunner('scripts/docs/check-guide-conventions.mjs'),
    action: {
      type: 'manual_fix',
      command: null,
      description: '请移除指南文档中已被废弃的类名或过时约定。',
    },
  },
  {
    name: 'refs',
    desc: '组件文档覆盖率守卫',
    ...getRunner('scripts/check-guide-refs.ts'),
    action: {
      type: 'manual_fix',
      command: null,
      description: '已登记组件缺少对应中英文使用文档或大小写不匹配，请按指引补充。',
    },
  },
  {
    name: 'templates',
    desc: '组件使用文档章节规范',
    ...getRunner('scripts/check-doc-template.mjs'),
    action: {
      type: 'manual_fix',
      command: null,
      description: '组件使用文档缺失必要章节（如用法、API 或无障碍说明），请补全对应章节。',
    },
  },
]

function runCheck(check) {
  return new Promise((resolve) => {
    const finalArgs = [...check.args]
    if (isJson && !finalArgs.includes('--json')) {
      finalArgs.push('--json')
    }

    const child = spawn(check.cmd, finalArgs, {
      cwd: ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const stdoutDecoder = new StringDecoder('utf8')
    const stderrDecoder = new StringDecoder('utf8')
    let stdout = ''
    let stderr = ''
    let isSettled = false

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true
        child.kill('SIGKILL')
        resolve({
          ...check,
          code: 124,
          stdout: stdout.trim(),
          stderr: (stderr + `\n执行超时（超过 ${TIMEOUT_MS / 1000}s 熔断）`).trim(),
          diagnostics: [
            {
              file: check.args[0] ?? check.name,
              line: 1,
              ruleId: `${check.name}/timeout`,
              message: `检查执行超时，超过 ${TIMEOUT_MS / 1000} 秒被熔断终止`,
              severity: 'error',
            },
          ],
          jsonSummary: null,
        })
      }
    }, TIMEOUT_MS)

    child.stdout.on('data', (data) => {
      stdout += stdoutDecoder.write(data)
    })

    child.stderr.on('data', (data) => {
      stderr += stderrDecoder.write(data)
    })

    child.on('close', (code) => {
      if (isSettled) return
      isSettled = true
      clearTimeout(timer)
      stdout += stdoutDecoder.end()
      stderr += stderrDecoder.end()

      let diagnostics = []
      let jsonSummary = null

      if (isJson && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout.trim())
          if (parsed && Array.isArray(parsed.diagnostics)) {
            diagnostics = parsed.diagnostics
            jsonSummary = parsed.summary ?? null
          }
        } catch {}
      }

      // 降级防呆：若子进程失败且无结构化诊断，生成合成诊断，防止返回空数组
      if (code !== 0 && diagnostics.length === 0) {
        diagnostics.push({
          file: check.args[0] ?? check.name,
          line: 1,
          ruleId: `${check.name}/unstructured-failure`,
          message: stderr.trim() || stdout.trim() || `检查 ${check.name} 失败（退出码: ${code}）`,
          severity: 'error',
        })
      }

      resolve({
        ...check,
        code: code ?? 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        diagnostics,
        jsonSummary,
      })
    })

    child.on('error', (err) => {
      if (isSettled) return
      isSettled = true
      clearTimeout(timer)
      resolve({
        ...check,
        code: 1,
        stdout,
        stderr: `${stderr}\n子进程执行异常: ${err.message}`.trim(),
        diagnostics: [
          {
            file: check.args[0] ?? check.name,
            line: 1,
            ruleId: `${check.name}/process-error`,
            message: `子进程拉起失败: ${err.message}`,
            severity: 'error',
          },
        ],
        jsonSummary: null,
      })
    })
  })
}

function handleFix() {
  try {
    const fixRes = spawnSync(process.execPath, ['scripts/docs/check-doc-links.mjs', 'fix'], {
      cwd: ROOT,
      encoding: 'utf-8',
      env: process.env,
    })
    return {
      success: fixRes.status === 0,
      stdout: fixRes.stdout?.trim() ?? '',
      stderr: fixRes.stderr?.trim() ?? '',
    }
  } catch (err) {
    return {
      success: false,
      stdout: '',
      stderr: `自动修复进程拉起异常: ${err.message}`,
    }
  }
}

async function main() {
  const startedAt = new Date().toISOString()
  const startTs = Date.now()

  let fixResult = null
  if (isFix) {
    fixResult = handleFix()
    if (!fixResult.success) {
      if (!isJson) {
        console.error('自动修复链接执行失败：\n' + (fixResult.stderr || fixResult.stdout))
      }
    } else if (!isJson && (isVerbose || (fixResult.stdout && !fixResult.stdout.includes('0 处链接')))) {
      console.log(fixResult.stdout)
    }
  }

  const results = await Promise.all(CHECKS.map(runCheck))
  const finishedAt = new Date().toISOString()
  const durationMs = Date.now() - startTs
  const durationSec = (durationMs / 1000).toFixed(2)

  const failures = results.filter((r) => r.code !== 0)
  const successes = results.filter((r) => r.code === 0)

  let status = 'success'
  if (failures.length === results.length) {
    status = 'error'
  } else if (failures.length > 0) {
    status = 'partial_success'
  }

  const envelope = {
    status,
    result: {
      summary: {
        total: results.length,
        succeeded: successes.length,
        failed: failures.length,
      },
      checks: results.map((r) => ({
        id: r.name,
        desc: r.desc,
        status: r.code === 0 ? 'success' : 'error',
        exit_code: r.code,
        summary: r.jsonSummary,
        diagnostics: r.diagnostics,
        stdout: r.stdout,
        stderr: r.stderr,
      })),
    },
    error: failures.length > 0
      ? {
          code: 'DOCUMENTATION_VIOLATION',
          message: `${failures.length} of ${results.length} documentation checks failed.`,
          category: 'documentation_guard',
          retryable: false,
          details: {
            failed_check_ids: failures.map((f) => f.name),
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
        check_id: f.name,
        desc: f.desc,
        ...f.action,
      })),
    },
    effect: {
      type: isFix ? (fixResult?.success ? 'updated' : 'none') : 'none',
      details: isFix ? { fix_stdout: fixResult?.stdout, fix_stderr: fixResult?.stderr } : null,
    },
    meta: {
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: durationMs,
    },
  }

  if (isJson) {
    console.log(JSON.stringify(envelope, null, 2))
    if (status !== 'success') {
      process.exit(1)
    }
    return
  }

  if (failures.length > 0) {
    console.error('\n✖ [check:docs] 文档门禁检查未通过：\n')
    for (const f of failures) {
      console.error(`--- 【${f.desc} (${f.name}) 失败】---`)
      if (f.stdout) console.error(f.stdout)
      if (f.stderr) console.error(f.stderr)
      if (f.action?.description) {
        console.error(`\n👉 建议排查: ${f.action.description}`)
      }
      if (f.action?.command) {
        console.error(`👉 修复指令: ${f.action.command}\n`)
      }
    }
    process.exit(1)
  }

  if (isVerbose) {
    console.log(`\n=== BrutxUI 文档健康度巡检详细报告（耗时 ${durationSec}s）===`)
    for (const r of results) {
      console.log(`\n--- ${r.desc} (${r.name}) ---`)
      console.log(r.stdout)
    }
    console.log(`\n✓ docs check passed (${results.length} checks, ${durationSec}s)`)
  } else {
    console.log('✓ docs check passed')
  }
}

main().catch((err) => {
  if (isJson) {
    console.log(
      JSON.stringify(
        {
          status: 'error',
          result: null,
          error: {
            code: 'RUNNER_EXCEPTION',
            message: err.message,
            category: 'runtime_error',
            retryable: false,
          },
          control: { retry: { allowed: false, after_ms: null }, suggested_actions: [] },
          effect: { type: 'none' },
          meta: { started_at: null, finished_at: null, duration_ms: null, error: err.stack },
        },
        null,
        2,
      ),
    )
  } else {
    console.error('文档门禁未知异常：', err)
  }
  process.exit(1)
})
