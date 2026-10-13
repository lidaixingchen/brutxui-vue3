import { renderToString } from '@vue/server-renderer'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Marquee from './Marquee.vue'

function createMediaQueryList(matches: boolean): MediaQueryList {
    return {
        matches,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
    }
}

describe('Marquee SSR hydration', () => {
    let host: HTMLDivElement | null = null

    afterEach(() => {
        host?.remove()
        host = null
        vi.restoreAllMocks()
    })

    it('keeps both tracks stable when reduced motion is enabled in the browser', async () => {
        const matchMedia = vi.spyOn(window, 'matchMedia')
            .mockReturnValue(createMediaQueryList(false))
        const Root = defineComponent({
            setup() {
                return () => h(Marquee, null, { default: () => h('span', 'Hydrated content') })
            },
        })
        const serverHtml = await renderToString(createSSRApp(Root))
        expect(serverHtml.match(/animate-marquee/g)).toHaveLength(2)

        host = document.createElement('div')
        host.innerHTML = serverHtml
        document.body.appendChild(host)
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        matchMedia.mockReturnValue(createMediaQueryList(true))

        const app = createSSRApp(Root)
        app.mount(host)
        await nextTick()

        expect(consoleError).not.toHaveBeenCalled()
        expect(consoleWarn).not.toHaveBeenCalled()
        const tracks = host.querySelectorAll<HTMLElement>('[class*="animate-marquee"]')
        expect(tracks).toHaveLength(2)
        expect(tracks[0].classList.contains('motion-reduce:animate-none')).toBe(true)
        expect(tracks[1].classList.contains('motion-reduce:hidden')).toBe(true)
        expect(host.querySelectorAll('[aria-hidden="true"][inert]')).toHaveLength(1)
        app.unmount()
    })
})
