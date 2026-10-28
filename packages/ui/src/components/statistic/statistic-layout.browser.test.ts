import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, onMounted, ref } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import Statistic from './Statistic.vue'

let mounted: ReturnType<typeof mount> | null = null

afterEach(() => {
    mounted?.unmount()
    mounted = null
})

describe('Statistic card layout', () => {
    it('fits resized containers and changing slot content without remounting the slot', async () => {
        const width = ref(272)
        const value = ref('123,456,789.50')
        let slotMounts = 0
        const Value = defineComponent({
            setup() {
                onMounted(() => { slotMounts += 1 })
                return () => h('span', value.value)
            },
        })
        mounted = mount(defineComponent({
            setup: () => () => h('div', { style: { width: `${width.value}px` } }, [
                h(Statistic, { size: 'lg', variant: 'card' }, { default: () => h(Value) }),
            ]),
        }))
        const assertFits = () => {
            const viewport = mounted!.element.querySelector<HTMLElement>('.statistic-content-viewport')!
            const content = mounted!.element.querySelector<HTMLElement>('.statistic-content')!
            expect(Math.round(content.getBoundingClientRect().right))
                .toBeLessThanOrEqual(Math.round(viewport.getBoundingClientRect().right))
        }

        await vi.waitFor(assertFits)
        width.value = 160
        value.value = '123,456,789,012,345.50'
        await nextTick()
        await vi.waitFor(assertFits)
        expect(mounted.element.textContent).toContain(value.value)
        expect(slotMounts).toBe(1)
    })

    it('scales a long formatted value to its 272px container without horizontal overflow', async () => {
        mounted = mount(defineComponent({
            setup: () => () => h('div', { style: { width: '272px' } }, [
                h(Statistic, {
                    title: '月度成交额',
                    value: 123456789.5,
                    prefix: '¥',
                    suffix: '元',
                    precision: 2,
                    size: 'lg',
                    variant: 'card',
                }),
            ]),
        }))
        await nextTick()
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

        const viewport = mounted.element.querySelector<HTMLElement>('.statistic-content-viewport')!
        const root = viewport.parentElement!.parentElement!
        const content = mounted.element.querySelector<HTMLElement>('.statistic-content')!
        const scale = new DOMMatrixReadOnly(getComputedStyle(content).transform).a

        expect(mounted.element.textContent).toContain('¥123,456,789.50元')
        expect(scale).toBeLessThan(1)
        expect(content.getBoundingClientRect().width).toBeLessThanOrEqual(viewport.getBoundingClientRect().width)
        expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    })
})
