import assert from 'node:assert/strict'
import test from 'node:test'
import { compareBenchResults, parseBenchResults } from './bench-diff.mjs'

const validResult = {
    files: [
        {
            filepath: 'perf/render.bench.ts',
            groups: [
                {
                    fullName: 'perf/render.bench.ts > DataTable render',
                    benchmarks: [
                        { name: '100 rows', hz: 100 },
                        { name: '1000 rows', hz: 10 },
                    ],
                },
                {
                    fullName: 'perf/render.bench.ts > TreeView render',
                    benchmarks: [
                        { name: '100 nodes', hz: 40 },
                        { name: '1000 nodes', hz: 4 },
                    ],
                },
            ],
        },
    ],
}

test('reads Vitest 4 outputJson benchmark groups', () => {
    const tasks = parseBenchResults(validResult, 'fixture')

    assert.deepEqual([...tasks], [
        ['perf/render.bench.ts > DataTable render > 100 rows', 100],
        ['perf/render.bench.ts > DataTable render > 1000 rows', 10],
        ['perf/render.bench.ts > TreeView render > 100 nodes', 40],
        ['perf/render.bench.ts > TreeView render > 1000 nodes', 4],
    ])
})

test('rejects empty data and the previous reporter shape', () => {
    assert.throws(() => parseBenchResults({ files: [] }, 'empty fixture'), /没有可用的 bench 任务/)
    assert.throws(() => parseBenchResults({ files: [{ tasks: [{ name: '100 rows', result: { hz: 100 } }] }] }, 'old fixture'), /缺少 groups 数组/)
    assert.throws(() => parseBenchResults({ files: [{ groups: [{ fullName: 'render' }] }] }, 'invalid group'), /无效的 bench group/)
})

test('reports missing tasks as incomplete while keeping timing changes informational', () => {
    const mainTasks = parseBenchResults(validResult, 'main')
    const prTasks = new Map([
        ['perf/render.bench.ts > DataTable render > 100 rows', 90],
        ['perf/render.bench.ts > DataTable render > 1000 rows', 10],
        ['perf/render.bench.ts > TreeView render > 100 nodes', 40],
    ])

    const report = compareBenchResults(mainTasks, prTasks)

    assert.equal(report.complete, false)
    assert.match(report.markdown, /-10\.0% \(疑似回归\)/)
    assert.match(report.markdown, /1000 nodes.*数据缺失/)
    assert.match(report.markdown, /PR 缺少 1 个主干基准任务/)
})

test('does not turn timing regressions into a failing data status', () => {
    const mainTasks = new Map([['DataTable render > 100 rows', 100]])
    const prTasks = new Map([['DataTable render > 100 rows', 80]])

    const report = compareBenchResults(mainTasks, prTasks)

    assert.equal(report.complete, true)
    assert.match(report.markdown, /疑似回归 1 个/)
    assert.match(report.markdown, /性能变化仅作信息性参考/)
})
