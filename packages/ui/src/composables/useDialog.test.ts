import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, defineComponent, createApp } from 'vue'
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

    it('resolves structured DialogResult promise upon close', async () => {
        const { show } = useDialog()
        const instance = show<{ ok: boolean }>({ title: 'Result Dialog' })

        await nextTick()
        instance.close({ action: 'confirm', data: { ok: true } })
        vi.advanceTimersByTime(300)

        const outcome = await instance.promise
        expect(outcome).toEqual({ action: 'confirm', data: { ok: true } })
    })

    it('captures caller appContext when called inside component setup', async () => {
        let instance: any
        const ProviderParent = defineComponent({
            setup() {
                const dialog = useDialog()
                instance = dialog.show({ title: 'Context Dialog' })
                return () => null
            },
        })

        const app = createApp(ProviderParent)
        const root = document.createElement('div')
        app.mount(root)

        await nextTick()
        expect(document.body.textContent).toContain('Context Dialog')
        instance.close()
        vi.advanceTimersByTime(300)
        app.unmount()
    })
})
