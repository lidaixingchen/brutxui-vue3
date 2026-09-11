import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, h } from 'vue'
import { showDialog, type DialogResult } from './functional'

describe('Functional Dialog APIs (showDialog)', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
        vi.useFakeTimers()
    })

    afterEach(() => {
        document.body.innerHTML = ''
        vi.useRealTimers()
    })

    it('renders and mounts dialog elements in body with structured outcome', async () => {
        const { close, promise } = showDialog({
            title: 'Functional Title',
            description: 'Functional Description',
            content: 'Functional Content Message',
            showCloseButton: true,
        })

        await nextTick()

        // Verify title, description and content are in document body
        expect(document.body.innerHTML).toContain('Functional Title')
        expect(document.body.innerHTML).toContain('Functional Description')
        expect(document.body.innerHTML).toContain('Functional Content Message')

        close()
        await nextTick()
        vi.advanceTimersByTime(300)
        const outcome = await promise

        expect(outcome).toEqual({ action: 'close' })
        // Verify element is destroyed and removed from body
        expect(document.body.querySelector('.brutx-dialog')).toBeNull()
    })

    it('resolves structured outcome with custom data when confirmed', async () => {
        const { close, promise } = showDialog<{ id: number }>({
            title: 'Confirm Dialog',
            content: 'Testing confirm data payload',
        })

        await nextTick()
        close({ action: 'confirm', data: { id: 42 } })
        await nextTick()
        vi.advanceTimersByTime(300)

        const outcome = await promise
        expect(outcome).toEqual({ action: 'confirm', data: { id: 42 } })
    })

    it('supports rendering functions/components as content and footer with close context', async () => {
        const { promise } = showDialog({
            title: 'Title',
            content: () => h('div', { class: 'custom-content' }, 'Rendered Content'),
            footer: ({ close }: { close: (result?: DialogResult) => void }) =>
                h(
                    'button',
                    {
                        class: 'confirm-test-btn',
                        onClick: () => close({ action: 'confirm' }),
                    },
                    'Custom Confirm'
                ),
        })

        await nextTick()

        expect(document.body.innerHTML).toContain('Rendered Content')
        const btn = document.body.querySelector('.confirm-test-btn') as HTMLButtonElement
        expect(btn).not.toBeNull()

        btn.click()
        await nextTick()
        vi.advanceTimersByTime(300)

        const outcome = await promise
        expect(outcome).toEqual({ action: 'confirm' })
    })

    it('handles onCancel callback only when action is cancel', async () => {
        const onCancel = vi.fn()
        const { close } = showDialog({
            title: 'Cancel Callback Test',
            content: 'Testing cancel hook',
            onCancel,
        })

        await nextTick()
        close({ action: 'cancel' })
        await nextTick()

        expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('does not trigger onCancel callback when confirmed or closed with default action', async () => {
        const onCancel = vi.fn()
        const { close, promise } = showDialog({
            title: 'Confirm No Cancel Test',
            content: 'Testing cancel hook on confirm',
            onCancel,
        })

        await nextTick()
        close({ action: 'confirm' })
        await nextTick()
        vi.advanceTimersByTime(300)

        const outcome = await promise
        expect(outcome).toEqual({ action: 'confirm' })
        expect(onCancel).not.toHaveBeenCalled()
    })

    it('resolves to action: close when footer close is called with no arguments', async () => {
        const { promise } = showDialog({
            title: 'Footer No-Arg Close',
            footer: ({ close }: { close: (result?: DialogResult) => void }) =>
                h(
                    'button',
                    {
                        class: 'default-close-btn',
                        onClick: () => close(),
                    },
                    'Default Close'
                ),
        })

        await nextTick()
        const btn = document.body.querySelector('.default-close-btn') as HTMLButtonElement
        expect(btn).not.toBeNull()
        btn.click()
        await nextTick()
        vi.advanceTimersByTime(300)

        const outcome = await promise
        expect(outcome).toEqual({ action: 'close' })
    })
})
