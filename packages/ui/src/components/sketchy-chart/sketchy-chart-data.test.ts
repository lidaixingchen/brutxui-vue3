import { describe, expect, it, vi } from 'vitest'
import { createChartModel, createChartTicks, chartYPosition, createPieGeometry, type ChartModel, type ChartDataItem, type ChartType, type PieGeometry } from './sketchy-chart-data'
import { cartesianX, createCartesianLayout, hitCartesianChart, type CartesianLayoutInput } from './sketchy-chart-data'

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

})

describe('笛卡尔图表布局', (): void => {
    const svgWidth: number = 600
    const svgHeight: number = 400
    const scale: number = 222 / svgWidth
    const measure = (text: string): number => Array.from(text).length * 7 / scale
    const formatValue = (value: number): string => `营业收入${'详细口径'.repeat(30)} ${value}`
    const formatNumber = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 12 }).format
    const scientificNumberFormats = [3, 2, 1].map(maximumSignificantDigits =>
        new Intl.NumberFormat('en-US', { notation: 'scientific', maximumSignificantDigits }).format)

    it.each(['line', 'bar'] as const)('%s 为过长轴标签分配留白并按同一绘图区命中', (type): void => {
        const model: ChartModel = createChartModel([
            { label: '首类别'.repeat(60), value: -100 },
            { label: '中间类别', value: 0 },
            { label: '尾类别'.repeat(60), value: 300 },
        ], type)
        const input: CartesianLayoutInput = {
            type, width: svgWidth, height: svgHeight, scale, items: model.items,
            ticks: createChartTicks(model, formatValue), formatNumber, scientificNumberFormats,
        }
        const { plot, ticks, categories } = createCartesianLayout(input, measure)
        expect(plot.width).toBeGreaterThan(svgWidth / 2)
        expect(ticks.map(tick => tick.text)).toEqual(['-100', '0', '100', '200', '300'])
        expect(categories[0]!.text).toMatch(/^首类别.*…$/)
        expect(categories[2]!.text).toMatch(/^尾类别.*…$/)
        const visible = categories.filter(label => label.visible)
        expect(visible[0]!.left).toBeGreaterThan(0)
        expect(visible.at(-1)!.right).toBeLessThan(svgWidth)
        expect(visible.slice(1).every((label, index) => label.left > visible[index]!.right)).toBe(true)
        for (const item of model.items) {
            const x: number = cartesianX(plot, type, item.index, model.items.length)
            expect(hitCartesianChart(plot, type, model.items.length, x, plot.top, scale)).toBe(item.index)
        }
        expect(hitCartesianChart(plot, type, model.items.length, 0, plot.top, scale)).toBeNull()
    })

    it.each(['line', 'bar'] as const)('%s 单一零值居中并展示类别，空数据没有命中项', (type): void => {
        const model: ChartModel = createChartModel([{ label: '唯一类别'.repeat(60), value: 0 }], type)
        const input: CartesianLayoutInput = {
            type, width: svgWidth, height: svgHeight, scale, items: model.items,
            ticks: createChartTicks(model, formatNumber), formatNumber, scientificNumberFormats,
        }
        const { plot, categories } = createCartesianLayout(input, measure)
        const middle: number = cartesianX(plot, type, 0, model.items.length)
        expect(middle).toBeCloseTo((plot.left + plot.right) / 2)
        expect(categories[0]).toMatchObject({ index: 0, visible: true })
        expect(categories[0]!.right).toBeLessThan(svgWidth)
        expect(hitCartesianChart(plot, type, 1, middle, (plot.top + plot.bottom) / 2, scale)).toBe(0)
        const empty = createCartesianLayout({ ...input, items: [], ticks: [] }, measure)
        expect(empty.categories).toEqual([])
        expect(empty.ticks).toEqual([])
        expect(hitCartesianChart(empty.plot, type, 0, middle, empty.plot.top, scale)).toBeNull()
    })

    it('宽度受限时用科学计数法保留极小量级的刻度差异', (): void => {
        const model: ChartModel = createChartModel(items([0, 4e-30]), 'line')
        const input: CartesianLayoutInput = {
            type: 'line', width: svgWidth, height: svgHeight, scale, items: model.items,
            ticks: createChartTicks(model, formatNumber), formatNumber, scientificNumberFormats,
        }
        expect(createCartesianLayout(input, measure).ticks.map(tick => tick.text))
            .toEqual(['0E0', '1E-30', '2E-30', '3E-30', '4E-30'])
    })

    it('按最终显示的刻度去重，窄屏数字回退保留完整刻度位置', (): void => {
        const model: ChartModel = createChartModel(items([0, 1]), 'line')
        const input: CartesianLayoutInput = {
            type: 'line', width: svgWidth, height: svgHeight, scale, items: model.items,
            ticks: createChartTicks(model, value => value.toFixed(0)), formatNumber, scientificNumberFormats,
        }
        const wide = createCartesianLayout(input, measure)
        expect(wide.ticks.map(tick => tick.text)).toEqual(['0', '1'])
        const narrow = createCartesianLayout({ ...input, ticks: createChartTicks(model, value => formatValue(Number(value.toFixed(0)))) }, measure)
        expect(narrow.ticks.map(tick => tick.text)).toEqual(['0', '0.25', '0.5', '0.75', '1'])
        expect(narrow.ticks[0]!.y).toBe(narrow.plot.bottom)
        expect(narrow.ticks.at(-1)!.y).toBe(narrow.plot.top)
        expect(model.maximum).toBe(1)
    })

    it('科学计数法按空间降低精度，刻度指数完整显示或整条隐藏', (): void => {
        const model: ChartModel = createChartModel(items([-Number.MAX_VALUE, Number.MAX_VALUE]), 'line')
        const input: CartesianLayoutInput = {
            type: 'line', width: svgWidth, height: svgHeight, scale: 142 / svgWidth, items: model.items,
            ticks: createChartTicks(model, formatNumber), formatNumber, scientificNumberFormats,
        }
        const narrow = createCartesianLayout(input, text => measure(text) * scale / input.scale)
        expect(narrow.ticks.map(tick => tick.text)).toEqual(['-2E308', '-9E307', '0E0', '9E307', '2E308'])
        const smallest = createCartesianLayout({ ...input, scale: 64 / svgWidth }, text => measure(text) * scale / (64 / svgWidth))
        expect(smallest.ticks).toHaveLength(5)
        expect(smallest.ticks.map(tick => tick.text)).toEqual(['', '', '', '', ''])
    })

    it('大量长类别只测量可能显示的原始文本，同名类别复用测量结果', (): void => {
        const count: number = 1000
        const model: ChartModel = createChartModel(Array.from({ length: count }, (_, index) => ({
            label: index === 0 ? '首' : index === count - 1 ? '尾' : `同名长标签${'分类信息'.repeat(40)}`,
            value: index,
        })), 'line')
        const input: CartesianLayoutInput = {
            type: 'line', width: svgWidth, height: svgHeight, scale, items: model.items,
            ticks: createChartTicks(model, formatNumber), formatNumber, scientificNumberFormats,
        }
        const measureWithCount = vi.fn(measure)
        const { categories } = createCartesianLayout(input, measureWithCount)
        expect(categories).toHaveLength(count)
        expect(categories.filter(label => label.visible).map(label => label.index)).toEqual([0, count - 1])
        expect(measureWithCount.mock.calls.filter(([text]) => text.startsWith('同名长标签'))).toHaveLength(1)
        expect(measureWithCount).toHaveBeenCalledTimes(input.ticks.length + 3)
    })
})
