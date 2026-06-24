import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { ref } from 'vue'
import ScratchCard from './ScratchCard.vue'

interface ScratchCardExposed {
    isRevealed: { value: boolean }
    revealAll: () => void
}

vi.mock('../../composables/useReducedMotion', () => ({
    useReducedMotion: () => ref(false)
}))

function createPointerEvent(type: string, props: PointerEventInit = {}): PointerEvent {
    return new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        ...props,
    })
}

const originalGetContext = HTMLCanvasElement.prototype.getContext

beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        scale: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        getImageData: vi.fn().mockReturnValue({
            data: new Uint8ClampedArray(400)
        })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mock 不需要完全匹配 CanvasRenderingContext2D 的类型
    }) as any
})

afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext
})

afterEach(() => {
    vi.useRealTimers()
})

describe('ScratchCard', () => {
    it('renders slot content', () => {
        const wrapper = mount(ScratchCard, {
            slots: { default: 'Secret Reward' }
        })
        expect(wrapper.text()).toContain('Secret Reward')
    })

    it('reveals content on Enter key press', async () => {
        const wrapper = mount(ScratchCard)
        const vm = wrapper.vm as unknown as ScratchCardExposed
        expect(vm.isRevealed).toBe(false)

        await wrapper.trigger('keydown', { key: 'Enter' })
        expect(vm.isRevealed).toBe(true)
    })

    it('reveals content on Space key press', async () => {
        const wrapper = mount(ScratchCard)
        const vm = wrapper.vm as unknown as ScratchCardExposed
        expect(vm.isRevealed).toBe(false)

        await wrapper.trigger('keydown', { key: ' ' })
        expect(vm.isRevealed).toBe(true)
    })

    it('emits progress event when scratching', async () => {
        const wrapper = mount(ScratchCard, {
            slots: { default: 'Content' }
        })

        const canvas = wrapper.find('canvas')
        canvas.element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 50, clientY: 50 }))
        await wrapper.vm.$nextTick()

        canvas.element.dispatchEvent(createPointerEvent('pointermove', { clientX: 60, clientY: 60 }))
        await wrapper.vm.$nextTick()

        canvas.element.dispatchEvent(createPointerEvent('pointerup'))
        await wrapper.vm.$nextTick()

        const progressEvents = wrapper.emitted('progress')
        expect(progressEvents).toBeTruthy()
    })

    it('emits completed event when revealAll is called', async () => {
        vi.useFakeTimers()

        const wrapper = mount(ScratchCard, {
            slots: { default: 'Content' }
        })

        const vm = wrapper.vm as unknown as ScratchCardExposed
        vm.revealAll()

        await vi.advanceTimersByTimeAsync(500)

        expect(wrapper.emitted('completed')).toBeTruthy()
    })

    it('cleans up resize observer on unmount', () => {
        const wrapper = mount(ScratchCard, {
            slots: { default: 'Content' }
        })

        const disconnectSpy = vi.spyOn(ResizeObserver.prototype, 'disconnect')
        wrapper.unmount()
        expect(disconnectSpy).toHaveBeenCalled()
        disconnectSpy.mockRestore()
    })
})
