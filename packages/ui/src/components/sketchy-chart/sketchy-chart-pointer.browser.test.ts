import { afterEach, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import '../../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import SketchyChart from './SketchyChart.vue'

let mounted: ReturnType<typeof mount> | undefined
let host: HTMLDivElement | undefined
let viewportBefore: { width: number; height: number } | undefined

afterEach(async (): Promise<void> => {
    mounted?.unmount()
    host?.remove()
    if (viewportBefore) await page.viewport(viewportBefore.width, viewportBefore.height)
})

it('真实鼠标移向提示时优先读取绘图区落点命中的数据项', async (): Promise<void> => {
    const hostWidth: number = 560
    const count: number = 32
    const startIndex: number = 10
    const nextIndex: number = 12
    const pointerInset: number = 10
    const distanceFromTooltipRatio: number = 0.25

    viewportBefore = { width: window.innerWidth, height: window.innerHeight }
    await page.viewport(1024, 800)
    host = document.createElement('div')
    Object.assign(host.style, { position: 'fixed', left: '24px', top: '120px', width: `${hostWidth}px` })
    document.body.appendChild(host)
    mounted = mount(SketchyChart, { attachTo: host, props: {
        sketchiness: 0,
        data: Array.from({ length: count }, (_, index: number) => ({ label: `同一统计周期的完整读数记录 ${index}`, value: 100 })),
    } })

    const graph: SVGSVGElement = mounted.element.querySelector('svg')!
    const points: NodeListOf<SVGCircleElement> = graph.querySelectorAll('.chart-data circle')
    const yAxis: SVGLineElement = graph.querySelector('.chart-axes line')!
    await document.fonts.ready
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    const matrix: DOMMatrix = graph.getScreenCTM()!
    const plotTop: number = new DOMPoint(yAxis.x1.baseVal.value, yAxis.y1.baseVal.value).matrixTransform(matrix).y
    const plotBottom: number = new DOMPoint(yAxis.x2.baseVal.value, yAxis.y2.baseVal.value).matrixTransform(matrix).y
    const start: DOMPoint = new DOMPoint(points[startIndex]!.cx.baseVal.value, 0).matrixTransform(matrix)
    const next: DOMPoint = new DOMPoint(points[nextIndex]!.cx.baseVal.value, 0).matrixTransform(matrix)
    const graphBounds: DOMRect = graph.getBoundingClientRect()
    start.y = plotBottom - pointerInset
    const hoverGraph = (point: DOMPoint): Promise<void> => userEvent.hover(graph, {
        position: { x: point.x - graphBounds.left, y: point.y - graphBounds.top },
    })
    const active = (): string | null => mounted!.element.getAttribute('data-active-index')

    await hoverGraph(start)
    await expect.poll(active).toBe(String(startIndex))
    const tooltip = (): HTMLElement | null => document.querySelector('[id^="chart-reading-"]')
    await expect.poll((): boolean => {
        const bounds: DOMRect | undefined = tooltip()?.getBoundingClientRect()
        return bounds !== undefined && bounds.left < start.x && bounds.right > start.x && bounds.bottom < start.y
    }).toBe(true)
    const tooltipBounds: DOMRect = tooltip()!.getBoundingClientRect()
    const boundary: number = Math.max(plotTop, tooltipBounds.bottom)
    next.y = boundary + (start.y - boundary) * distanceFromTooltipRatio
    const pathXAtTooltip: number = start.x + (next.x - start.x) * (start.y - tooltipBounds.bottom) / (start.y - next.y)
    expect(next.y).toBeGreaterThan(tooltipBounds.bottom)
    expect(pathXAtTooltip).toBeGreaterThan(tooltipBounds.left)
    expect(pathXAtTooltip).toBeLessThan(tooltipBounds.right)

    await hoverGraph(next)
    await expect.poll(active).toBe(String(nextIndex))
})
