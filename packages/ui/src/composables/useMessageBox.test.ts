import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, defineComponent, createApp } from 'vue'
import { useMessageBox } from './useMessageBox'
import * as envModule from '@/lib/env'

describe('useMessageBox Composable', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        document.body.innerHTML = ''
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
        document.body.innerHTML = ''
    })

    it('returns full symmetrical set of helper methods', () => {
        const messageBox = useMessageBox()
        expect(typeof messageBox.show).toBe('function')
        expect(typeof messageBox.confirm).toBe('function')
        expect(typeof messageBox.alert).toBe('function')
        expect(typeof messageBox.prompt).toBe('function')
    })

    it('handles confirm method execution and resolves boolean result', async () => {
        const { confirm } = useMessageBox()
        const confirmPromise = confirm('确定要执行操作吗？')

        await nextTick()
        expect(document.body.textContent).toContain('确定要执行操作吗？')

        const confirmBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
            b.textContent?.includes('确认') || b.textContent?.includes('Confirm')
        )
        expect(confirmBtn).toBeDefined()
        confirmBtn!.click()

        const isConfirmed = await confirmPromise
        expect(isConfirmed).toBe(true)
    })

    it('handles alert method execution', async () => {
        const { alert } = useMessageBox()
        const alertPromise = alert('操作完成通知')

        await nextTick()
        expect(document.body.textContent).toContain('操作完成通知')

        const confirmBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
            b.textContent?.includes('确认') || b.textContent?.includes('Confirm')
        )
        expect(confirmBtn).toBeDefined()
        confirmBtn!.click()

        await expect(alertPromise).resolves.toBeUndefined()
    })

    it('handles prompt method with input collection', async () => {
        const { prompt } = useMessageBox()
        const promptPromise = prompt('请输入新名称', {
            inputValue: 'Default Name',
        })

        await nextTick()
        const input = document.body.querySelector('input')
        expect(input).not.toBeNull()
        expect(input!.value).toBe('Default Name')

        const confirmBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
            b.textContent?.includes('确认') || b.textContent?.includes('Confirm')
        )
        confirmBtn!.click()

        const result = await promptPromise
        expect(result).toEqual({ action: 'confirm', value: 'Default Name' })
    })

    it('captures caller appContext when called inside component setup', async () => {
        let instance: any
        const ProviderParent = defineComponent({
            setup() {
                const mb = useMessageBox()
                instance = mb.show({ message: 'Context MessageBox' })
                return () => null
            },
        })

        const app = createApp(ProviderParent)
        const root = document.createElement('div')
        app.mount(root)

        await nextTick()
        expect(document.body.textContent).toContain('Context MessageBox')
        instance.close()
        vi.advanceTimersByTime(300)
        app.unmount()
    })

    it('gracefully handles non-client SSR environments', async () => {
        vi.spyOn(envModule, 'canUseDocumentBody').mockReturnValue(false)

        const { confirm, alert, prompt } = useMessageBox()
        const confirmed = await confirm('SSR Test')
        expect(confirmed).toBe(false)

        const promptRes = await prompt('SSR Prompt')
        expect(promptRes).toEqual({ action: 'cancel' })

        await expect(alert('SSR Alert')).resolves.toBeUndefined()
    })
})
