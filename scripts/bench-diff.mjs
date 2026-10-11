import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const NOISE_THRESHOLD = 0.05
const REGRESSION_FLAG_LIMIT = 2

export class BenchDiffError extends Error {
    constructor(message, { cause } = {}) {
        super(message, { cause })
        this.name = 'BenchDiffError'
    }
}

export function parseBenchResults(parsed, source) {
    if (!parsed || !Array.isArray(parsed.files)) {
        throw new BenchDiffError(`${source} 不是 Vitest 4 bench JSON：缺少 files 数组。`)
    }

    const tasks = new Map()
    for (const file of parsed.files) {
        if (!Array.isArray(file.groups)) {
            throw new BenchDiffError(`${source} 的 ${file.filepath ?? '未知文件'} 缺少 groups 数组。`)
        }

        for (const group of file.groups) {
            if (typeof group.fullName !== 'string' || !Array.isArray(group.benchmarks)) {
                throw new BenchDiffError(`${source} 中存在无效的 bench group。`)
            }

            for (const benchmark of group.benchmarks) {
                if (typeof benchmark.name !== 'string' || benchmark.name.trim() === '') {
                    throw new BenchDiffError(`${source} 中存在缺少名称的 bench 任务。`)
                }
                if (typeof benchmark.hz !== 'number' || !Number.isFinite(benchmark.hz) || benchmark.hz <= 0) {
                    throw new BenchDiffError(`${source} 中任务「${benchmark.name}」缺少有效 hz 数据。`)
                }

                const name = `${group.fullName} > ${benchmark.name}`
                if (tasks.has(name)) throw new BenchDiffError(`${source} 中任务「${name}」重复。`)
                tasks.set(name, benchmark.hz)
            }
        }
    }

    if (tasks.size === 0) throw new BenchDiffError(`${source} 没有可用的 bench 任务。`)
    return tasks
}

function loadBenchResults(filePath) {
    let raw
    try {
        raw = readFileSync(resolve(filePath), 'utf8')
    } catch (error) {
        throw new BenchDiffError(`无法读取基准文件「${filePath}」：${error.message}。`, { cause: error })
    }

    let parsed
    try {
        parsed = JSON.parse(raw)
    } catch (error) {
        throw new BenchDiffError(`基准文件「${filePath}」JSON 解析失败：${error.message}。`, { cause: error })
    }
    return parseBenchResults(parsed, `基准文件「${filePath}」`)
}

function formatHz(hz) {
    if (hz >= 1000) return `${(hz / 1000).toFixed(2)}k`
    return hz.toFixed(2)
}

function classifyDelta(delta) {
    if (Math.abs(delta) < NOISE_THRESHOLD) return '噪声范围内'
    if (delta < 0) return '疑似回归'
    return '改善'
}

export function compareBenchResults(mainTasks, prTasks) {
    const rows = []
    let regressionCount = 0
    let missingCount = 0

    for (const [name, mainHz] of mainTasks) {
        const prHz = prTasks.get(name)
        if (prHz === undefined) {
            missingCount += 1
            rows.push(`| ${name} | ${formatHz(mainHz)} | 缺失 | 数据缺失 |`)
            continue
        }

        const delta = (prHz - mainHz) / mainHz
        const label = classifyDelta(delta)
        if (label === '疑似回归') regressionCount += 1
        rows.push(`| ${name} | ${formatHz(mainHz)} | ${formatHz(prHz)} | ${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}% (${label}) |`)
    }

    for (const [name, prHz] of prTasks) {
        if (!mainTasks.has(name)) rows.push(`| ${name} | — | ${formatHz(prHz)} | 新增基准 |`)
    }

    const lines = [
        '## Performance Bench Report',
        '',
        '| Task | main (hz) | PR (hz) | 变化 |',
        '| --- | --- | --- | --- |',
        ...rows,
        '',
    ]

    if (missingCount > 0) {
        lines.push(`> ⚠️ PR 缺少 ${missingCount} 个主干基准任务，Bench 数据不完整。`)
    } else {
        lines.push(`> 疑似回归 ${regressionCount} 个（提示阈值 ${REGRESSION_FLAG_LIMIT}），性能变化仅作信息性参考。`)
    }

    return { markdown: lines.join('\n'), complete: missingCount === 0 }
}

function renderErrorReport(error) {
    const lines = [
        '## ⚠️ Performance Bench Report — 基准数据缺失',
        '',
        `> **错误类型**：${error.name}`,
        '',
        `> **详情**：${error.message}`,
        '',
        'Bench 对比未能完成，工作流将以失败状态结束。性能波动仍只作信息性参考。',
    ]
    if (error.cause?.message) lines.push('', `<details><summary>底层错误</summary>`, '', `\`${error.cause.message}\``, '', '</details>')
    return lines.join('\n')
}

export function validateBenchFile(filePath) {
    return loadBenchResults(filePath)
}

export function createBenchReport(mainPath, prPath) {
    const mainTasks = loadBenchResults(mainPath)
    const prTasks = loadBenchResults(prPath)
    return compareBenchResults(mainTasks, prTasks)
}

export function run(argv) {
    try {
        if (argv.length === 2 && argv[0] === '--validate') {
            const tasks = validateBenchFile(argv[1])
            console.log(`有效 Vitest bench JSON：${tasks.size} 个任务。`)
            return 0
        }
        if (argv.length !== 2) {
            throw new BenchDiffError('参数错误。用法：`node scripts/bench-diff.mjs <bench-main.json> <bench-pr.json>` 或 `node scripts/bench-diff.mjs --validate <bench.json>`。')
        }

        const report = createBenchReport(argv[0], argv[1])
        console.log(report.markdown)
        if (!report.complete) {
            console.error('[bench-diff] PR 基准任务缺失。')
            return 1
        }
        return 0
    } catch (error) {
        const benchError = error instanceof BenchDiffError
            ? error
            : new BenchDiffError(error instanceof Error ? error.message : String(error), { cause: error })
        console.log(renderErrorReport(benchError))
        console.error(`[bench-diff] ${benchError.name}: ${benchError.message}`)
        return 1
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = run(process.argv.slice(2))
}
