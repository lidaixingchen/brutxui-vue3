import { createApp } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { getGlobalAppContext, setGlobalApp } from './app-context'

describe('应用上下文归属', () => {
    it('提供当前应用上下文并在应用卸载时释放', () => {
        const app = createApp({ render: () => null })
        const key = Symbol('consumer-context')
        const value = { locale: 'zh-CN' }
        app.provide(key, value)
        app.mount(document.createElement('div'))
        setGlobalApp(app)
        expect(getGlobalAppContext()?.provides[key]).toBe(value)
        app.unmount()
        expect(getGlobalAppContext()).toBeNull()
    })

    it('较早应用卸载不清理当前应用上下文', () => {
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const first = createApp({ render: () => null })
        const second = createApp({ render: () => null })
        first.mount(document.createElement('div'))
        second.mount(document.createElement('div'))
        setGlobalApp(first)
        setGlobalApp(second)
        const current = getGlobalAppContext()
        first.unmount()
        expect(getGlobalAppContext()).toBe(current)
        second.unmount()
        expect(getGlobalAppContext()).toBeNull()
        warning.mockRestore()
    })
})
