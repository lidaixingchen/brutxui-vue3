import { describe, it, expect, beforeEach, afterEach, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { DialogRoot, DialogTrigger } from 'reka-ui'
import Button from '../button/Button.vue'
import DialogDescription from './DialogDescription.vue'
import DialogEnhanced from './DialogEnhanced.vue'
import DialogTestFixture from './DialogTestFixture.vue'
import DialogTitle from './DialogTitle.vue'
import NestedDialogTestFixture from './NestedDialogTestFixture.vue'
import { showDialog, type DialogResult } from './functional'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'

describe('Dialog Browser Integration (Chromium)', () => {
    let host: HTMLDivElement | null = null
    let mounted: ReturnType<typeof mount> | undefined

    beforeEach(() => {
        host = document.createElement('div')
        document.body.appendChild(host)
    })

    afterEach(() => {
        mounted?.unmount()
        mounted = undefined
        if (host && host.parentNode) {
            host.parentNode.removeChild(host)
            host = null
        }
        document.body.style.overflow = ''
        document.body.style.pointerEvents = ''
    })

    it('manages initial focus, focus trap, and returns focus on close', async () => {
        const wrapper = mounted = mount(DialogTestFixture, { attachTo: host! })
        const vm = wrapper.vm as unknown as { open: boolean }

        const trigger = document.getElementById('trigger-btn') as HTMLButtonElement
        expect(trigger).not.toBeNull()

        trigger.focus()
        expect(document.activeElement).toBe(trigger)

        // 打开弹窗
        vm.open = true
        await nextTick()
        await new Promise(r => setTimeout(r, 100))

        // 验证初始焦点进入弹窗内
        const activeEl = document.activeElement
        const dialogContent = document.getElementById('dialog-content')
        expect(dialogContent).not.toBeNull()
        expect(dialogContent!.contains(activeEl)).toBe(true)

        // 关闭弹窗
        vm.open = false
        // 验证关闭后焦点自动返回到触发按钮
        await expect.poll(() => document.activeElement).toBe(trigger)
    })

    it('handles nested dialog escape sequence and restores scroll state', async () => {
        const wrapper = mounted = mount(NestedDialogTestFixture, { attachTo: host! })
        const vm = wrapper.vm as unknown as { outerOpen: boolean; innerOpen: boolean }

        // 1. 打开外层弹窗
        vm.outerOpen = true
        await nextTick()
        await new Promise(r => setTimeout(r, 100))
        expect(document.getElementById('outer-content')).not.toBeNull()

        // 2. 打开内层嵌套弹窗
        vm.innerOpen = true
        await nextTick()
        await new Promise(r => setTimeout(r, 100))
        expect(document.getElementById('inner-content')).not.toBeNull()

        // 3. 模拟在内层弹窗按 Escape
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })
        document.activeElement?.dispatchEvent(escapeEvent)
        await nextTick()
        await new Promise(r => setTimeout(r, 100))

        // 验证内层弹窗由于 Escape 自动关闭，外层弹窗依然保持开启
        expect(vm.innerOpen).toBe(false)
        await expect.poll(() => document.getElementById('inner-content')).toBeNull()
        expect(document.getElementById('outer-content')).not.toBeNull()

        // 4. 关闭外层弹窗
        vm.outerOpen = false
        await nextTick()
        await new Promise(r => setTimeout(r, 100))

        // 5. 验证弹窗彻底卸载后滚动与交互状态复原
        wrapper.unmount()
        mounted = undefined
        expect(document.body.style.pointerEvents).not.toBe('none')
    })
})

function findDialogContent() {
    return document.querySelector<HTMLElement>('[role="dialog"]')
}

