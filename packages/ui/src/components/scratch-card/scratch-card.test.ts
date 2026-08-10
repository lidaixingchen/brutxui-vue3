import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { nextTick } from 'vue'
import ScratchCard from './ScratchCard.vue'

interface ScratchCardExposed {
    isRevealed: boolean
    revealAll: () => void
}

function assertScratchCardExposed(vm: unknown): asserts vm is ScratchCardExposed {
    expect(vm).toHaveProperty('isRevealed')
    expect(vm).toHaveProperty('revealAll')
}

// 共享的可变状态：默认不开启 reduced-motion，测试可切换该对象以覆盖 duration=0 分支
const reducedMotionState: { value: boolean } = { value: false }

vi.mock('../../composables/useReducedMotion', () => ({
    useReducedMotion: () => reducedMotionState
}))

function createPointerEvent(type: string, props: PointerEventInit = {}): PointerEvent {
    return new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        ...props,
    })
}

const originalGetContext = HTMLCanvasElement.prototype.getContext

/** Mock 仅实现 ScratchCard 实际使用的 CanvasRenderingContext2D 方法 */
type MockCanvasContext = Pick<CanvasRenderingContext2D,
    'clearRect' | 'fillRect' | 'beginPath' | 'moveTo' | 'lineTo' |
    'stroke' | 'save' | 'restore' | 'scale' | 'arc' | 'fill' | 'getImageData' | 'drawImage'
>

const mockCanvasContext: MockCanvasContext = {
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
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray(400)
    }),
}

beforeAll(() => {
    // getContext 的重载签名无法通过 vi.fn() 直接推断，使用精确的双重断言
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(
        mockCanvasContext,
    ) as typeof originalGetContext
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
        assertScratchCardExposed(wrapper.vm)
        const vm = wrapper.vm
        expect(vm.isRevealed).toBe(false)

        await wrapper.trigger('keydown', { key: 'Enter' })
        expect(vm.isRevealed).toBe(true)
    })

    it('reveals content on Space key press', async () => {
        const wrapper = mount(ScratchCard)
        assertScratchCardExposed(wrapper.vm)
        const vm = wrapper.vm
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

        // buttons: 1 表达"拖动中"：PointerEvent 构造默认 buttons 为 0（未按下），
        // 与真实拖动场景不符（useCanvasInteraction 以 buttons===0 兜底结束刮擦）
        canvas.element.dispatchEvent(createPointerEvent('pointermove', { clientX: 60, clientY: 60, buttons: 1 }))
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

        assertScratchCardExposed(wrapper.vm)
        const vm = wrapper.vm
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

describe('ScratchCard 画布移除定时器（watch(isRevealed)）', () => {
    /** 读取 canvas 的 v-show 状态：canvasRemoved=true 时 v-show 置为 display:none */
    const canvasDisplay = (wrapper: ReturnType<typeof mount>) =>
        (wrapper.find('canvas').element as HTMLElement).style.display

    it('revealed 后画布按 fadeDuration 延迟移除（v-show 隐藏）', async () => {
        vi.useFakeTimers()
        const wrapper = mount(ScratchCard, {
            props: { fadeDuration: 300 },
            slots: { default: 'Content' },
        })
        assertScratchCardExposed(wrapper.vm)
        const vm = wrapper.vm

        vm.revealAll()
        await nextTick()

        // 淡出未结束前画布仍可见
        expect(canvasDisplay(wrapper)).not.toBe('none')

        // 到达 fadeDuration 前一刻仍可见
        await vi.advanceTimersByTimeAsync(299)
        expect(canvasDisplay(wrapper)).not.toBe('none')

        // 达到 fadeDuration 后画布被移除（canvasRemoved=true -> display:none）
        await vi.advanceTimersByTimeAsync(1)
        expect(canvasDisplay(wrapper)).toBe('none')
    })

    it('fadeDuration=0 时 revealed 后立即移除画布', async () => {
        vi.useFakeTimers()
        const wrapper = mount(ScratchCard, {
            props: { fadeDuration: 0 },
            slots: { default: 'Content' },
        })
        assertScratchCardExposed(wrapper.vm)

        wrapper.vm.revealAll()
        await nextTick()

        await vi.advanceTimersByTimeAsync(0)
        expect(canvasDisplay(wrapper)).toBe('none')
    })

    it('prefers-reduced-motion 时即使 fadeDuration>0 也立即移除画布', async () => {
        vi.useFakeTimers()
        reducedMotionState.value = true
        try {
            const wrapper = mount(ScratchCard, {
                props: { fadeDuration: 300 },
                slots: { default: 'Content' },
            })
            assertScratchCardExposed(wrapper.vm)

            wrapper.vm.revealAll()
            await nextTick()

            await vi.advanceTimersByTimeAsync(0)
            expect(canvasDisplay(wrapper)).toBe('none')
        } finally {
            reducedMotionState.value = false
        }
    })

    it('revealed 后画布添加 pointer-events-none 兜底类', async () => {
        vi.useFakeTimers()
        const wrapper = mount(ScratchCard, {
            slots: { default: 'Content' },
        })
        assertScratchCardExposed(wrapper.vm)

        wrapper.vm.revealAll()
        await nextTick()

        expect(wrapper.find('canvas').classes()).toContain('pointer-events-none')
    })

    it('卸载时清理移除画布的定时器', async () => {
        vi.useFakeTimers()
        const wrapper = mount(ScratchCard, {
            props: { fadeDuration: 300 },
            slots: { default: 'Content' },
        })
        assertScratchCardExposed(wrapper.vm)

        wrapper.vm.revealAll()
        await nextTick()

        const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout').mockImplementation(() => {})
        wrapper.unmount()
        expect(clearTimeoutSpy).toHaveBeenCalled()
        clearTimeoutSpy.mockRestore()

        // 卸载后推进时间不报错（清理定时器已生效，回调不会触发）
        await vi.advanceTimersByTimeAsync(500)
    })
})
