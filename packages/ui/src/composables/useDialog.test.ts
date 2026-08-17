import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useDialog } from './useDialog'

describe('useDialog Composable', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        document.body.innerHTML = ''
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
        document.body.innerHTML = ''
    })

    it('manages open/close lifecycle and updates readonly isOpen ref', async () => {
        const { show, close, isOpen } = useDialog()

        expect(isOpen.value).toBe(false)

        show({
            title: 'Composable Dialog',
            content: 'Testing composable integration',
        })

        await nextTick()
        expect(isOpen.value).toBe(true)
        expect(document.body.textContent).toContain('Composable Dialog')

        close()
        await nextTick()
        expect(isOpen.value).toBe(false)

        vi.advanceTimersByTime(300)
        await nextTick()

        expect(document.body.querySelector('.brutx-dialog')).toBeNull()
    })

    it('automatically closes previous dialog instance when opening a new one', async () => {
        const { show, isOpen } = useDialog()

        show({ title: 'First Dialog' })
        await nextTick()
        expect(document.body.textContent).toContain('First Dialog')
        expect(isOpen.value).toBe(true)

        show({ title: 'Second Dialog' })
        await nextTick()
        expect(document.body.textContent).toContain('Second Dialog')
        expect(isOpen.value).toBe(true)
    })
})
