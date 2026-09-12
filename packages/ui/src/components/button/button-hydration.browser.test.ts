import { renderToString } from '@vue/server-renderer'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Button from './Button.vue'

describe('Button SSR hydration', () => {
    let host: HTMLDivElement | null = null

    afterEach(() => {
        host?.remove()
        host = null
        vi.restoreAllMocks()
    })

    it('hydrates without mismatch and initializes text after mount when enabled', async () => {
        const Root = defineComponent({
            setup() {
                return () => h(Button, {
                    effect: 'glitch',
                    glitchTrigger: 'none',
                }, { default: () => 'Hydrated button' })
            },
        })
        const serverHtml = await renderToString(createSSRApp(Root))
        expect(serverHtml).not.toContain('data-text')

        host = document.createElement('div')
        host.innerHTML = serverHtml
        document.body.appendChild(host)
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        const app = createSSRApp(Root)
        app.mount(host)
        await nextTick()

        expect(consoleError).not.toHaveBeenCalled()
        expect(host.querySelector('button')?.getAttribute('data-text')).toBe('Hydrated button')
        app.unmount()
    })

    it('hydrates a disabled effect without querying reduced motion or reading text', async () => {
        const matchMedia = vi.spyOn(window, 'matchMedia')
        const textContent = vi.spyOn(Node.prototype, 'textContent', 'get')
        const Root = defineComponent({
            setup() {
                return () => h(Button, {
                    effect: 'none',
                    glitchTrigger: 'autoplay',
                }, { default: () => 'Plain hydrated button' })
            },
        })
        const serverHtml = await renderToString(createSSRApp(Root))
        host = document.createElement('div')
        host.innerHTML = serverHtml
        document.body.appendChild(host)
        const app = createSSRApp(Root)
        app.mount(host)
        await nextTick()

        expect(matchMedia).not.toHaveBeenCalled()
        expect(textContent).not.toHaveBeenCalled()
        expect(host.querySelector('button')?.hasAttribute('data-text')).toBe(false)
        app.unmount()
        matchMedia.mockRestore()
        textContent.mockRestore()
    })
})
