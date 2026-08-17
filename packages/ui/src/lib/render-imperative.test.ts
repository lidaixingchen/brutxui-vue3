import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import {
    mountOverlay,
    renderImperative,
} from './render-imperative'
import {
    DEFAULT_OVERLAY_Z_INDEX,
    OVERLAY_Z_INDEX_STEP,
} from './defaults'
import * as envModule from './env'

// 测试用伪组件
const SimpleModal = defineComponent({
    name: 'SimpleModal',
    props: {
        open: { type: Boolean, default: true },
        zIndex: { type: Number, default: 1000 },
        title: { type: String, default: 'Test Modal' },
    },
    setup(props) {
        return () =>
            h(
                'div',
                {
                    class: 'simple-modal',
                    'data-open': String(props.open),
                    style: { zIndex: props.zIndex },
                },
                props.title
            )
    },
})

describe('Imperative Overlay Host Controller (mountOverlay)', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        document.body.innerHTML = ''
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
        document.body.innerHTML = ''
    })

    it('should mount component into document.body and render content', async () => {
        const handle = mountOverlay(SimpleModal, { title: 'Hello BrutxUI' })

        expect(document.body.querySelector('.simple-modal')).not.toBeNull()
        expect(document.body.textContent).toContain('Hello BrutxUI')

        handle.destroy()
        expect(document.body.querySelector('.simple-modal')).toBeNull()
    })

    it('should perform Two-Phase Controlled Closing (phase A: open=false, phase B: DOM GC)', async () => {
        const onClose = vi.fn()
        const onDestroy = vi.fn()
        const transitionDuration = 300

        const handle = mountOverlay(
            SimpleModal,
            { title: 'Transition Test' },
            {
                transitionDuration,
                onClose,
                onDestroy,
            }
        )

        const modalEl = document.body.querySelector('.simple-modal')
        expect(modalEl?.getAttribute('data-open')).toBe('true')

        // Phase A: close() 被调用
        handle.close({ action: 'cancel' })
        await nextTick()

        // 验证 Phase A: open 置为 false，通知 onClose 钩子，但 DOM 容器在过渡期内尚未被移除
        expect(modalEl?.getAttribute('data-open')).toBe('false')
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(onDestroy).not.toHaveBeenCalled()
        expect(document.body.querySelector('.simple-modal')).not.toBeNull()

        // 时间推进 299ms，仍处于过渡窗口，不执行 GC
        vi.advanceTimersByTime(299)
        expect(document.body.querySelector('.simple-modal')).not.toBeNull()

        // 时间推进至 300ms，触发 Phase B 物理 GC
        vi.advanceTimersByTime(1)
        expect(onDestroy).toHaveBeenCalledTimes(1)
        expect(document.body.querySelector('.simple-modal')).toBeNull()

        // 验证 promise 正确兑现
        const result = await handle.promise
        expect(result).toEqual({ action: 'cancel' })
    })

    it('should immediately clean up when destroy() is called directly', async () => {
        const onClose = vi.fn()
        const onDestroy = vi.fn()

        const handle = mountOverlay(
            SimpleModal,
            {},
            {
                transitionDuration: 300,
                onClose,
                onDestroy,
            }
        )

        expect(document.body.querySelector('.simple-modal')).not.toBeNull()

        handle.destroy({ action: 'destroy' })
        expect(onDestroy).toHaveBeenCalledTimes(1)
        // 直接 destroy() 不触发 onClose
        expect(onClose).not.toHaveBeenCalled()
        expect(document.body.querySelector('.simple-modal')).toBeNull()

        const result = await handle.promise
        expect(result).toEqual({ action: 'destroy' })
    })

    it('should manage LIFO stack and automatically increment z-index based on defaults', async () => {
        const handle1 = mountOverlay(SimpleModal, { title: 'Modal 1' })
        const handle2 = mountOverlay(SimpleModal, { title: 'Modal 2' })
        const handle3 = mountOverlay(SimpleModal, { title: 'Modal 3' })

        const modals = document.body.querySelectorAll('.simple-modal')
        expect(modals.length).toBe(3)

        const z1 = Number((modals[0] as HTMLElement).style.zIndex)
        const z2 = Number((modals[1] as HTMLElement).style.zIndex)
        const z3 = Number((modals[2] as HTMLElement).style.zIndex)

        expect(z1).toBe(DEFAULT_OVERLAY_Z_INDEX)
        expect(z2).toBe(DEFAULT_OVERLAY_Z_INDEX + OVERLAY_Z_INDEX_STEP)
        expect(z3).toBe(DEFAULT_OVERLAY_Z_INDEX + OVERLAY_Z_INDEX_STEP * 2)

        handle3.destroy()
        handle2.destroy()
        handle1.destroy()
    })

    it('should route ESC keydown exclusively to the top active overlay in LIFO stack', async () => {
        const handle1 = mountOverlay(SimpleModal, { title: 'Modal 1' })
        const handle2 = mountOverlay(SimpleModal, { title: 'Modal 2' })

        const escEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true,
        })
        const stopPropagationSpy = vi.spyOn(escEvent, 'stopPropagation')

        window.dispatchEvent(escEvent)
        await nextTick()

        // 仅栈顶 Modal 2 被触发关闭（open=false）
        const modals = document.body.querySelectorAll('.simple-modal')
        expect(modals[0].getAttribute('data-open')).toBe('true')
        expect(modals[1].getAttribute('data-open')).toBe('false')
        expect(stopPropagationSpy).toHaveBeenCalled()

        handle1.destroy()
        handle2.destroy()
    })

    it('should respect enableEsc=false option and ignore ESC key', async () => {
        const handle = mountOverlay(
            SimpleModal,
            { title: 'Non-closable Modal' },
            { enableEsc: false }
        )

        const escEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true,
        })
        window.dispatchEvent(escEvent)
        await nextTick()

        const modal = document.body.querySelector('.simple-modal')
        expect(modal?.getAttribute('data-open')).toBe('true')

        handle.destroy()
    })

    it('should support propsFactory function for dynamic and reactive binding', async () => {
        let capturedContext: unknown = null

        const handle = mountOverlay(SimpleModal, (context) => {
            capturedContext = context
            return {
                title: 'Factory Modal',
                zIndex: context.zIndex,
                open: context.isOpen.value,
            }
        })

        expect(capturedContext).toBeDefined()
        expect((capturedContext as any).zIndex).toBe(DEFAULT_OVERLAY_Z_INDEX)
        expect((capturedContext as any).isOpen.value).toBe(true)

        handle.destroy()
    })

    it('should forward custom appContext if provided in options', async () => {
        const { createApp } = await import('vue')
        const dummyApp = createApp({})
        dummyApp.provide('testKey', 'testValue')

        const handle = mountOverlay(
            SimpleModal,
            {},
            { appContext: dummyApp._context }
        )
        expect(document.body.querySelector('.simple-modal')).not.toBeNull()
        handle.destroy()
    })

    it('should safely fallback and resolve promise when canUseDocumentBody is false (SSR guard)', async () => {
        vi.spyOn(envModule, 'canUseDocumentBody').mockReturnValue(false)

        const handle = mountOverlay(SimpleModal, { title: 'SSR Modal' })

        expect(document.body.querySelector('.simple-modal')).toBeNull()
        expect(typeof handle.close).toBe('function')
        expect(typeof handle.destroy).toBe('function')

        // promise 应立即处于 resolved 状态
        const result = await handle.promise
        expect(result).toBeUndefined()
    })

    it('should maintain backward compatibility via renderImperative()', async () => {
        const res = renderImperative(SimpleModal, { title: 'Legacy Imperative' })
        expect(document.body.textContent).toContain('Legacy Imperative')

        res.destroy()
        expect(document.body.querySelector('.simple-modal')).toBeNull()
    })
})
