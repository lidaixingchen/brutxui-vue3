#!/usr/bin/env node
/**
 * 全量文档健康度门禁聚合工具（check:docs）
 *
 * 设计哲学（Unix Rule of Silence 变体 + Agent Result Envelope 协议）：
 *   - 纯只读文档与 AST 静态扫描，多任务异步高并发调度；
 *   - 默认模式：遵循 Unix 沉默原则，成功输出单行极简确认（~0.3s），失败打破静默精准定位；
 *   - --json 模式：输出严格的 Agent Result Envelope 结构（status、result、error、control、effect、meta），
 *     五态状态机建模（success / partial_success / error），提供结构化建议自愈动作（suggested_actions）。
 *
 * 聚合检查项：
 *   1. links: 文档内部相对链接与绝对路径检查 (check-doc-links.mjs check)
 *   2. status: 方案 Frontmatter 与生命周期契约守卫 (scan-doc-status.mjs --check)
 *   3. guides: 规范指南类名禁令守卫 (check-guide-conventions.mjs)
 *   4. refs: 已废弃/删除符号拦截与组件文档存在性 (check-guide-refs.mjs)
 *   5. templates: 组件双语使用文档必须章节结构 (check-doc-template.mjs)
 *
 * 用法：
 *   pnpm check:docs            # 默认高频自检（全绿极简确认；失败精准定位）
 *   pnpm check:docs --fix      # 自动修复链接等可自愈项目后复测
 *   pnpm check:docs --json     # 输出机器可读的 Result Envelope JSON
 *   pnpm check:docs --verbose  # 展开各项详细执行日志
 */

import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))

const isFix = process.argv.includes('--fix')
const isJson = process.argv.includes('--json')
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')

const CHECKS = [
  {
    name: 'links',
    desc: '文档链接与绝对路径',
    cmd: process.execPath,
    args: ['scripts/docs/check-doc-links.mjs', 'check'],
    action: {
      type: 'auto_fix',
      command: 'pnpm check:docs:fix',
      description: '自动扫描并纠偏文档内的相对链接路径。',
    },
  },
  {
    name: 'status',
    desc: '方案 Frontmatter 契约',
    cmd: process.execPath,
    args: ['scripts/docs/scan-doc-status.mjs', '--check'],
    action: {
      type: 'manual_fix',
      command: null,
      description: '请检查并补充方案文档顶部的标准 YAML Frontmatter（title、status、author 等）。',
    },
  },
  {
    name: 'guides',
    desc: '规范指南类名守卫',
    cmd: process.execPath,
    args: ['scripts/docs/check-guide-conventions.mjs'],
    action: {
      type: 'manual_fix',
      command: null,
      description: '请移除指南文档中已被废弃的类名或过时约定。',
    },
  },
  {
    name: 'refs',
    desc: '废弃符号与组件覆盖',
    cmd: process.execPath,
    args: ['scripts/check-guide-refs.mjs'],
    action: {
      type: 'manual_fix',
      command: null,
      description: '指南中引用了已删除符号或缺少组件对应文档，请按指引补充或删除。',
    },
  },
  {
    name: 'templates',
    desc: '组件使用文档章节规范',
    cmd: process.execPath,
    args: ['scripts/check-doc-template.mjs'],
    action: {
      type: 'manual_fix',
      command: null,
      description: '组件使用文档缺失必要章节（如用法、API 或无障碍说明），请补全对应章节。',
    },
  },
]

function runCheck(check) {
  return new Promise((resolve) => {
    const child = spawn(check.cmd, check.args, {
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
        ...check,
        code: code ?? 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      })
    })

    child.on('error', (err) => {
      resolve({
        ...check,
        code: 1,
        stdout,
        stderr: `${stderr}\n子进程执行异常: ${err.message}`.trim(),
      })
    })
  })
}

function handleFix() {
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
        id: r.name,
        desc: r.desc,
        status: r.code === 0 ? 'success' : 'error',
        exit_code: r.code,
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

  // 1. --json 模式：输出机器可读的结构化 Result Envelope
  if (isJson) {
    console.log(JSON.stringify(envelope, null, 2))
    if (status !== 'success') {
      process.exit(1)
    }
    return
  }

  // 2. 人类/CLI 文本模式：存在失败
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

  // 3. 人类/CLI 文本模式：全部成功
  if (isVerbose) {
    console.log(`\n=== BrutxUI 文档健康度巡检详细报告（耗时 ${durationSec}s）===`)
    for (const r of results) {
      console.log(`\n--- ${r.desc} (${r.name}) ---`)
      console.log(r.stdout)
    }
    console.log(`\n✓ docs check passed (${results.length} checks, ${durationSec}s)`)
  } else {
    // 遵循 Unix 沉默原则：全绿极简确认
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
          control: { retry: { allowed: false }, suggested_actions: [] },
          effect: { type: 'none' },
          meta: { error: err.stack },
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
