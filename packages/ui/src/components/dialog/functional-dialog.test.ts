import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, h } from 'vue'
import { showDialog } from './functional'

describe('Functional Dialog APIs (showDialog)', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
        vi.useFakeTimers()
    })

    afterEach(() => {
        document.body.innerHTML = ''
        vi.useRealTimers()
    })

    it('renders and mounts dialog elements in body', async () => {
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
        await promise

        // Verify element is destroyed and removed from body
        expect(document.body.querySelector('.brutx-dialog')).toBeNull()
    })

    it('supports rendering functions/components as content and footer', async () => {
        const { close } = showDialog({
            title: 'Title',
            content: () => h('div', { class: 'custom-content' }, 'Rendered Content'),
            footer: () => h('div', { class: 'custom-footer' }, 'Rendered Footer'),
        })

        await nextTick()

        expect(document.body.innerHTML).toContain('Rendered Content')
        expect(document.body.innerHTML).toContain('Rendered Footer')

        close()
        await nextTick()
        vi.advanceTimersByTime(300)
    })

    it('handles onCancel callback when closed', async () => {
        const onCancel = vi.fn()
        const { close } = showDialog({
            title: 'Cancel Callback Test',
            content: 'Testing cancel hook',
            onCancel,
        })

        await nextTick()
        close()
        await nextTick()

        expect(onCancel).toHaveBeenCalledTimes(1)
    })
})
