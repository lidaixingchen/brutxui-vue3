/**
 * bench-diff.mjs — 性能基准 PR 对比脚本（§4.1）
 *
 * 用法：
 *   node scripts/bench-diff.mjs bench-main.json bench-pr.json
 *
 * 读取两份 vitest bench --reporter=json 输出，按 task name 对齐，
 * 输出 markdown 表格（task name / main hz / pr hz / 变化%）+ 结论摘要。
 *
 * 阈值说明（基于 GitHub-hosted runner 上 tinybench 的 rme 经验值，通常 3–8%）：
 *   |delta| < 5%  → 噪声范围内
 *   delta < -5%   → 疑似回归
 *   delta > 5%    → 改善
 *
 * 退出码：
 *   0 — 正常输出报告（bench 结果不作门禁）
 *   1 — 输入文件读取失败
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const NOISE_THRESHOLD = 0.05 // 5%
const REGRESSION_FLAG_LIMIT = 2 // 疑似回归超过 2 个时提示人工复核

function loadBenchResult(filePath) {
    try {
        const raw = readFileSync(resolve(filePath), 'utf-8')
        return JSON.parse(raw)
    } catch (err) {
        console.error(`Failed to read bench JSON: ${filePath}`)
        console.error(err.message)
        process.exit(1)
    }
}

/**
 * vitest bench --reporter=json 输出格式（关键字段）：
 *   files: [{ tasks: [{ name, result: { hz, ... } }] }]
 * 顶层也可能直接是 tasks 数组。这里兼容两种结构。
 */
function extractTasks(parsed) {
    const tasks = []
    const fileEntries = parsed.files ?? []
    for (const file of fileEntries) {
        const fileTasks = file.tasks ?? []
        for (const task of fileTasks) {
            if (task.result && typeof task.result.hz === 'number') {
                tasks.push({ name: task.name, hz: task.result.hz })
            }
        }
    }
    // 兼容顶层 tasks（无 files 包装）
    if (tasks.length === 0 && Array.isArray(parsed.tasks)) {
        for (const task of parsed.tasks) {
            if (task.result && typeof task.result.hz === 'number') {
                tasks.push({ name: task.name, hz: task.result.hz })
            }
        }
    }
    return tasks
}

function formatHz(hz) {
    if (!isFinite(hz)) return 'N/A'
    if (hz >= 1000) return `${(hz / 1000).toFixed(2)}k`
    return hz.toFixed(2)
}

function classifyDelta(delta) {
    if (Math.abs(delta) < NOISE_THRESHOLD) return '噪声范围内'
    if (delta < 0) return '疑似回归'
    return '改善'
}

function main() {
    const [mainPath, prPath] = process.argv.slice(2)
    if (!mainPath || !prPath) {
        console.error('Usage: node scripts/bench-diff.mjs <bench-main.json> <bench-pr.json>')
        process.exit(1)
    }

    const mainTasks = new Map(
        extractTasks(loadBenchResult(mainPath)).map(t => [t.name, t.hz]),
    )
    const prTasks = extractTasks(loadBenchResult(prPath))

    const rows = []
    let regressionCount = 0

    for (const { name, hz: prHz } of prTasks) {
        const mainHz = mainTasks.get(name)
        if (mainHz === undefined) {
            rows.push(`| ${name} | — | ${formatHz(prHz)} | 新增基准 |`)
            continue
        }
        const delta = (prHz - mainHz) / mainHz
        const label = classifyDelta(delta)
        if (label === '疑似回归') regressionCount += 1
        rows.push(
            `| ${name} | ${formatHz(mainHz)} | ${formatHz(prHz)} | ${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}% (${label}) |`,
        )
    }

    const lines = [
        '## Performance Bench Report',
        '',
        '| Task | main (hz) | PR (hz) | 变化 |',
        '| --- | --- | --- | --- |',
        ...rows,
        '',
    ]

    if (regressionCount > REGRESSION_FLAG_LIMIT) {
        lines.push(
            `> ⚠️ 检测到 ${regressionCount} 个疑似回归（阈值 ${REGRESSION_FLAG_LIMIT}），建议维护者人工复核后再合并。`,
        )
    } else {
        lines.push(
            `> 疑似回归 ${regressionCount} 个（≤ 阈值 ${REGRESSION_FLAG_LIMIT}），bench 结果仅作信息性参考。`,
        )
    }

    console.log(lines.join('\n'))
}

main()
