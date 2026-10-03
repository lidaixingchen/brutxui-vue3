import { describe, expect, it } from 'vitest'
import { createChartModel, createChartTicks, chartYPosition, createPieGeometry, type ChartModel, type ChartDataItem, type ChartType, type PieGeometry } from './sketchy-chart-data'

function items(values: number[]): ChartDataItem[] {
    return values.map((value: number, index: number): ChartDataItem => ({ label: String(index), value }))
}

describe('图表数据契约', (): void => {
    it('完整保留类别、原始序号和数值符号', (): void => {
        const model: ChartModel = createChartModel(items([-5, 0, 10]), 'bar')
        expect(model.items.map((item: ChartDataItem): number => item.value)).toEqual([-5, 0, 10])
        expect(chartYPosition(-5, model)).toBe(1)
        expect(chartYPosition(10, model)).toBe(0)
        expect(chartYPosition(0, model)).toBeCloseTo(2 / 3)
    })

    it.each<ChartType>(['line', 'bar', 'pie'])('保留 %s 的全部 31 个类别', (type: ChartType): void => {
        const model: ChartModel = createChartModel(items(Array<number>(31).fill(1)), type)
        expect(model.items).toHaveLength(31)
        expect(model.items[30].index).toBe(30)
        if (type === 'pie') expect(model.items.every((item): boolean => item.percentage === 1 / 31)).toBe(true)
    })

    it.each([NaN, Infinity, -Infinity])('含 %s 时整张图无效且保留原始数据', (value: number): void => {
        const model: ChartModel = createChartModel(items([1, value]), 'line')
        expect(model.state).toBe('invalid')
        expect(model.items[0].valid).toBe(true)
        expect(model.items[1].valid).toBe(false)
    })

    it('负值饼图无效且所有占比均不可计算', (): void => {
        const model: ChartModel = createChartModel(items([1, -1]), 'pie')
        expect(model.state).toBe('invalid')
        expect(model.items.every((item): boolean => item.percentage === undefined)).toBe(true)
        expect(createPieGeometry(model, 600, 400)).toEqual([])
    })

    it('区分空数组、全零笛卡尔图和全零饼图', (): void => {
        expect(createChartModel([], 'line').state).toBe('empty')
        const line: ChartModel = createChartModel(items([0, 0]), 'line')
        expect(line.state).toBe('ready')
        expect(chartYPosition(0, line)).toBe(0.5)
        const pie: ChartModel = createChartModel(items([0, 0]), 'pie')
        expect(pie.state).toBe('zero-total')
        expect(pie.items).toHaveLength(2)
        expect(pie.items[0].percentage).toBeUndefined()
    })

    it.each([[5, 5], [500], [-500]])('同值和单点 %s 保持实际数值域', (...values: number[]): void => {
        const model: ChartModel = createChartModel(items(values), 'line')
        expect(model.minimum * model.scale).toBe(Math.min(0, ...values))
        expect(model.maximum * model.scale).toBe(Math.max(0, ...values))
    })

    it('有限最大值的饼图求和保持正确占比', (): void => {
        const model: ChartModel = createChartModel(items([Number.MAX_VALUE, Number.MAX_VALUE]), 'pie')
        expect(model.items.map((item): number | undefined => item.percentage)).toEqual([0.5, 0.5])
        for (const slice of createPieGeometry(model, 600, 400)) expect(slice.path).not.toMatch(/NaN|Infinity/)
    })

    it('正负最大值的坐标和刻度均有限', (): void => {
        const model: ChartModel = createChartModel(items([-Number.MAX_VALUE, Number.MAX_VALUE]), 'line')
        expect(chartYPosition(-Number.MAX_VALUE, model)).toBe(1)
        expect(chartYPosition(0, model)).toBe(0.5)
        expect(chartYPosition(Number.MAX_VALUE, model)).toBe(0)
        createChartTicks(model, (value: number): string => {
            expect(Number.isFinite(value)).toBe(true)
            return String(value)
        })
    })

    it('极小值可单独绘制，下溢项仍保留原始读数', (): void => {
        expect(chartYPosition(Number.MIN_VALUE, createChartModel(items([Number.MIN_VALUE]), 'line'))).toBe(0)
        const model: ChartModel = createChartModel(items([Number.MIN_VALUE, Number.MAX_VALUE]), 'pie')
        expect(model.items[0].value).toBe(Number.MIN_VALUE)
        expect(model.items[0].valid).toBe(true)
        expect(model.items).toHaveLength(2)
    })

    it('无法推进角度的极小饼图项不生成扇区且保留原始读数', (): void => {
        const cases: ReadonlyArray<{ values: number[]; visibleIndices: number[] }> = [
            { values: [Number.MIN_VALUE, 1], visibleIndices: [1] },
            { values: [0.5, Number.MIN_VALUE, 0.5], visibleIndices: [0, 2] },
            { values: [1, Number.MIN_VALUE], visibleIndices: [0] },
            { values: [1e-15, Number.MAX_VALUE], visibleIndices: [1] },
        ]
        for (const testCase of cases) {
            const model: ChartModel = createChartModel(items(testCase.values), 'pie')
            expect(model.items.map((item: ChartDataItem): number => item.value)).toEqual(testCase.values)
            const slices: PieGeometry[] = createPieGeometry(model, 600, 400)
            expect(slices.map((slice: PieGeometry): number => slice.index)).toEqual(testCase.visibleIndices)
            expect(slices[0].startFraction).toBe(0)
            expect(slices[slices.length - 1].endFraction).toBe(1)
            for (const slice of slices) expect(slice.endFraction).toBeGreaterThan(slice.startFraction)
        }
        const middleModel: ChartModel = createChartModel(items([0.5, Number.MIN_VALUE, 0.5]), 'pie')
        expect(middleModel.items[1].percentage).toBeGreaterThan(0)
    })

    it('零值不生成扇区，单个正值使用两段弧线形成完整圆', (): void => {
        const slices = createPieGeometry(createChartModel(items([0, 5, 0]), 'pie'), 600, 400)
        expect(slices).toHaveLength(1)
        expect(slices[0].index).toBe(1)
        expect(slices[0].path.match(/A /g)).toHaveLength(2)
    })

    it('重复刻度文本降低显示密度而不修改数值域', (): void => {
        const model: ChartModel = createChartModel(items([1]), 'line')
        const ticks = createChartTicks(model, (value: number): string => value.toFixed(0))
        expect(ticks.map((tick): string => tick.text)).toEqual(['0', '1'])
        expect(model.maximum).toBe(1)
    })
})
