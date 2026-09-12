import { describe, it, expect } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { useToast, provideToast, createToast } from '../composables/useToast'
import { useTheme, provideTheme, createTheme } from '../composables/useTheme'
import { useMessage } from '../composables/useMessage'
import { mountOverlay } from '../lib/render-imperative'
import { BrutxUIPlugin, getGlobalAppContext } from '../plugin'

describe('SSR Request Isolation & Context Guards', () => {
    it('sequential SSR requests must not leak toast state across applications', async () => {
        const AppA = defineComponent({
            setup() {
                const toast = useToast()
                toast.addToast({ title: 'Request-A-Token' })
                return () => h('div', { class: 'app-a' }, toast.toasts.value.map(t => t.title).join(','))
            },
        })

        const AppB = defineComponent({
            setup() {
                const toast = useToast()
                return () => h('div', { class: 'app-b' }, toast.toasts.value.map(t => t.title).join(',') || 'empty')
            },
        })

        const appA = createSSRApp(AppA)
        const htmlA = await renderToString(appA)
        expect(htmlA).toContain('Request-A-Token')

        const appB = createSSRApp(AppB)
        const htmlB = await renderToString(appB)
        expect(htmlB).not.toContain('Request-A-Token')
        expect(htmlB).toContain('empty')
    })

    it('concurrent interleaved SSR requests must isolate state without cross-talk', async () => {
        let releaseBarrierA: () => void
        const barrierA = new Promise<void>((resolve) => {
            releaseBarrierA = resolve
        })

        const AppA = defineComponent({
            async setup() {
                const toast = useToast()
                toast.addToast({ title: 'Concurrent-A' })
                await barrierA
                return () => h('div', { id: 'a' }, toast.toasts.value.map(t => t.title).join(','))
            },
        })

        const AppB = defineComponent({
            setup() {
                const toast = useToast()
                toast.addToast({ title: 'Concurrent-B' })
                return () => h('div', { id: 'b' }, toast.toasts.value.map(t => t.title).join(','))
            },
        })

        const appA = createSSRApp(AppA)
        const appB = createSSRApp(AppB)

        const promiseA = renderToString(appA)
        const htmlB = await renderToString(appB)
        expect(htmlB).toContain('Concurrent-B')
        expect(htmlB).not.toContain('Concurrent-A')

        releaseBarrierA!()
        const htmlA = await promiseA
        expect(htmlA).toContain('Concurrent-A')
        expect(htmlA).not.toContain('Concurrent-B')
    })

    it('sibling components in the same request must share the default owner instance', async () => {
        const Writer = defineComponent({
            setup() {
                const toast = useToast()
                toast.addToast({ title: 'Shared-Sibling' })
                return () => h('span', 'writer')
            },
        })

        const Reader = defineComponent({
            setup() {
                const toast = useToast()
                return () => h('span', { class: 'reader' }, toast.toasts.value.map(t => t.title).join(','))
            },
        })

        const App = defineComponent({
            setup() {
                return () => h('div', [h(Writer), h(Reader)])
            },
        })

        const app = createSSRApp(App)
        const html = await renderToString(app)
        expect(html).toContain('Shared-Sibling')
    })

    it('calling useToast outside of Vue setup or inject context in SSR must throw diagnostic error', () => {
        expect(() => {
            useToast()
        }).toThrow(/\[BrutxUI\] \[ERR_SSR_MISSING_CONTEXT\]/)
    })

    it('calling useTheme outside of Vue setup or inject context in SSR must throw diagnostic error', () => {
        expect(() => {
            useTheme()
        }).toThrow(/\[BrutxUI\] \[ERR_SSR_MISSING_CONTEXT\]/)
    })

    it('explicit factory functions createToast and createTheme can be called without context on server', () => {
        const toast = createToast()
        expect(toast.toasts.value).toEqual([])
        toast.addToast({ title: 'explicit' })
        expect(toast.toasts.value).toHaveLength(1)

        const theme = createTheme()
        expect(theme.theme.value).toBe('classic')
        theme.setTheme('mono')
        expect(theme.theme.value).toBe('mono')
    })

    it('sequential SSR requests must isolate theme state between independent apps', async () => {
        const AppA = defineComponent({
            setup() {
                const { theme, setTheme } = useTheme()
                setTheme('mono')
                return () => h('div', { class: 'theme' }, theme.value)
            },
        })

        const AppB = defineComponent({
            setup() {
                const { theme } = useTheme()
                return () => h('div', { class: 'theme' }, theme.value)
            },
        })

        const appA = createSSRApp(AppA)
        const htmlA = await renderToString(appA)
        expect(htmlA).toContain('mono')

        const appB = createSSRApp(AppB)
        const htmlB = await renderToString(appB)
        expect(htmlB).toContain('classic')
        expect(htmlB).not.toContain('mono')
    })

    it('local provider takes precedence over application default instance in SSR', async () => {
        const ChildWithOverride = defineComponent({
            setup() {
                const localToast = provideToast()
                localToast.addToast({ title: 'Local-Override' })
                return () => h('div', { class: 'local' }, localToast.toasts.value.map(t => t.title).join(','))
            },
        })

        const RootReader = defineComponent({
            setup() {
                const toast = useToast()
                return () => h('div', { class: 'root' }, toast.toasts.value.map(t => t.title).join(',') || 'empty-root')
            },
        })

        const App = defineComponent({
            setup() {
                return () => h('div', [h(ChildWithOverride), h(RootReader)])
            },
        })

        const app = createSSRApp(App)
        const html = await renderToString(app)
        expect(html).toContain('Local-Override')
        expect(html).toContain('empty-root')
    })

    it('BrutxUIPlugin provides scoped per-app instances and avoids global server leak', async () => {
        const App = defineComponent({
            setup() {
                const toast = useToast()
                toast.addToast({ title: 'Plugin-Toast' })
                const { theme } = useTheme()
                return () => h('div', `${toast.toasts.value[0]?.title}-${theme.value}`)
            },
        })

        const app1 = createSSRApp(App)
        app1.use(BrutxUIPlugin, { theme: { defaultTheme: 'pastel' } })
        const html1 = await renderToString(app1)
        expect(html1).toContain('Plugin-Toast-pastel')

        // Server guard: globalAppContext must remain null in SSR
        expect(getGlobalAppContext()).toBeNull()

        // runWithContext can retrieve the plugin provided instance synchronously
        const retrievedToast = app1.runWithContext(() => useToast())
        expect(retrievedToast.toasts.value[0]?.title).toBe('Plugin-Toast')
    })

    it('ThemeSnapshot and manual mode provide deterministic initial state in SSR', async () => {
        const theme = createTheme({
            initialState: {
                theme: 'pastel',
                colorMode: 'dark',
                resolvedColorMode: 'dark',
            },
            initialization: 'manual',
        })

        const snapshot = theme.getSnapshot()
        expect(snapshot).toEqual({
            theme: 'pastel',
            colorMode: 'dark',
            resolvedColorMode: 'dark',
        })

        const Child = defineComponent({
            setup() {
                const { theme: currentTheme, resolvedColorMode } = useTheme()
                return () => h('div', `${currentTheme.value}:${resolvedColorMode.value}`)
            },
        })

        const App = defineComponent({
            setup() {
                provideTheme({
                    initialState: snapshot,
                    initialization: 'manual',
                })
                return () => h(Child)
            },
        })

        const app = createSSRApp(App)
        const html = await renderToString(app)
        expect(html).toContain('pastel:dark')
    })

    it('useMessage and mountOverlay are inert in SSR without side effects', async () => {
        const App = defineComponent({
            setup() {
                const msg = useMessage()
                const close = msg.info('hello')
                close()

                const overlay = mountOverlay(defineComponent({ render: () => h('div', 'overlay') }))
                overlay.close()

                return () => h('div', 'rendered')
            },
        })

        const app = createSSRApp(App)
        const html = await renderToString(app)
        expect(html).toContain('rendered')
    })
})
