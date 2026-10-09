import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import type { Locale } from '@/locales/types'
import VirtualScroll from './VirtualScroll.vue'
import type { VirtualizerInstance, VirtualizerVirtualItem } from './types'

interface Item {
    id: number
    label: string
}

interface VirtualScrollTestOptions {
    itemHeight: number
    dynamicHeight: boolean
}

interface VirtualScrollMeasurementInstance extends VirtualizerInstance {
    getMeasurements: () => VirtualizerVirtualItem[]
    resizeItem: (index: number, size: number) => void
}

interface VirtualScrollPublicInstance {
    virtualizer: VirtualScrollMeasurementInstance | null
}

type VirtualScrollWrapper = ReturnType<typeof mount<typeof VirtualScroll>>

const ITEM_COUNT: number = 3
const MEASURED_ITEM_INDEX: number = 0
const INITIAL_ITEM_HEIGHT: number = 48
const UPDATED_ITEM_HEIGHT: number = 96
const MEASURED_ITEM_HEIGHT: number = 72
const OVERSCAN: number = ITEM_COUNT

const items: Item[] = Array.from({ length: ITEM_COUNT }, (_value: unknown, index: number): Item => ({
    id: index,
    label: `Item ${index + 1}`,
}))

const testLocale: Locale = {
    virtualScroll: {
        label: 'virtualScroll.label',
        empty: 'virtualScroll.empty',
    },
} as Locale

function mountVirtualScroll(options: VirtualScrollTestOptions): VirtualScrollWrapper {
    return mount(VirtualScroll, {
        props: {
            items,
            itemHeight: options.itemHeight,
            dynamicHeight: options.dynamicHeight,
            overscan: OVERSCAN,
        },
        global: {
            provide: {
                [LOCALE_INJECTION_KEY as symbol]: testLocale,
            },
        },
        slots: {
            default: '<div>Item</div>',
        },
    })
}

function getVirtualContent(wrapper: VirtualScrollWrapper): HTMLElement {
    const content: DOMWrapper<Element> = wrapper.find('div.relative.w-full')
    return content.element as HTMLElement
}

function getVirtualizer(wrapper: VirtualScrollWrapper): VirtualScrollMeasurementInstance {
    const publicInstance: VirtualScrollPublicInstance = wrapper.vm as unknown as VirtualScrollPublicInstance
    if (!publicInstance.virtualizer) {
        throw new Error('VirtualScroll did not initialize its TanStack virtualizer')
    }
    return publicInstance.virtualizer
}

function getMeasurementStarts(wrapper: VirtualScrollWrapper): number[] {
    const measurements: VirtualizerVirtualItem[] = getVirtualizer(wrapper).getMeasurements()
    const starts: number[] = []
    for (let index: number = 0; index < measurements.length; index += 1) {
        const measurement: VirtualizerVirtualItem | undefined = measurements[index]
        if (!measurement) {
            throw new Error(`Virtualizer did not create measurement ${index}`)
        }
        starts.push(measurement.start)
    }
    return starts
}

async function settleUpdates(): Promise<void> {
    await vi.dynamicImportSettled()
    await flushPromises()
    await nextTick()
}

describe('VirtualScroll measurement', (): void => {
    it('recomputes cached row sizes and positions when itemHeight changes', async (): Promise<void> => {
        const wrapper: VirtualScrollWrapper = mountVirtualScroll({
            itemHeight: INITIAL_ITEM_HEIGHT,
            dynamicHeight: false,
        })
        await settleUpdates()

        const initialStarts: number[] = getMeasurementStarts(wrapper)
        expect(getVirtualContent(wrapper).style.height).toBe(`${ITEM_COUNT * INITIAL_ITEM_HEIGHT}px`)
        expect(initialStarts).toEqual(
            Array.from({ length: ITEM_COUNT }, (_value: unknown, index: number): number => index * INITIAL_ITEM_HEIGHT),
        )

        await wrapper.setProps({ itemHeight: UPDATED_ITEM_HEIGHT })
        await settleUpdates()

        const updatedStarts: number[] = getMeasurementStarts(wrapper)
        expect(getVirtualContent(wrapper).style.height).toBe(`${ITEM_COUNT * UPDATED_ITEM_HEIGHT}px`)
        expect(updatedStarts).toEqual(
            Array.from({ length: ITEM_COUNT }, (_value: unknown, index: number): number => index * UPDATED_ITEM_HEIGHT),
        )

        wrapper.unmount()
    })

    it('clears measured row sizes when switching to dynamic-height mode', async (): Promise<void> => {
        const wrapper: VirtualScrollWrapper = mountVirtualScroll({
            itemHeight: INITIAL_ITEM_HEIGHT,
            dynamicHeight: false,
        })
        await settleUpdates()

        const virtualizer: VirtualScrollMeasurementInstance = getVirtualizer(wrapper)
        virtualizer.getMeasurements()
        virtualizer.resizeItem(MEASURED_ITEM_INDEX, MEASURED_ITEM_HEIGHT)
        expect(virtualizer.getTotalSize()).toBe(
            MEASURED_ITEM_HEIGHT + (ITEM_COUNT - 1) * INITIAL_ITEM_HEIGHT,
        )

        await wrapper.setProps({ dynamicHeight: true })
        await settleUpdates()
        expect(virtualizer.getTotalSize()).toBe(ITEM_COUNT * INITIAL_ITEM_HEIGHT)
        expect(getMeasurementStarts(wrapper)).toEqual(
            Array.from({ length: ITEM_COUNT }, (_value: unknown, index: number): number => index * INITIAL_ITEM_HEIGHT),
        )

        wrapper.unmount()
    })
})
