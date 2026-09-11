#!/usr/bin/env node
/**
 * 全量代码与规范契约门禁聚合工具（check:contracts）
 *
 * 设计哲学（Unix Rule of Silence 变体 + Agent Result Envelope 协议）：
 *   - 纯只读源码与 AST 静态扫描，多任务异步高并发调度；
 *   - 默认模式：遵循 Unix 沉默原则，成功输出单行极简确认（~1.6s），失败打破静默精准定位；
 *   - --json 模式：输出严格的 Agent Result Envelope 结构（status、result、error、control、effect、meta），
 *     三态状态机建模（success / partial_success / error），提供结构化建议自愈动作（suggested_actions）。
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { StringDecoder } from 'node:string_decoder'

const ROOT = path.resolve(fileURLToPath(new URL('../', import.meta.url)))
const isJson = process.argv.includes('--json')
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
const TIMEOUT_MS = 25000 // 25s 契约超时熔断

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

const CONTRACTS = [
  {
    id: 'phantom-deps',
    desc: 'Monorepo 幽灵依赖防护',
    ...getRunner('scripts/scan-phantom-deps.mjs'),
    action: {
      type: 'manual_fix',
      command: null,
      description: '请检查报错包的 package.json，在 dependencies/devDependencies 中补充声明该依赖。',
    },
  },
  {
    id: 'fallback-vars',
    desc: '设计令牌 Fallback 覆盖率基线',
    ...getRunner('packages/ui/scripts/audit-brutal-fallback.ts', ['--check-baseline']),
    action: {
      type: 'auto_fix',
      command: 'pnpm --filter brutx-ui-vue audit:fallback:fix',
      description: '自动补全缺失的设计令牌 fallback（若属预期变更请运行 pnpm --filter brutx-ui-vue audit:fallback:update 更新基线）。',
    },
  },
  {
    id: 'class-literals',
    desc: 'Tailwind @source 类名字面量规约',
    ...getRunner('packages/ui/scripts/check-class-literals.ts'),
    action: {
      type: 'manual_fix',
      command: null,
      description: '避免动态拼接类名，确保 Tailwind class 以静态完整字符串形式出现在源码中。',
    },
  },
  {
    id: 'deprecated-utils',
    desc: '已废弃工具类防回潮基线',
    ...getRunner('packages/ui/scripts/check-deprecated-utilities.ts', ['--check-baseline']),
    action: {
      type: 'auto_fix',
      command: 'pnpm --filter brutx-ui-vue check:deprecated:update',
      description: '若废弃类变更属预期，运行此命令更新基线快照；否则请移除废弃的 ring 或 shadow-rgba 工具类。',
    },
  },
  {
    id: 'tokens-alignment',
    desc: 'CLI brutalist.css 令牌对齐',
    ...getRunner('packages/cli/scripts/check-brutalist-tokens.ts'),
    action: {
      type: 'auto_fix',
      command: 'pnpm --filter brutx-vue prebuild:tokens',
      description: '重新从 shared 单一信源编译并同步 CLI brutalist.css 令牌。',
    },
  },
  {
    id: 'exports-sync',
    desc: '组件重导出与 Manifest 同步',
    ...getRunner('packages/ui/scripts/check-exports.ts'),
    action: {
      type: 'auto_fix',
      command: 'pnpm --filter brutx-ui-vue prebuild:exports && pnpm --filter brutx-ui-vue prebuild:scan',
      description: '重新扫描生成并同步组件导出与 manifest 清单。',
    },
  },
]

function runContract(contract) {
  return new Promise((resolve) => {
    const finalArgs = [...contract.args]
    if (isJson && !finalArgs.includes('--json')) {
      finalArgs.push('--json')
    }

    const child = spawn(contract.cmd, finalArgs, {
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
          ...contract,
          code: 124,
          stdout: stdout.trim(),
          stderr: (stderr + `\n执行超时（超过 ${TIMEOUT_MS / 1000}s 熔断）`).trim(),
          diagnostics: [
            {
              file: contract.id,
              line: 1,
              ruleId: `${contract.id}/timeout`,
              message: `契约检查执行超时，超过 ${TIMEOUT_MS / 1000} 秒被熔断终止`,
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

      // 降级防呆：若子进程失败且无结构化诊断，生成合成诊断
      if (code !== 0 && diagnostics.length === 0) {
        diagnostics.push({
          file: contract.id,
          line: 1,
          ruleId: `${contract.id}/unstructured-failure`,
          message: stderr.trim() || stdout.trim() || `契约检查 ${contract.id} 失败（退出码: ${code}）`,
          severity: 'error',
        })
      }

      resolve({
        ...contract,
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
        ...contract,
        code: 1,
        stdout,
        stderr: `${stderr}\n子进程拉起失败: ${err.message}`.trim(),
        diagnostics: [
          {
            file: contract.id,
            line: 1,
            ruleId: `${contract.id}/process-error`,
            message: `子进程拉起失败: ${err.message}`,
            severity: 'error',
          },
        ],
        jsonSummary: null,
      })
    })
  })
}

async function main() {
  const startedAt = new Date().toISOString()
  const startTs = Date.now()

  const results = await Promise.all(CONTRACTS.map(runContract))
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
        id: r.id,
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
          code: 'CONTRACT_VIOLATION',
          message: `${failures.length} of ${results.length} contract checks failed.`,
          category: 'static_contract',
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
      type: 'none',
      details: null,
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
    console.error('\n✖ [check:contracts] 规范契约门禁检查未通过：\n')
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
    process.exit(1)
  }

  if (isVerbose) {
    console.log(`\n=== BrutxUI 规范契约门禁详细报告（耗时 ${durationSec}s）===`)
    for (const r of results) {
      console.log(`\n--- ${r.desc} (${r.id}) ---`)
      console.log(r.stdout)
    }
    console.log(`\n✓ contracts check passed (${results.length} checks, ${durationSec}s)`)
  } else {
    console.log('✓ contracts check passed')
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
    console.error('规范契约门禁未知异常：', err)
  }
  process.exit(1)
})
