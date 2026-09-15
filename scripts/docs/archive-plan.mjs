#!/usr/bin/env node
/**
 * 方案一键自动归档与知识地图全景自愈 CLI (pnpm doc:archive)
 *
 * 用法：
 *   pnpm doc:archive docs/plans/core/xxx.md     # 指定单篇方案一键归档
 *   pnpm doc:archive                           # 自动扫描全仓所有标记为 done 的方案批量归档
 *   pnpm doc:archive --dry-run                 # 演练模拟预检，不修改文件与 Git 状态
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ArchiveEngine } from './lib/archive-engine.mjs'

const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))

function printHelp() {
  console.log(`
BrutxUI 方案自动归档与知识地图自愈工具

用法：
  pnpm doc:archive [方案文件路径] [选项]

示例：
  pnpm doc:archive docs/plans/core/xxx.md    # 归档指定方案
  pnpm doc:archive                          # 批量归档全仓标记为 done 的方案
  pnpm doc:archive --refresh                # 刷新 docs/index.md 活跃与归档索引
  pnpm doc:archive --check                  # 校验 docs/index.md 索引一致性
  pnpm doc:archive --dry-run                # 预检模式（只读模拟）

选项：
  --refresh      刷新 docs/index.md 知识地图（不迁移方案）
  --check        校验 docs/index.md 与方案物理状态一致性
  --dry-run      仅在内存中预检并打印拟变更，不执行落盘与 Git 暂存
  -h, --help     显示帮助信息
`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('-h') || args.includes('--help')) {
    printHelp()
    return
  }

  const dryRun = args.includes('--dry-run')
  const isRefresh = args.includes('--refresh')
  const isCheck = args.includes('--check')
  const targetFiles = args.filter((a) => !a.startsWith('--') && !a.startsWith('-'))

  const engine = new ArchiveEngine({
    rootDir: ROOT,
    dryRun,
    git: true,
  })

  console.log(`\n📦 BrutxUI 方案自动归档引擎启动... ${dryRun ? '【DRY-RUN 演练预检】' : ''}\n`)

  try {
    if (isCheck) {
      console.log('🔍 校验知识地图 docs/index.md 索引一致性...')
      const checkRes = await engine.refreshIndex({ checkOnly: true })
      if (!checkRes.consistent) {
        console.error('❌ docs/index.md 知识地图索引与方案物理状态不一致。')
        console.error('👉 请运行: pnpm doc:archive --refresh 刷新索引。\n')
        process.exit(1)
      }
      console.log('✓ docs/index.md 知识地图索引一致性校验通过。\n')
      return
    }

    if (isRefresh) {
      console.log('🔄 正在基于全仓方案物理状态刷新 docs/index.md...')
      const refreshRes = await engine.refreshIndex({ checkOnly: false })
      if (refreshRes.changed) {
        if (dryRun) {
          console.log('💡 发现索引差异，但在 --dry-run 模式下未写入文件。\n')
        } else {
          console.log('✓ docs/index.md 知识地图已成功刷新并完成 Git 暂存。\n')
        }
      } else {
        console.log('✓ docs/index.md 知识地图已经是最新状态，无需变更。\n')
      }
      return
    }

    let results = []

    if (targetFiles.length > 0) {
      for (const target of targetFiles) {
        console.log(`⏳ 正在处理方案: ${target}`)
        const res = await engine.archive(target)
        results.push(res)
      }
    } else {
      console.log('🔍 扫描 docs/plans/ 下所有标记为 done 的待归档方案...')
      results = await engine.archiveAllDone()
      if (results.length === 0) {
        console.log('ℹ 未发现状态为 done 的待归档方案。\n')
        console.log('提示：若需归档正在推进的方案，可直接指定路径: pnpm doc:archive <方案路径>')
        return
      }
    }

    console.log(`\n✨ 归档处理完成！共处理 ${results.length} 篇方案：\n`)

    for (const res of results) {
      console.log(`--------------------------------------------------`)
      console.log(`✓ 方案名称:   ${res.planName}`)
      console.log(`  原物理路径: ${res.oldPath}`)
      console.log(`  新归档路径: ${res.newPath}`)
      console.log(`  归档年度:   ${res.deliveryYear} (领域: ${res.domain})`)
      console.log(`  受影响文件: ${res.changedFiles.length} 处`)
      for (const f of res.changedFiles) {
        console.log(`    - ${f}`)
      }
    }
    console.log(`--------------------------------------------------\n`)

    if (dryRun) {
      console.log('💡 当前为 Dry-run 预检模式，所有文件与 Git 状态均未修改。')
    } else {
      console.log('✓ 物理文件已迁移并固化 Frontmatter (archived + 完工日期)')
      console.log('✓ 文档内相对链接层级绝对重算完成 (深度 3 -> 4)')
      console.log('✓ 知识地图 docs/index.md 声明式投影更新完成')
      console.log('✓ 全部变更已通过 git add 精准原子暂存\n')

      const primaryName = results[0]?.planName.replace(/(方案|设计)?\.md$/, '') || '方案'
      console.log(`👉 建议提交命令:`)
      console.log(`   git commit -m "docs: 归档${primaryName}并同步知识地图"\n`)
    }
  } catch (error) {
    console.error(`\n❌ 归档引擎执行失败: ${error.message}\n`)
    process.exit(1)
  }
}

main()
