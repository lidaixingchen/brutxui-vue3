#!/usr/bin/env node
/**
 * 仓库 markdown 链接检查与自愈工具
 *
 * 定位：守护 docs/、AGENTS.md、README.md 与技能文档的 markdown 链接健康——
 *   - 文档移动 / 归档后动态拓扑重算相对链接深度；
 *   - 清除 file:/// 绝对链接；
 *   - Windows 11 下原生穿透大小写核验，消除 Linux CI 404 盲区；
 *   - 历史快照源码失效自动静默聚合降噪；
 *   - 纯动态无状态架构，无须维护任何历史别名映射表。
 *
 * 用法：
 *   node scripts/docs/check-doc-links.mjs check        # 校验：报告死链 / 绝对链接 / 大小写 / 锚点
 *   node scripts/docs/check-doc-links.mjs fix --dry    # 预览自愈改写（不落盘）
 *   node scripts/docs/check-doc-links.mjs fix          # 执行无损原位改写
 *   node scripts/docs/check-doc-links.mjs check --json # 输出 Agent Result Envelope 结构
 */

import path from 'node:path'
import { getRepoRoot } from '../shared/path.mjs'
import { DocLinkEngine } from './lib/doc-link-engine.mjs'
import { DiskFileSystemAdapter } from './lib/doc-link-fs.mjs'

const ROOT = getRepoRoot()
const args = process.argv.slice(2)
const mode = args.find((a) => a === 'check' || a === 'fix') ?? 'check'
const dryRun = mode === 'fix' && args.includes('--dry')
const verbose = args.includes('--verbose') || process.argv.includes('-v')
const isJson = process.argv.includes('--json')

const fsAdapter = new DiskFileSystemAdapter()
const engine = new DocLinkEngine(fsAdapter, {
  rootDir: ROOT,
  verbose,
})

