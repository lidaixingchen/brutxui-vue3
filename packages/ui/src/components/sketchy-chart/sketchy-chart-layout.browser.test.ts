import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import '../../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import SketchyChart from './SketchyChart.vue'
import type { ChartDataItem } from './sketchy-chart-data'

let host: HTMLDivElement | undefined
let mounted: ReturnType<typeof mount> | undefined
afterEach((): void => {
    mounted?.unmount()
    host?.remove()
    mounted = undefined
    host = undefined
    vi.restoreAllMocks()
})

describe('图表浏览器布局', (): void => {
    it.each(['line', 'bar'] as const)('%s 动态适应长数值、长类别和实际容器宽度', async (type): Promise<void> => {
        host = document.createElement('div')
        Object.assign(host.style, { position: 'fixed', left: '20px', top: '200px', width: '260px' })
        document.body.appendChild(host)
        const data: ChartDataItem[] = [
            { label: '首', value: -100 },
            { label: '中', value: 0 },
            { label: '尾', value: 300 },
        ]
        const firstLabel: string = `首个类别${'用于查看完整分类信息'.repeat(20)}`
        const lastLabel: string = `最后类别${'用于查看完整分类信息'.repeat(20)}`
        const items = ref(data)
        const formatter = ref((value: number): string => `¥${value}`)
        mounted = mount(defineComponent({ setup: () => () => h(SketchyChart, {
            type, data: items.value, valueFormatter: formatter.value, sketchiness: 0,
        }) }), { attachTo: host })
        const chart: Element = mounted.element
        const graph: SVGSVGElement = chart.querySelector('svg')!
        const tickTexts = (): string[] => Array.from(graph.querySelectorAll('[data-chart-y-tick]'), label => label.textContent!.trim())
        const categoryLabels = (): SVGTextElement[] => Array.from(graph.querySelectorAll<SVGTextElement>('[data-chart-category]'))
            .filter(label => getComputedStyle(label).visibility !== 'hidden')
        const points = (): SVGGraphicsElement[] => Array.from(graph.querySelectorAll(type === 'line' ? '.chart-data circle' : '.chart-data g rect[stroke]'))
        const span = (): number => {
            const bounds: DOMRect[] = points().map(point => point.getBoundingClientRect())
            const first: DOMRect = bounds[0]!
            const last: DOMRect = bounds.at(-1)!
            return last.x + last.width / 2 - first.x - first.width / 2
        }
        await expect.poll(tickTexts).toContain('¥300')
        await expect.poll(() => categoryLabels().length).toBe(3)
        const shortLabelSpan: number = span()

        const longFormat = (value: number): string => `人民币营业收入（${'财务披露口径'.repeat(25)}） ${value}`
        formatter.value = longFormat
        items.value = [{ ...data[0]!, label: firstLabel }, data[1]!, { ...data[2]!, label: lastLabel }]
        await expect.poll(tickTexts).toEqual(['-100', '0', '100', '200', '300'])
        const graphBounds: DOMRect = graph.getBoundingClientRect()
        expect(span()).toBeGreaterThan(shortLabelSpan * 0.8)
        expect(points()).toHaveLength(data.length)

        const visibleCategories: SVGTextElement[] = categoryLabels()
        expect(visibleCategories[0]!.textContent).toMatch(/^首个类别.*…$/)
        expect(visibleCategories.at(-1)!.textContent).toMatch(/^最后类别.*…$/)
        for (const label of [...visibleCategories, ...graph.querySelectorAll('[data-chart-y-tick]')]) {
            const bounds: DOMRect = label.getBoundingClientRect()
            expect(bounds.left).toBeGreaterThanOrEqual(graphBounds.left)
            expect(bounds.right).toBeLessThanOrEqual(graphBounds.right)
            expect(bounds.top).toBeGreaterThanOrEqual(graphBounds.top)
            expect(bounds.bottom).toBeLessThanOrEqual(graphBounds.bottom)
        }
        const categoryBounds: DOMRect[] = visibleCategories.map(label => label.getBoundingClientRect())
        for (let index = 1; index < categoryBounds.length; index++) {
            expect(categoryBounds[index]!.left).toBeGreaterThan(categoryBounds[index - 1]!.right)
        }

        const axis: DOMRect = graph.querySelector('.chart-axes line')!.getBoundingClientRect()
        const y: number = axis.bottom - graphBounds.top - 2
        const tooltip = (): Element | null => document.querySelector('[id^="chart-reading-"]')
        for (const [index, point] of points().entries()) {
            const bounds: DOMRect = point.getBoundingClientRect()
            expect(bounds.left).toBeGreaterThanOrEqual(graphBounds.left)
            expect(bounds.right).toBeLessThanOrEqual(graphBounds.right)
            // 提示打开后可能覆盖鼠标位置，活动项断言验证实际指针事件已命中。
            await userEvent.hover(graph, { force: true, position: { x: bounds.left - graphBounds.left + bounds.width / 2, y } })
            await expect.poll(() => chart.getAttribute('data-active-index')).toBe(String(index))
        }
        await expect.poll(() => tooltip()?.textContent).toContain(longFormat(300))
        const slider: HTMLElement = chart.querySelector('[role="slider"]')!
        expect(slider.getAttribute('aria-valuetext')).toContain(firstLabel)
        expect(slider.getAttribute('aria-valuetext')).toContain(longFormat(-100))

        const wideFormat = (value: number): string => `折算后营业收入（人民币）：${value}`
        formatter.value = wideFormat
        await expect.poll(tickTexts).toContain('300')
        const narrowSpan: number = span()
        host.style.width = '680px'
        await expect.poll(tickTexts).toContain(wideFormat(300))
        expect(span()).toBeGreaterThan(narrowSpan)
    })

    it('以原宽度从隐藏状态显示后，数字回退恢复去重前的刻度和网格', async (): Promise<void> => {
        host = document.createElement('div')
        Object.assign(host.style, { width: '260px', display: 'none' })
        document.body.appendChild(host)
        const data: ChartDataItem[] = [{ label: '起点', value: 0 }, { label: '终点', value: 1 }]
        const customText = (value: number): string => `约 ${value.toFixed(0)} ${'完整计量单位'.repeat(40)}`
        mounted = mount(SketchyChart, { props: { width: 222, data, valueFormatter: customText }, attachTo: host })
        const graph: SVGSVGElement = mounted.element.querySelector('svg')!
        const tickTexts = (): string[] => Array.from(graph.querySelectorAll('[data-chart-y-tick]'), label => label.textContent!.trim())
        expect(graph.getBoundingClientRect().width).toBe(0)
        expect(tickTexts()).toEqual([customText(0), customText(1)])

        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        host.style.display = 'block'
        await expect.poll(tickTexts).toEqual(['0', '0.25', '0.5', '0.75', '1'])
        expect(graph.getBoundingClientRect().width).toBe(222)
        const lines: NodeListOf<SVGLineElement> = graph.querySelectorAll('.chart-grid line')
        const yAxis: SVGLineElement = graph.querySelector('.chart-axes line')!
        expect(lines).toHaveLength(5)
        expect(lines[0]!.y1.baseVal.value).toBeCloseTo(yAxis.y2.baseVal.value)
        expect(lines[4]!.y1.baseVal.value).toBeCloseTo(yAxis.y1.baseVal.value)
    })

    it('窄绘图区的极值刻度显示完整指数，保持全部网格和数据点', async (): Promise<void> => {
        host = document.createElement('div')
        host.style.width = '180px'
        document.body.appendChild(host)
        const data: ChartDataItem[] = [{ label: '最低', value: -Number.MAX_VALUE }, { label: '最高', value: Number.MAX_VALUE }]
        mounted = mount(SketchyChart, { props: { data }, attachTo: host })
        const graph: SVGSVGElement = mounted.element.querySelector('svg')!
        const visibleTexts = (): string[] => Array.from(graph.querySelectorAll('[data-chart-y-tick]:not([visibility="hidden"])'), label => label.textContent!.trim())
        await expect.poll(() => visibleTexts().some(text => /E30[78]$/.test(text))).toBe(true)
        expect(visibleTexts().every(text => /^-?\d+(\.\d+)?E-?\d+$/.test(text))).toBe(true)
        expect(graph.querySelectorAll('.chart-grid line')).toHaveLength(5)
        expect(graph.querySelectorAll('.chart-data circle')).toHaveLength(data.length)
    })

    it.each([300, 1000])('%i 个不同长类别只测量可显示的文本候选', async (count: number): Promise<void> => {
        host = document.createElement('div')
        Object.assign(host.style, { width: '260px', display: 'none' })
        document.body.appendChild(host)
        const data: ChartDataItem[] = Array.from({ length: count }, (_, index) => ({
            label: `类别 ${index + 1} ${'需要显示完整的分类信息'.repeat(25)}`,
            value: index + 1,
        }))
        mounted = mount(SketchyChart, { props: { data }, attachTo: host })
        await document.fonts.ready
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        const getComputedTextLength = SVGTextContentElement.prototype.getComputedTextLength
        let firstMeasurement: number | undefined
        let lastMeasurement: number = 0
        const measure = vi.spyOn(SVGTextContentElement.prototype, 'getComputedTextLength').mockImplementation(function (this: SVGTextContentElement): number {
            firstMeasurement ??= performance.now()
            const result: number = getComputedTextLength.call(this)
            lastMeasurement = performance.now()
            return result
        })
        host.style.display = 'block'
        const first: SVGTextElement = mounted.element.querySelector('[data-chart-category="0"]')!
        await expect.poll(() => first.textContent).toMatch(/…$/)
        expect(measure.mock.calls.length).toBeGreaterThan(0)
        expect(measure.mock.calls.length).toBeLessThanOrEqual(50)
        console.info('图表长类别测量', { count, calls: measure.mock.calls.length, measurementMs: lastMeasurement - firstMeasurement! })
    })
})