describe('DialogEnhanced Browser Integration (Chromium)', () => {
    let mounted: ReturnType<typeof mount> | undefined
    let imperative: ReturnType<typeof showDialog> | undefined
    let originalViewport: { width: number; height: number } | undefined
    const desktopViewport = { width: 1100, height: 720 }

    async function useDesktopViewport() {
        originalViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(desktopViewport.width, desktopViewport.height)
    }

    afterEach(async () => {
        imperative?.destroy()
        imperative = undefined
        mounted?.unmount()
        mounted = undefined
        if (originalViewport) {
            await page.viewport(originalViewport.width, originalViewport.height)
            originalViewport = undefined
        }
    })

    function mountEnhanced({
        beforeClose,
        controlled = false,
        geometry = false,
        draggable = geometry,
        initialPosition,
    }: {
        beforeClose?: () => boolean | Promise<boolean>
        controlled?: boolean
        geometry?: boolean
        draggable?: boolean
        initialPosition?: { x: number; y: number }
    } = {}) {
        const open = ref(false)
        const close = vi.fn()
        const rootUpdate = vi.fn((value: boolean) => {
            if (value) open.value = value
        })
        const contentUpdate = vi.fn()
        mounted = mount(defineComponent({
            setup: () => () => h(DialogRoot, {
                open: controlled ? open.value : undefined,
                'onUpdate:open': rootUpdate,
            }, () => [
                h(DialogTrigger, {}, () => '打开对话框'),
                h(DialogEnhanced, {
                    beforeClose,
                    draggable,
                    resizable: geometry,
                    initialPosition,
                    dragHandle: '#geometry-handle',
                    class: geometry ? 'h-48' : undefined,
                    onClose: close,
                    'onUpdate:open': contentUpdate,
                }, () => [
                    h(DialogTitle, {}, () => h('span', { id: 'geometry-handle' }, '标题')),
                    h(DialogDescription, {}, () => '内容说明'),
                ]),
            ]),
        }))
        const trigger = mounted.element.querySelector<HTMLButtonElement>('button')!
        return { trigger, open, close, rootUpdate, contentUpdate }
    }

    const dismiss = {
        button: () => userEvent.click(findDialogContent()!.querySelector('button')!),
        Escape: () => userEvent.keyboard('[Escape]'),
        overlay: () => {
            const overlay = document.querySelector<HTMLElement>('.bg-brutal-overlay')!
            return userEvent.click(overlay, { position: { x: 16, y: 16 } })
        },
    }

    async function renderedContent() {
        await expect.poll(findDialogContent).not.toBeNull()
        const content = findDialogContent()!
        await Promise.all(content.getAnimations().map(animation => animation.finished))
        return content
    }

    function pointer(type: string, target: EventTarget, x: number, y: number) {
        target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }))
    }

    function resize(content: HTMLElement, corner: string, dx: number, dy: number) {
        const handle = content.querySelector(`.cursor-${corner}-resize`)!
        const { x, y } = handle.getBoundingClientRect()
        pointer('pointerdown', handle, x, y)
        pointer('pointermove', document, x + dx, y + dy)
        pointer('pointerup', document, x + dx, y + dy)
        return nextTick()
    }

    it.each(Object.keys(dismiss) as (keyof typeof dismiss)[])(
        'applies the same pending, denied and approved close behavior for %s',
        async (entry) => {
            let settle!: (result: boolean) => void
            const beforeClose = vi.fn(() => new Promise<boolean>(resolve => { settle = resolve }))
            const { trigger, close, rootUpdate, contentUpdate } = mountEnhanced({ beforeClose })
            await userEvent.click(trigger)
            await expect.poll(() => findDialogContent()?.dataset.state).toBe('open')

            await dismiss[entry]()
            await dismiss.Escape()
            expect(beforeClose).toHaveBeenCalledTimes(1)
            expect(findDialogContent()?.dataset.state).toBe('open')
            expect(close).not.toHaveBeenCalled()
            settle(false)
            await nextTick()
            expect(findDialogContent()?.dataset.state).toBe('open')
            expect(contentUpdate).not.toHaveBeenCalled()
            expect(rootUpdate.mock.calls).toEqual([[true]])

            await dismiss[entry]()
            expect(beforeClose).toHaveBeenCalledTimes(2)
            settle(true)
            await expect.poll(findDialogContent).toBeNull()
            await expect.poll(() => document.activeElement).toBe(trigger)
            expect(close).toHaveBeenCalledTimes(1)
            expect(contentUpdate.mock.calls).toEqual([[false]])
            expect(rootUpdate.mock.calls).toEqual([[true], [false]])
        },
    )

    it('keeps the controlled state and scopes pending approval to the current opening', async () => {
        const approvals: ((result: boolean) => void)[] = []
        const beforeClose = () => new Promise<boolean>(resolve => approvals.push(resolve))
        const { trigger, open, close, rootUpdate } = mountEnhanced({ controlled: true, beforeClose })
        await userEvent.click(trigger)
        await dismiss.button()
        expect(findDialogContent()?.dataset.state).toBe('open')

        open.value = false
        await expect.poll(findDialogContent).toBeNull()
        await userEvent.click(trigger)
        await dismiss.Escape()
        approvals[0]!(true)
        await nextTick()
        expect(close).not.toHaveBeenCalled()
        expect(findDialogContent()?.dataset.state).toBe('open')

        approvals[1]!(true)
        await expect.poll(() => close.mock.calls.length).toBe(1)
        expect(rootUpdate.mock.calls).toEqual([[true], [true], [false]])
        expect(findDialogContent()?.dataset.state).toBe('open')
    })

    it('resolves implicit cancellation once and keeps the explicit footer result', async () => {
        const beforeClose = vi.fn(() => true)
        const onCancel = vi.fn()
        const options = { title: '标题', description: '内容说明', beforeClose, onCancel }
        imperative = showDialog(options)
        await expect.poll(findDialogContent).not.toBeNull()
        await dismiss.button()
        await expect(imperative.promise).resolves.toEqual({ action: 'cancel' })
        expect(beforeClose).toHaveBeenCalledTimes(1)
        expect(onCancel).toHaveBeenCalledTimes(1)
        imperative.destroy()

        imperative = showDialog({
            ...options,
            footer: ({ close }: { close: (result?: DialogResult) => void }) =>
                h(Button, { onClick: () => close({ action: 'confirm' }) }, () => '确定'),
        })
        await expect.poll(findDialogContent).not.toBeNull()
        const footer = Array.from(findDialogContent()!.querySelectorAll('button'))
            .find(button => button.textContent === '确定')!
        await userEvent.click(footer)
        await expect(imperative.promise).resolves.toEqual({ action: 'confirm' })
        expect(beforeClose).toHaveBeenCalledTimes(1)
        expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('observes and moves the actual content and stops a gesture when it unmounts', async () => {
        await useDesktopViewport()
        const observe = vi.spyOn(ResizeObserver.prototype, 'observe')
        onTestFinished(() => { observe.mockRestore() })
        const { trigger } = mountEnhanced({ geometry: true })
        await userEvent.click(trigger)
        const content = await renderedContent()
        expect(observe.mock.calls.map(([target]) => target)).toContain(content)

        const before = content.getBoundingClientRect()
        expect(before.x + before.width / 2).toBeCloseTo(window.innerWidth / 2)
        expect(before.y + before.height / 2).toBeCloseTo(window.innerHeight / 2)
        pointer('pointerdown', content.querySelector('#geometry-handle')!, before.x, before.y)
        pointer('pointermove', document, before.x + 40, before.y + 30)
        pointer('pointerup', document, before.x + 40, before.y + 30)
        await nextTick()
        const moved = content.getBoundingClientRect()
        expect(moved.x - before.x).toBeCloseTo(40)
        expect(moved.y - before.y).toBeCloseTo(30)

        pointer('pointerdown', content.querySelector('.cursor-se-resize')!, moved.right, moved.bottom)
        pointer('pointermove', document, moved.right + 40, moved.bottom + 30)
        await nextTick()
        expect(content.getBoundingClientRect().width).toBeCloseTo(moved.width + 40)
        expect(content.getBoundingClientRect().height).toBeCloseTo(moved.height + 30)

        await dismiss.Escape()
        await expect.poll(findDialogContent).toBeNull()
        await userEvent.click(trigger)
        const reopened = findDialogContent()!
        await expect.poll(() => observe.mock.calls.map(([target]) => target)).toContain(reopened)
        const reopenedSize = reopened.style.width
        pointer('pointermove', document, moved.right - 80, moved.bottom - 60)
        await nextTick()
        expect(reopened).not.toBe(content)
        expect(reopened.style.width).toBe(reopenedSize)
    })

    it('keeps a controlled resizable dialog responsive before resizing', async () => {
        await useDesktopViewport()
        const { trigger } = mountEnhanced({ controlled: true, geometry: true, draggable: false })
        await userEvent.click(trigger)
        const content = await renderedContent()
        expect(content.getBoundingClientRect().width).toBeGreaterThan(390)

        await page.viewport(390, desktopViewport.height)
        const mobileRect = content.getBoundingClientRect()
        expect(mobileRect.left).toBeGreaterThanOrEqual(0)
        expect(mobileRect.right).toBeLessThanOrEqual(window.innerWidth)
        expect(content.style.width).toBe('')
    })

    it('keeps the opposite corner fixed for resize-only dialogs, including at the viewport edge', async () => {
        await useDesktopViewport()
        const initialPosition = { x: 70, y: 20 }
        const { trigger } = mountEnhanced({ geometry: true, draggable: false, initialPosition })
        await userEvent.click(trigger)
        const content = await renderedContent()
        const initial = content.getBoundingClientRect()
        expect(initial.left + initial.width / 2).toBeCloseTo(window.innerWidth / 2 + initialPosition.x)
        expect(initial.top + initial.height / 2).toBeCloseTo(window.innerHeight / 2 + initialPosition.y)

        for (const corner of ['se', 'sw', 'ne', 'nw']) {
            const east = corner.endsWith('e')
            const south = corner.startsWith('s')
            const before = content.getBoundingClientRect()
            await resize(content, corner, east ? 30 : -30, south ? 20 : -20)
            const after = content.getBoundingClientRect()
            expect(after.width).toBeCloseTo(before.width + 30)
            expect(after.height).toBeCloseTo(before.height + 20)
            expect(east ? after.left : after.right).toBeCloseTo(east ? before.left : before.right)
            expect(south ? after.top : after.bottom).toBeCloseTo(south ? before.top : before.bottom)
        }

        const beforeEdge = content.getBoundingClientRect()
        await resize(content, 'se', window.innerWidth, window.innerHeight)
        const atEdge = content.getBoundingClientRect()
        expect(atEdge.left).toBeCloseTo(beforeEdge.left)
        expect(atEdge.top).toBeCloseTo(beforeEdge.top)
        expect(atEdge.right).toBeCloseTo(window.innerWidth)
        expect(atEdge.bottom).toBeCloseTo(window.innerHeight)
    })

    it('uses the imperative size preset until the user resizes within maxWidth', async () => {
        await useDesktopViewport()
        const maxWidth = 620
        imperative = showDialog({ title: '标题', description: '内容说明', size: 'lg', resizable: true, maxWidth, class: 'h-48' })
        const content = await renderedContent()
        const initial = content.getBoundingClientRect()
        expect(getComputedStyle(content).maxWidth).toBe(`${initial.width}px`)
        expect(initial.width).toBeLessThan(maxWidth)
        await resize(content, 'se', 180, 30)
        expect(content.getBoundingClientRect().width).toBeCloseTo(maxWidth)
    })

    it('positions the imperative full preset at the viewport origin', async () => {
        await useDesktopViewport()
        imperative = showDialog({ title: '标题', description: '内容说明', size: 'full', resizable: true })
        const content = await renderedContent()
        const rect = content.getBoundingClientRect()
        expect(rect.left).toBeCloseTo(0)
        expect(rect.top).toBeCloseTo(0)
        expect(rect.width).toBeCloseTo(window.innerWidth)
        expect(rect.height).toBeCloseTo(window.innerHeight)
    })
})