async function run() {
  if (mode === 'check') {
    const report = await engine.scan()

    if (isJson) {
      const diagnostics = []

      // 1. 死链
      for (const d of report.dead) {
        diagnostics.push({
          file: d.rel,
          line: d.line,
          ruleId: 'doc-links/dead-link',
          message: `链接目标不存在: ${d.target}（${d.reason}）${d.heuristicFix ? `，建议自愈为: ${d.heuristicFix}` : ''}`,
          severity: 'error',
        })
      }

      // 2. 绝对路径
      for (const a of report.absLinks) {
        diagnostics.push({
          file: a.rel,
          line: a.line,
          ruleId: 'doc-links/absolute-path',
          message: `发现绝对物理路径引用残留: ${a.rawTarget}，应改为相对路径`,
          severity: 'error',
        })
      }

      // 3. 大小写错误
      for (const c of report.caseErrors) {
        diagnostics.push({
          file: c.rel,
          line: c.line,
          ruleId: 'doc-links/casing-mismatch',
          message: `路径大小写与物理磁盘不吻合: ${c.target}（磁盘真实路径应为: ${c.realTarget}）`,
          severity: 'error',
        })
      }

      // 4. 锚点警告
      for (const w of report.anchorWarn) {
        diagnostics.push({
          file: w.rel,
          line: w.line,
          ruleId: 'doc-links/missing-anchor',
          message: `目标文档缺少对应标题锚点: #${w.anchor}`,
          severity: 'warning',
        })
      }

      // 5. 常青区失效源码引用
      const tier1Stale = report.staleSnapshots.filter((s) => !s.isSnapshot)
      for (const s of tier1Stale) {
        diagnostics.push({
          file: s.rel,
          line: s.line,
          ruleId: 'doc-links/stale-source-reference',
          message: `常青规范引用的源码路径已失效: ${s.target}`,
          severity: 'warning',
        })
      }

      const totalErrors = report.dead.length + report.absLinks.length + report.caseErrors.length
      const isClean = totalErrors === 0

      const envelope = {
        status: isClean ? 'success' : 'error',
        summary: isClean
          ? `Doc links check: passed (${report.scannedCount} markdown files scanned)`
          : `Doc links check: ${totalErrors} link violations detected`,
        diagnostics,
        result: {
          scannedCount: report.scannedCount,
          deadCount: report.dead.length,
          absLinksCount: report.absLinks.length,
          caseErrorsCount: report.caseErrors.length,
          anchorWarnCount: report.anchorWarn.length,
          staleSnapshotsCount: report.staleSnapshots.length,
        },
      }
      console.log(JSON.stringify(envelope, null, 2))
      process.exit(isClean ? 0 : 1)
    }

    console.log(`[check] 扫描 ${report.scannedCount} 个 md 文件`)

    // 1. 死链
    if (report.dead.length > 0) {
      console.log(`[check] ✗ 死链 ${report.dead.length} 处：`)
      report.dead.forEach((d) => {
        const hint = d.heuristicFix ? `（智能推荐自愈为：${d.heuristicFix}）` : ''
        console.log(`  ${d.rel}:${d.line} → ${d.target}（${d.reason}）${hint}`)
      })
    } else {
      console.log(`[check] ✓ 死链 0 处`)
    }

    // 2. file:/// 绝对路径
    if (report.absLinks.length > 0) {
      console.log(`[check] ✗ file:/// 绝对链接 ${report.absLinks.length} 处：`)
      report.absLinks.forEach((a) => {
        console.log(`  ${a.rel}:${a.line} → ${a.target}`)
      })
    } else {
      console.log(`[check] ✓ file:/// 绝对链接 0 处`)
    }

    // 3. 跨平台大小写不匹配
    if (report.caseErrors.length > 0) {
      console.log(`[check] ✗ 路径大小写不匹配（Linux CI 隐患） ${report.caseErrors.length} 处：`)
      report.caseErrors.forEach((c) => {
        console.log(`  ${c.rel}:${c.line} → ${c.target}（真实路径应为：${c.realTarget}）`)
      })
    } else {
      console.log(`[check] ✓ 路径大小写全匹配 0 错误`)
    }

    // 4. 锚点告警
    if (report.anchorWarn.length > 0) {
      console.log(
        `[check] ⚠ 锚点未匹配告警 ${report.anchorWarn.length} 处${verbose ? '：' : '（加 --verbose 展开）'}`
      )
      if (verbose) {
        report.anchorWarn.forEach((w) => {
          console.log(`  ${w.rel}:${w.line} → ${w.target}#${w.anchor}（目标标题找不到对应 slug）`)
        })
      }
    }

    // 5. 源码引用失效（生命周期分层与静默降噪）
    if (report.staleSnapshots.length > 0) {
      const snapshotCount = report.staleSnapshots.filter((s) => s.isSnapshot).length
      const tier1Stale = report.staleSnapshots.filter((s) => !s.isSnapshot)

      if (tier1Stale.length > 0) {
        console.log(`[check] ⚠ 常青文档源码引用失效 ${tier1Stale.length} 处：`)
        tier1Stale.forEach((s) => console.log(`  ${s.rel}:${s.line} → ${s.target}（${s.reason}）`))
      }

      if (snapshotCount > 0) {
        console.log(
          `[check] ℹ 历史快照源码引用已失效 ${snapshotCount} 处（时间点快照静默收敛${verbose ? '，如下' : '，加 --verbose 展开'}）`
        )
        if (verbose) {
          report.staleSnapshots
            .filter((s) => s.isSnapshot)
            .forEach((s) => console.log(`  ${s.rel}:${s.line} → ${s.target}`))
        }
      }
    }

    const failed = report.failed
    console.log(
      `[check] 结论：${failed ? `未通过（死链 ${report.dead.length}、绝对路径 ${report.absLinks.length}、大小写 ${report.caseErrors.length}）` : '通过（0 死链、0 绝对链接、0 大小写错误）'}`
    )
    process.exitCode = failed ? 1 : 0
  } else if (mode === 'fix') {
    const result = await engine.fix(dryRun)

    for (const item of result.changeLog) {
      console.log(`[fix${dryRun ? ':dry' : ''}] ${item.rel}：${item.count} 处链接已纠偏`)
    }

    console.log(
      `[fix${dryRun ? ':dry' : ''}] 处理完成：${result.changedFiles} 个文件、约 ${result.changedLinks} 处链接`
    )
  } else {
    console.error(`用法：node scripts/docs/check-doc-links.mjs <check|fix [--dry]> [--verbose] [--json]`)
    process.exitCode = 2
  }
}

run().catch((err) => {
  console.error('[check-doc-links] 执行异常:', err)
  process.exitCode = 1
})
