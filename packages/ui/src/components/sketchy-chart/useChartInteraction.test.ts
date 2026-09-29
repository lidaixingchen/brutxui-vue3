import { describe, expect, it, vi, afterEach } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { mount, enableAutoUnmount } from '@vue/test-utils'
import { useChartInteraction } from './useChartInteraction'
import type { ChartDataItem } from './sketchy-chart-data'

enableAutoUnmount(afterEach)

describe('useChartInteraction', (): void => {
    function createFixture(overrides: Partial<Parameters<typeof useChartInteraction>[0]> = {}) {
        const root = ref<HTMLElement | null>(null)
        const explorer = ref<HTMLElement | null>(null)
        const data = ref<ChartDataItem[]>([
            { label: 'A', value: 10 },
            { label: 'B', value: 20 },
            { label: 'C', value: 30 },
        ])
        const enabled = ref(true)
        const valid = ref(true)
        const hitFn = vi.fn((_event: PointerEvent): number | null => 1)

        const wrapper = mount(defineComponent({
            setup() {
                const rootEl = ref<HTMLElement | null>(null)
                const explorerEl = ref<HTMLElement | null>(null)
                root.value = rootEl.value
                explorer.value = explorerEl.value

                const interactionInstance = useChartInteraction({
                    data: () => data.value,
                    type: () => 'bar',
                    enabled: () => enabled.value,
                    valid: () => valid.value,
                    root: rootEl,
                    explorer: explorerEl,
                    tooltip: () => rootEl.value?.querySelector<HTMLElement>('.chart-tooltip') ?? null,
                    hit: hitFn,
                    ...overrides,
                })

                return { rootEl, explorerEl, interaction: interactionInstance }
            },
            template: `
                <div ref="rootEl" class="chart-root">
                    <div ref="explorerEl" class="chart-explorer"></div>
                    <div class="chart-tooltip"></div>
                </div>
            `,
        }), { attachTo: document.body })

        root.value = wrapper.element as HTMLElement
        explorer.value = wrapper.find('.chart-explorer').element as HTMLElement
        const tooltipEl = wrapper.find('.chart-tooltip').element as HTMLDivElement

        return {
            wrapper,
            interaction: wrapper.vm.interaction,
            root,
            explorer,
            tooltipEl,
            data,
            enabled,
            valid,
            hitFn,
        }
    }

    it('selects and dismisses active index correctly', (): void => {
        const { interaction, enabled } = createFixture()
        expect(interaction.activeIndex.value).toBeNull()
        expect(interaction.open.value).toBe(false)

        interaction.select(1, 'mouse')
        expect(interaction.activeIndex.value).toBe(1)
        expect(interaction.source.value).toBe('mouse')
        expect(interaction.open.value).toBe(true)

        interaction.dismiss()
        expect(interaction.activeIndex.value).toBeNull()
        expect(interaction.source.value).toBeNull()
        expect(interaction.open.value).toBe(false)

        // Out of bounds or disabled
        interaction.select(99, 'mouse')
        expect(interaction.activeIndex.value).toBeNull()

        enabled.value = false
        interaction.select(0, 'mouse')
        expect(interaction.activeIndex.value).toBeNull()
    })

    it('handles escape keydown and suppresses re-hover until pointer leaves', (): void => {
        const { interaction } = createFixture()
        interaction.select(1, 'mouse')
        expect(interaction.activeIndex.value).toBe(1)

        const escEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
        interaction.escape(escEvent)
        expect(escEvent.defaultPrevented).toBe(true)
        expect(interaction.activeIndex.value).toBeNull()

        // Same index suppressed for mouse
        interaction.select(1, 'mouse')
        expect(interaction.activeIndex.value).toBeNull()

        // Different index can be selected
        interaction.select(2, 'mouse')
        expect(interaction.activeIndex.value).toBe(2)

        // Pointer enter clears suppression
        interaction.escape(escEvent)
        interaction.pointerEnter()
        interaction.select(1, 'mouse')
        expect(interaction.activeIndex.value).toBe(1)
    })

    it('handles outside click with trigger detection', (): void => {
        const { interaction, root } = createFixture()
        const trigger = document.createElement('div')
        trigger.setAttribute('data-chart-hit', 'true')
        root.value!.appendChild(trigger)

        interaction.select(0, 'mouse')

        // Inside trigger: prevents default and does not dismiss
        const insideEvent = { target: trigger, preventDefault: vi.fn() } as unknown as Parameters<typeof interaction.outside>[0]
        interaction.outside(insideEvent)
        expect(insideEvent.preventDefault).toHaveBeenCalled()
        expect(interaction.activeIndex.value).toBe(0)

        // Outside: dismisses
        const outsideTarget = document.createElement('div')
        document.body.appendChild(outsideTarget)
        const outsideEvent = { target: outsideTarget, preventDefault: vi.fn() } as unknown as Parameters<typeof interaction.outside>[0]
        interaction.outside(outsideEvent)
        expect(interaction.activeIndex.value).toBeNull()
    })

    it('handles pointer move, hit test, and pointer cancellation', (): void => {
        const { interaction, hitFn } = createFixture()

        // Touch move ignores mouse hit logic but tracks move distance
        interaction.pointerDown(new PointerEvent('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: 10, clientY: 10 }), 0)
        interaction.pointerMove(new PointerEvent('pointermove', { pointerType: 'touch', pointerId: 1, clientX: 30, clientY: 30 }))
        interaction.pointerUp(new PointerEvent('pointerup', { pointerType: 'touch', pointerId: 1, clientX: 30, clientY: 30 }), 0)
        // Moved past tolerance (8px), should not select
        expect(interaction.activeIndex.value).toBeNull()

        // Touch tap within tolerance selects item
        interaction.pointerDown(new PointerEvent('pointerdown', { pointerType: 'touch', pointerId: 2, clientX: 10, clientY: 10 }), 0)
        interaction.pointerUp(new PointerEvent('pointerup', { pointerType: 'touch', pointerId: 2, clientX: 12, clientY: 12 }), 0)
        expect(interaction.activeIndex.value).toBe(0)
        expect(interaction.source.value).toBe('touch')

        // Second tap on same item dismisses
        interaction.pointerDown(new PointerEvent('pointerdown', { pointerType: 'touch', pointerId: 3, clientX: 10, clientY: 10 }), 0)
        interaction.pointerUp(new PointerEvent('pointerup', { pointerType: 'touch', pointerId: 3, clientX: 10, clientY: 10 }), 0)
        expect(interaction.activeIndex.value).toBeNull()

        // Mouse pointer move
        interaction.pointerMove(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 100, clientY: 100 }), 2)
        expect(interaction.activeIndex.value).toBe(2)
        expect(interaction.source.value).toBe('mouse')

        // Duplicate coordinates return early
        interaction.pointerMove(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 100, clientY: 100 }))

        // Mouse pointer move with hitFn returning null dismisses
        hitFn.mockReturnValueOnce(null)
        interaction.pointerMove(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 200, clientY: 200 }))
        expect(interaction.activeIndex.value).toBeNull()
    })

    it('handles explorer focus, blur, keyboard navigation and slider updates', (): void => {
        const { interaction, explorer } = createFixture()

        // Explorer pointerdown tracks touch or mouse
        interaction.explorerPointerDown(new PointerEvent('pointerdown', { pointerType: 'touch' }))
        interaction.explorerUpdate([2])
        expect(interaction.explorerIndex.value).toBe(2)
        expect(interaction.source.value).toBe('touch')

        interaction.explorerPointerDown(new PointerEvent('pointerdown', { pointerType: 'mouse' }))
        interaction.explorerUpdate([1])
        expect(interaction.explorerIndex.value).toBe(1)
        expect(interaction.source.value).toBe('mouse')

        // Keydown with navigation keys selects keyboard source
        interaction.explorerKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
        expect(interaction.source.value).toBe('keyboard')

        // Irrelevant keys are ignored
        interaction.dismiss()
        interaction.explorerKeydown(new KeyboardEvent('keydown', { key: 'Shift' }))
        expect(interaction.activeIndex.value).toBeNull()

        // Focus with focus-visible
        const btn = document.createElement('button')
        explorer.value!.appendChild(btn)
        vi.spyOn(btn, 'matches').mockReturnValue(true)
        interaction.explorerFocus({ target: btn } as unknown as FocusEvent)
        expect(interaction.source.value).toBe('keyboard')
        expect(interaction.activeIndex.value).toBe(1)

        // Blur to inside explorer does not dismiss
        const anotherBtn = document.createElement('button')
        explorer.value!.appendChild(anotherBtn)
        interaction.explorerBlur({ relatedTarget: anotherBtn } as unknown as FocusEvent)
        expect(interaction.activeIndex.value).toBe(1)

        // Blur to outside dismisses
        interaction.explorerBlur({ relatedTarget: document.body } as unknown as FocusEvent)
        expect(interaction.activeIndex.value).toBeNull()
    })

    it('clears state and attempts focus restoration on data/type updates', async (): Promise<void> => {
        const { interaction, data, explorer } = createFixture()
        interaction.select(1, 'keyboard')
        expect(interaction.activeIndex.value).toBe(1)

        const slider = document.createElement('div')
        slider.setAttribute('role', 'slider')
        explorer.value!.appendChild(slider)
        slider.focus()

        // Modify data
        data.value = [{ label: 'X', value: 100 }]
        await nextTick()

        expect(interaction.activeIndex.value).toBeNull()
        expect(interaction.explorerIndex.value).toBe(0)
    })

    it('tracks pointer and manages safe corridor event listeners', async (): Promise<void> => {
        const { interaction, tooltipEl } = createFixture()
        vi.spyOn(tooltipEl, 'getBoundingClientRect').mockReturnValue({
            left: 50,
            right: 150,
            top: 50,
            bottom: 150,
            width: 100,
            height: 100,
            x: 50,
            y: 50,
            toJSON: () => {},
        })

        // Open by mouse move
        interaction.pointerMove(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 60, clientY: 60 }), 1)
        expect(interaction.open.value).toBe(true)
        await nextTick()

        // Dispatch pointermove on document inside safe corridor / tooltip
        document.dispatchEvent(new PointerEvent('pointermove', { clientX: 70, clientY: 70 }))
        expect(interaction.activeIndex.value).toBe(1)

        // Dispatch pointermove far away outside safe corridor dismisses
        document.dispatchEvent(new PointerEvent('pointermove', { clientX: 999, clientY: 999 }))
        expect(interaction.activeIndex.value).toBeNull()

        // Cleanup on unmount or dismiss
        interaction.pointerCancel()
    })
})
