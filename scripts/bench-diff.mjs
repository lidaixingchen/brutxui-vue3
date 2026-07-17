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
 * 错误处理：
 *   任何输入/解析失败均不硬退出（不调用 process.exit(1)），而是输出结构化
 *   markdown 错误报告到 stdout，供下游 PR 评论步骤展示（避免空评论）。
 *   这是有意为之：bench.yml 的 "Generate diff report" 步骤未设置 continue-on-error，
 *   一旦本脚本以非 0 退出，后续 Find/Create comment 步骤将不会执行，
 *   PR 评论无法创建，结构化错误报告也就无法触达维护者。错误详情仅同步打印到
 *   stderr 供 CI 日志排查。
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const NOISE_THRESHOLD = 0.05 // 5%
const REGRESSION_FLAG_LIMIT = 2 // 疑似回归超过 2 个时提示人工复核

class BenchDiffError extends Error {
    constructor(message, { cause } = {}) {
        super(message, { cause })
        this.name = 'BenchDiffError'
    }
}

function loadBenchResult(filePath) {
    let raw
    try {
        raw = readFileSync(resolve(filePath), 'utf-8')
    } catch (err) {
        throw new BenchDiffError(
            `无法读取基准文件 \`${filePath}\`：${err.message}。请检查 baseline artifact 是否上传成功，或重试 workflow。`,
            { cause: err },
        )
    }
    try {
        return JSON.parse(raw)
    } catch (err) {
        throw new BenchDiffError(
            `基准文件 \`${filePath}\` JSON 解析失败：${err.message}。可能 vitest bench 输出被截断或包含非 JSON 日志。`,
            { cause: err },
        )
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

    try {
        if (!mainPath || !prPath) {
            throw new BenchDiffError(
                '参数缺失。用法：`node scripts/bench-diff.mjs <bench-main.json> <bench-pr.json>`。请检查 workflow 配置。',
            )
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
    } catch (err) {
        // 输出结构化错误报告到 stdout（落入 bench-report.md），确保 PR 评论有内容可展示。
        const errLines = [
            '## ⚠️ Performance Bench Report — 基准数据缺失',
            '',
            `> **错误类型**：${err.name}`,
            '',
            `> **详情**：${err.message}`,
            '',
            'bench 对比未能完成，结果仅作信息性参考。请维护者检查 baseline artifact 是否上传成功、vitest bench 是否正常退出，或重试本 workflow。',
        ]
        if (err.cause?.message) {
            errLines.push(
                '',
                '<details><summary>底层错误</summary>',
                '',
                `\`${err.cause.message}\``,
                '',
                '</details>',
            )
        }
        console.log(errLines.join('\n'))
        // 同步打印到 stderr，便于 CI 日志排查；不 exit(1) 以确保下游 PR 评论步骤仍可执行。
        console.error(`[bench-diff] ${err.name}: ${err.message}`)
        if (err.cause) console.error(`[bench-diff] cause: ${err.cause.message}`)
    }
}

main()
