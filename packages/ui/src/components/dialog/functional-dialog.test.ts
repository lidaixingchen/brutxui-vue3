import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, h } from 'vue'
import { showDialog, showMessageBox } from './functional'

describe('Functional Dialog APIs', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
        vi.useFakeTimers()
    })

    afterEach(() => {
        document.body.innerHTML = ''
        vi.useRealTimers()
    })

    describe('showDialog', () => {
        it('renders and mounts dialog elements in body', async () => {
            const { close, promise } = showDialog({
                title: 'Functional Title',
                content: 'Functional Content Message',
                showCloseButton: true,
            })

            await nextTick()

            // Verify title and content are in document body
            expect(document.body.innerHTML).toContain('Functional Title')
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
    })

    describe('showMessageBox', () => {
        it('renders confirm and cancel buttons, handles click confirm', async () => {
            let resolved = false
            const { promise } = showMessageBox({
                title: 'Confirm Title',
                message: 'Confirm message text',
                showCancelButton: true,
            })

            promise.then(() => {
                resolved = true
            })

            await nextTick()

            expect(document.body.innerHTML).toContain('Confirm Title')
            expect(document.body.innerHTML).toContain('Confirm message text')

            // Click Confirm button
            const buttons = Array.from(document.body.querySelectorAll('button'))
            const confirmBtn = buttons.find((btn) => btn.textContent?.trim() === '确定' || btn.textContent?.trim() === 'Confirm')
            expect(confirmBtn).toBeDefined()

            if (confirmBtn) {
                confirmBtn.click()
            }

            vi.advanceTimersByTime(300)
            await nextTick()

            expect(resolved).toBe(true)
        })

        it('handles click cancel and rejects promise', async () => {
            let rejectedReason = ''
            const { promise } = showMessageBox({
                title: 'Cancel Title',
                message: 'Cancel message text',
                showCancelButton: true,
            })

            promise.catch((reason) => {
                rejectedReason = reason
            })

            await nextTick()

            // Click Cancel button
            const buttons = Array.from(document.body.querySelectorAll('button'))
            const cancelBtn = buttons.find((btn) => btn.textContent?.trim() === '取消' || btn.textContent?.trim() === 'Cancel')
            expect(cancelBtn).toBeDefined()

            if (cancelBtn) {
                cancelBtn.click()
            }

            vi.advanceTimersByTime(300)
            await nextTick()

            expect(rejectedReason).toBe('cancel')
        })

        it('supports prompt input box and validates pattern matching', async () => {
            let resolvedVal: any = null
            const { promise } = showMessageBox({
                title: 'Prompt Title',
                showInput: true,
                inputPattern: /^\d+$/, // must be digits
                inputErrorMessage: 'Must be number',
            })

            promise.then((val) => {
                resolvedVal = val
            })

            await nextTick()

            const input = document.body.querySelector('input') as HTMLInputElement
            expect(input).not.toBeNull()

            // Click Confirm with empty input (fails pattern validation)
            const buttons = Array.from(document.body.querySelectorAll('button'))
            const confirmBtn = buttons.find((btn) => btn.textContent?.trim() === '确定' || btn.textContent?.trim() === 'Confirm')
            expect(confirmBtn).toBeDefined()

            if (confirmBtn) {
                confirmBtn.click()
            }

            await nextTick()
            // Should show error message and NOT resolve
            expect(document.body.innerHTML).toContain('Must be number')
            expect(resolvedVal).toBeNull()

            // Set valid input
            input.value = '12345'
            input.dispatchEvent(new Event('input'))
            await nextTick()

            if (confirmBtn) {
                confirmBtn.click()
            }

            vi.advanceTimersByTime(300)
            await nextTick()

            expect(resolvedVal).toEqual({ value: '12345' })
        })
    })
})
