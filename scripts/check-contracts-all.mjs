#!/usr/bin/env node
/**
 * 全量代码与规范契约门禁聚合工具（check:contracts）
 *
 * 设计哲学（Unix Rule of Silence 变体 + Agent Result Envelope 协议）：
 *   - 纯只读源码与 AST 静态扫描，多任务异步高并发调度；
 *   - 默认模式：遵循 Unix 沉默原则，成功输出单行极简确认（~1.6s），失败打破静默精准定位；
 *   - --json 模式：输出严格的 Agent Result Envelope 结构（status、result、error、control、effect、meta），
 *     五态状态机建模（success / partial_success / error），提供结构化建议自愈动作（suggested_actions）。
 *
 * 聚合检查项（纯静态只读，免 build）：
 *   1. phantom-deps: Monorepo 幽灵依赖扫描（scripts/scan-phantom-deps.mjs）
 *   2. fallback-vars: 设计令牌 fallback 覆盖率基线守卫（packages/ui/scripts/audit-brutal-fallback.ts）
 *   3. class-literals: Tailwind @source 源码完整类名字面量规约（packages/ui/scripts/check-class-literals.ts）
 *   4. deprecated-utils: 已废弃工具类防回潮基线守卫（packages/ui/scripts/check-deprecated-utilities.ts）
 *   5. tokens-alignment: CLI brutalist.css 与 UI 令牌同步性守卫（packages/cli/scripts/check-brutalist-tokens.ts）
 *   6. exports-sync: 组件重导出、manifest 新鲜度与 package exports 同步守卫（packages/ui/scripts/check-exports.ts）
 *
 * 用法：
 *   pnpm check:contracts            # 默认高频自检（全绿极简确认；失败精准定位）
 *   pnpm check:contracts --json     # 输出机器可读的 Result Envelope JSON
 *   pnpm check:contracts --verbose  # 展开各项详细执行日志
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(new URL('../', import.meta.url)))
const isJson = process.argv.includes('--json')
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')

// 定位 tsx cli 入口，直接通过 node 启动以规避 pnpm/npx 跨平台子进程包装开销
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
      command: 'pnpm --filter brutx-ui-vue prebuild:tokens',
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
    const child = spawn(contract.cmd, contract.args, {
      cwd: ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        ...contract,
        code: code ?? 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      })
    })

    child.on('error', (err) => {
      resolve({
        ...contract,
        code: 1,
        stdout,
        stderr: `${stderr}\n子进程拉起失败: ${err.message}`.trim(),
      })
    })
  })
}

async function main() {
  const startedAt = new Date().toISOString()
  const startTs = Date.now()

  // 并发拉起所有契约检查
  const results = await Promise.all(CONTRACTS.map(runContract))
  const finishedAt = new Date().toISOString()
  const durationMs = Date.now() - startTs
  const durationSec = (durationMs / 1000).toFixed(2)

  const failures = results.filter((r) => r.code !== 0)
  const successes = results.filter((r) => r.code === 0)

  // 状态机判定：success / partial_success / error
  let status = 'success'
  if (failures.length === results.length) {
    status = 'error'
  } else if (failures.length > 0) {
    status = 'partial_success'
  }

  // 构建统一 Agent Result Envelope
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

  // 1. --json 模式：输出机器可读的结构化 Result Envelope
  if (isJson) {
    console.log(JSON.stringify(envelope, null, 2))
    if (status !== 'success') {
      process.exit(1)
    }
    return
  }

  // 2. 人类/CLI 文本模式：存在失败项打破静默
  if (failures.length > 0) {
    console.error(`\n✖ [check:contracts] 代码契约门禁未通过（耗时 ${durationSec}s）：\n`)
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

  // 3. 人类/CLI 文本模式：全部通过
  if (isVerbose) {
    console.log(`\n=== BrutxUI 代码契约门禁巡检报告（耗时 ${durationSec}s）===`)
    for (const r of results) {
      console.log(`\n--- ${r.desc} (${r.id}) ---`)
      console.log(r.stdout || '(无控制台输出)')
    }
    console.log(`\n✓ contracts check passed (${results.length} checks, ${durationSec}s)`)
  } else {
    // Unix 沉默原则：全绿极简单行确认
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
          control: { retry: { allowed: false }, suggested_actions: [] },
          effect: { type: 'none' },
          meta: { error: err.stack },
        },
        null,
        2,
      ),
    )
  } else {
    console.error('契约门禁执行发生未知异常：', err)
  }
  process.exit(1)
})
