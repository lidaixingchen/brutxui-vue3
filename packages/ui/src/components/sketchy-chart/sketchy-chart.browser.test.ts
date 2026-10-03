import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { DialogRoot, DialogContent, DialogTitle, DialogDescription } from 'reka-ui'
import '../../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import SketchyChart from './SketchyChart.vue'
import type { ChartDataItem, ChartType } from './sketchy-chart-data'

let mounted: ReturnType<typeof mount> | undefined
afterEach((): void => {
    mounted?.unmount()
    mounted = undefined
})

describe('图表浏览器读数', (): void => {
    it.each(['替换', '插入', '删除', '重排', '标签', '数值', '类型'])('%s 数据快照清除活动项', async (change: string): Promise<void> => {
        const data: Ref<ChartDataItem[]> = ref([{ label: '甲', value: 1 }, { label: '乙', value: 2 }])
        const type: Ref<ChartType> = ref('line')
        mounted = mount(defineComponent({ setup: () => () => h(SketchyChart, { data: data.value, type: type.value }) }))
        await nextTick()
        const slider: HTMLElement = mounted.element.querySelector('[role="slider"]')!
        slider.focus()
        await userEvent.keyboard('{End}')
        expect(mounted.element.getAttribute('data-active-index')).toBe('1')
        if (change === '替换') data.value = data.value.map((item: ChartDataItem): ChartDataItem => ({ ...item }))
        if (change === '插入') data.value.unshift({ label: '新项', value: 3 })
        if (change === '删除') data.value.pop()
        if (change === '重排') data.value.reverse()
        if (change === '标签') data.value[1]!.label = '新标签'
        if (change === '数值') data.value[1]!.value = 3
        if (change === '类型') type.value = 'pie'
        await nextTick()
        expect(mounted.element.getAttribute('data-active-index')).toBe(null)
    })

    it('两个图表提示按浮层顺序逐个响应 Esc，卸载清理浮层', async (): Promise<void> => {
        mounted = mount(defineComponent({ setup: () => () => h('div', [
            h(SketchyChart, { title: '图甲', type: 'pie', data: [{ label: '甲', value: 1 }] }),
            h(SketchyChart, { title: '图乙', type: 'pie', data: [{ label: '乙', value: 2 }] }),
        ]) }))
        await nextTick()
        const items: NodeListOf<HTMLElement> = mounted.element.querySelectorAll('[data-slot="pie-legend"] li')
        for (const item of items) {
            item.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 1 }))
            item.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch', pointerId: 1 }))
            await nextTick()
        }
        await expect.poll((): number => document.querySelectorAll('[id^="chart-reading-"]').length).toBe(2)
        await userEvent.keyboard('{Escape}')
        await expect.poll((): number => document.querySelectorAll('[id^="chart-reading-"]').length).toBe(1)
        expect(mounted.element.querySelectorAll('[data-active-index]')).toHaveLength(1)
        mounted.unmount()
        mounted = undefined
        expect(document.querySelector('[id^="chart-reading-"]')).toBe(null)
    })

    it('真实鼠标命中、提示悬停与 Esc 同项抑制', async (): Promise<void> => {
        mounted = mount(SketchyChart, { props: { data: [{ label: '甲', value: 10 }, { label: '乙', value: 20 }, { label: '丙', value: 15 }] } })
        await nextTick()
        const graph: SVGSVGElement = mounted.element.querySelector('svg')!
        const explorer: HTMLElement = mounted.element.querySelector('[data-chart-hit] [role="slider"]')!.closest('[data-chart-hit]')!
        const scale: number = graph.getBoundingClientRect().width / 600
        await userEvent.hover(graph, { position: { x: 70 * scale, y: 300 * scale } })
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe('0')
        const tooltip: HTMLElement = document.querySelector('[id^="chart-reading-"]')!
        await userEvent.hover(tooltip)
        expect(mounted.element.getAttribute('data-active-index')).toBe('0')
        await userEvent.hover(explorer)
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe(null)
        const slider: HTMLElement = explorer.querySelector('[role="slider"]')!
        slider.focus()
        await userEvent.keyboard('{End}')
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe('2')
        await userEvent.hover(explorer)
        expect(mounted.element.getAttribute('data-active-index')).toBe('2')
        await userEvent.keyboard('{Escape}')
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe(null)
        await userEvent.hover(graph, { position: { x: 70 * scale, y: 300 * scale } })
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe('0')
        await userEvent.keyboard('{Escape}')
        await userEvent.hover(graph, { position: { x: 72 * scale, y: 301 * scale } })
        expect(mounted.element.getAttribute('data-active-index')).toBe(null)
        await userEvent.hover(graph, { position: { x: 550 * scale, y: 300 * scale } })
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe('2')
    })

    it('极小饼图项保留键盘读数，圆顶鼠标命中可见扇区', async (): Promise<void> => {
        mounted = mount(SketchyChart, { props: { type: 'pie', valueFormatter: (value: number): string => value.toExponential(), data: [
            { label: '极小项', value: 1e-15 }, { label: '可见项', value: Number.MAX_VALUE },
        ] } })
        await nextTick()
        const graph: SVGSVGElement = mounted.element.querySelector('svg')!
        const rect: DOMRect = graph.getBoundingClientRect()
        await userEvent.hover(graph, { position: { x: rect.width / 2, y: rect.height / 4 } })
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe('1')
        await userEvent.keyboard('{Escape}')
        const slider: HTMLElement = mounted.element.querySelector('[role="slider"]')!
        slider.focus()
        await userEvent.keyboard('{Home}')
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe('0')
        expect(slider.getAttribute('aria-valuetext')).toContain('极小项')
        expect(mounted.element.querySelectorAll('[data-slot="pie-legend"] li')).toHaveLength(2)
    })

    it('触摸移动与取消保持滚动，点击切换及外部关闭', async (): Promise<void> => {
        mounted = mount(SketchyChart, { props: { type: 'pie', data: [{ label: '零值', value: 0 }, { label: '正值', value: 1 }] } })
        await nextTick()
        const item: HTMLElement = mounted.element.querySelector('[data-slot="pie-legend"] li')!
        const send = (type: string, x: number = 0): PointerEvent => {
            const event: PointerEvent = new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 1, clientX: x })
            item.dispatchEvent(event)
            return event
        }
        expect(send('pointerdown').defaultPrevented).toBe(false)
        send('pointermove', 20)
        send('pointerup', 20)
        await nextTick()
        expect(mounted.element.getAttribute('data-active-index')).toBe(null)
        send('pointerdown')
        send('pointercancel')
        send('pointerup')
        await nextTick()
        expect(mounted.element.getAttribute('data-active-index')).toBe(null)
        send('pointerdown')
        send('pointerup')
        await nextTick()
        expect(mounted.element.getAttribute('data-active-index')).toBe('0')
        send('pointerdown')
        send('pointerup')
        await nextTick()
        expect(mounted.element.getAttribute('data-active-index')).toBe(null)
        send('pointerdown')
        send('pointerup')
        await nextTick()
        await userEvent.click(mounted.element.querySelector('[data-chart-table-trigger]')!)
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe(null)
    })

    it('遍历全部类别、Esc 后显式恢复、Tab 退出', async (): Promise<void> => {
        mounted = mount(SketchyChart, { props: { title: '全部类别', type: 'pie', data: [
            { label: '零值', value: 0 }, { label: '中间', value: 10 }, { label: '末项', value: 20 },
        ] } })
        await nextTick()
        const slider: HTMLElement = mounted.element.querySelector('[role="slider"]')!
        slider.focus()
        await userEvent.keyboard('{End}')
        await expect.poll((): string | null => slider.getAttribute('aria-valuenow')).toBe('2')
        expect(slider.getAttribute('aria-valuetext')).toContain('末项')
        await userEvent.keyboard('{ArrowRight}')
        expect(slider.getAttribute('aria-valuenow')).toBe('2')
        await userEvent.keyboard('{Home}')
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe('0')
        expect(slider.getAttribute('aria-valuetext')).toContain('0%')
        await userEvent.keyboard('{Escape}')
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe(null)
        await userEvent.keyboard('{ArrowLeft}')
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe('0')
        await userEvent.keyboard('{Tab}')
        expect(document.activeElement).toBe(mounted.element.querySelector('[data-chart-table-trigger]'))
        await expect.poll((): string | null => mounted!.element.getAttribute('data-active-index')).toBe(null)
    })

    it('数据快照和状态变化重置读数并保持入口焦点', async (): Promise<void> => {
        const data: Ref<ChartDataItem[]> = ref([{ label: '甲', value: 1 }, { label: '乙', value: 2 }])
        const interactive: Ref<boolean> = ref(true)
        mounted = mount(defineComponent({ setup: () => () => h(SketchyChart, { data: data.value, interactive: interactive.value }) }))
        await nextTick()
        const slider: HTMLElement = mounted.element.querySelector('[role="slider"]')!
        slider.focus()
        await userEvent.keyboard('{End}')
        data.value[1]!.label = '更新'
        await nextTick()
        expect(mounted.element.getAttribute('data-active-index')).toBe(null)
        expect(slider.getAttribute('aria-valuenow')).toBe('0')
        data.value = [{ label: '唯一', value: 10 }]
        await nextTick()
        await expect.poll((): boolean => document.activeElement?.hasAttribute('data-chart-status') ?? false).toBe(true)
        expect(mounted.element.getAttribute('data-active-index')).toBe(null)
        data.value = []
        await nextTick()
        expect(document.activeElement?.hasAttribute('data-chart-status')).toBe(true)
        interactive.value = false
        await nextTick()
        await expect.poll((): boolean => document.activeElement?.hasAttribute('data-chart-table-trigger') ?? false).toBe(true)
        expect(mounted.element.querySelector('[role="slider"]')).toBe(null)
    })

    it('Dialog 中连续两次 Esc 分别关闭图表提示与弹窗', async (): Promise<void> => {
        const dialogOpen: Ref<boolean> = ref(true)
        mounted = mount(defineComponent({ setup: () => () => h(DialogRoot, { open: dialogOpen.value, 'onUpdate:open': (value: boolean): void => { dialogOpen.value = value } }, {
            default: () => h(DialogContent, {}, { default: () => [
                h(DialogTitle, {}, () => '读数弹窗'), h(DialogDescription, {}, () => '验证关闭顺序'),
                h(SketchyChart, { data: [{ label: '甲', value: 1 }, { label: '乙', value: 2 }] }),
            ] }),
        }) }))
        await nextTick()
        const slider: HTMLElement = document.querySelector('[role="dialog"] [role="slider"]')!
        slider.focus()
        await userEvent.keyboard('{End}')
        await expect.poll((): number => document.querySelectorAll('[id^="chart-reading-"]').length).toBeGreaterThan(0)
        await userEvent.keyboard('{Escape}')
        await expect.poll((): number => document.querySelectorAll('[id^="chart-reading-"]').length).toBe(0)
        expect(dialogOpen.value).toBe(true)
        await userEvent.keyboard('{Escape}')
        await expect.poll((): boolean => dialogOpen.value).toBe(false)
    })

    it('真实键盘展开表格并保留入口焦点', async (): Promise<void> => {
        mounted = mount(SketchyChart, { props: {
            title: '净收入', data: [{ label: '一月', value: -10 }, { label: '二月', value: 0 }],
        } })
        const button: HTMLButtonElement = mounted.element.querySelector('button')!
        button.focus()
        await userEvent.keyboard('{Enter}')
        await expect.element(page.getByRole('table')).toBeVisible()
        expect(document.activeElement).toBe(button)
        expect(button.getAttribute('aria-expanded')).toBe('true')
        await expect.element(page.getByRole('cell', { name: '-10', exact: true })).toBeVisible()
        await userEvent.keyboard('{Enter}')
        await expect.element(page.getByRole('table')).not.toBeInTheDocument()
    })

    it('记录三类图表的代表性数据规模与首次渲染耗时', async (): Promise<void> => {
        const sizes: readonly number[] = [3, 31, 300]
        const types: readonly ChartType[] = ['line', 'bar', 'pie']
        const measurements: Array<{ type: ChartType; count: number; mountToFrameMs: number; endKeyToFrameMs: number }> = []
        for (const type of types) {
            for (const count of sizes) {
                const data: ChartDataItem[] = Array.from({ length: count }, (_: unknown, index: number): ChartDataItem => ({ label: String(index), value: index + 1 }))
                const start: number = performance.now()
                mounted = mount(SketchyChart, { props: { type, data } })
                await nextTick()
                await new Promise<void>((resolve): void => { requestAnimationFrame((): void => resolve()) })
                const mountToFrameMs: number = performance.now() - start
                const slider: HTMLElement = mounted.element.querySelector('[role="slider"]')!
                slider.focus()
                const traversalStart: number = performance.now()
                await userEvent.keyboard('{End}')
                await new Promise<void>((resolve): void => { requestAnimationFrame((): void => resolve()) })
                measurements.push({ type, count, mountToFrameMs, endKeyToFrameMs: performance.now() - traversalStart })
                expect(slider.getAttribute('aria-valuenow')).toBe(String(count - 1))
                expect(mounted.element.getAttribute('data-chart-state')).toBe('ready')
                mounted.unmount()
                mounted = undefined
            }
        }
        console.info('图表浏览器基线', JSON.stringify({ userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight], measurements }))
    })

})
