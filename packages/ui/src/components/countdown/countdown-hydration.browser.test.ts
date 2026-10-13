import { renderToString } from '@vue/server-renderer'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Countdown from './Countdown.vue'

const CLOCK_SKEW_MS = 1
const TARGET_OFFSET_MS = (24 * 60 + 30) * 60 * 1000
const SERVER_NOW = Date.parse('2026-10-13T00:00:00.000Z')
const TARGET_TIMESTAMP = SERVER_NOW + TARGET_OFFSET_MS

describe('Countdown SSR hydration', () => {
    let host: HTMLDivElement | null = null

    afterEach(() => {
        host?.remove()
        host = null
        vi.restoreAllMocks()
    })

    it('hydrates across a one millisecond clock difference and starts after mount', async () => {
        const now = vi.spyOn(Date, 'now').mockReturnValue(SERVER_NOW)
        const Root = defineComponent({
            setup() {
                return () => h(Countdown, {
                    value: TARGET_TIMESTAMP,
                    format: 'HH:mm:ss.SSS',
                }, {
                    default: ({ formatted, isReady }: { formatted: string; isReady: boolean }) =>
                        h('span', { class: 'countdown-value', 'data-ready': String(isReady) }, formatted),
                })
            },
        })
        const serverHtml = await renderToString(createSSRApp(Root))
        expect(serverHtml).toContain('<span class="countdown-value" data-ready="false">-</span>')

        host = document.createElement('div')
        host.innerHTML = serverHtml
        document.body.appendChild(host)
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        now.mockReturnValue(SERVER_NOW + CLOCK_SKEW_MS)

        const app = createSSRApp(Root)
        app.mount(host)
        await nextTick()

        expect(consoleError).not.toHaveBeenCalled()
        expect(consoleWarn).not.toHaveBeenCalled()
        expect(host.querySelector('.countdown-value')?.getAttribute('data-ready')).toBe('true')
        expect(host.querySelector('.countdown-value')?.textContent).toBe('24:29:59.999')
        app.unmount()
    })
})
