import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createTheme, provideTheme, useTheme, destroyFallback, type ThemeSnapshot, type UseThemeReturn } from './useTheme'

describe('Theme SSR to Browser Hydration', () => {
    let host: HTMLDivElement | null = null

    beforeEach(() => {
        destroyFallback()
        localStorage.clear()
        const root = document.documentElement
        Array.from(root.classList).forEach((cls) => {
            if (cls.startsWith('theme-') || cls === 'dark') {
                root.classList.remove(cls)
            }
        })
    })

    afterEach(() => {
        if (host && host.parentNode) {
            host.parentNode.removeChild(host)
            host = null
        }
        destroyFallback()
        localStorage.clear()
        const root = document.documentElement
        Array.from(root.classList).forEach((cls) => {
            if (cls.startsWith('theme-') || cls === 'dark') {
                root.classList.remove(cls)
            }
        })
    })

    it('hydrates smoothly from server snapshot matching rendered HTML', async () => {
        const serverOptions = {
            initialState: {
                theme: 'pastel' as const,
                colorMode: 'dark' as const,
                resolvedColorMode: 'dark' as const,
            },
            initialization: 'manual' as const,
        }
        const serverTheme = createTheme(serverOptions)
        const serverSnapshot = serverTheme.getSnapshot()

        const Consumer = defineComponent({
            setup() {
                const theme = useTheme()
                return () => h('div', { id: 'theme-box', class: `theme-${theme.theme.value} ${theme.resolvedColorMode.value}` }, `Current: ${theme.theme.value}`)
            },
        })

        const ServerRoot = defineComponent({
            setup() {
                provideTheme(serverOptions)
                return () => h(Consumer)
            },
        })

        const serverApp = createSSRApp(ServerRoot)
        const serverHtml = await renderToString(serverApp)

        expect(serverHtml).toContain('Current: pastel')
        expect(serverHtml).toContain('theme-pastel dark')

        host = document.createElement('div')
        host.innerHTML = serverHtml
        document.body.appendChild(host)

        let clientTheme: UseThemeReturn | null = null
        const ClientConsumer = defineComponent({
            setup() {
                clientTheme = useTheme()
                return () => h('div', { id: 'theme-box', class: `theme-${clientTheme!.theme.value} ${clientTheme!.resolvedColorMode.value}` }, `Current: ${clientTheme!.theme.value}`)
            },
        })

        const ClientRoot = defineComponent({
            setup() {
                provideTheme({
                    initialState: serverSnapshot,
                    initialization: 'manual',
                })
                return () => h(ClientConsumer)
            },
        })

        const clientApp = createSSRApp(ClientRoot)
        clientApp.mount(host)
        await nextTick()

        expect(clientTheme).toBeDefined()
        expect(clientTheme!.theme.value).toBe('pastel')
        expect(clientTheme!.resolvedColorMode.value).toBe('dark')

        const box = host.querySelector('#theme-box')
        expect(box?.textContent).toBe('Current: pastel')
        expect(box?.classList.contains('theme-pastel')).toBe(true)
        expect(box?.classList.contains('dark')).toBe(true)

        clientApp.unmount()
    })

    it('preserves initial frame and snapshot even if localStorage contains conflicting preferences', async () => {
        localStorage.setItem('brutx-theme', 'mono')
        localStorage.setItem('brutx-color-mode', 'light')

        const serverSnapshot: ThemeSnapshot = {
            theme: 'warm',
            colorMode: 'dark',
            resolvedColorMode: 'dark',
        }

        const Consumer = defineComponent({
            setup() {
                const theme = useTheme()
                return () => h('div', { id: 'conflict-box' }, theme.theme.value)
            },
        })

        const ServerRoot = defineComponent({
            setup() {
                provideTheme({
                    initialState: serverSnapshot,
                    initialization: 'manual',
                })
                return () => h(Consumer)
            },
        })
        const serverHtml = await renderToString(createSSRApp(ServerRoot))

        host = document.createElement('div')
        host.innerHTML = serverHtml
        document.body.appendChild(host)

        let clientTheme: UseThemeReturn | null = null
        const ClientConsumer = defineComponent({
            setup() {
                clientTheme = useTheme()
                return () => h('div', { id: 'conflict-box' }, clientTheme!.theme.value)
            },
        })

        const ClientRoot = defineComponent({
            setup() {
                provideTheme({
                    initialState: serverSnapshot,
                    initialization: 'manual',
                })
                return () => h(ClientConsumer)
            },
        })

        const clientApp = createSSRApp(ClientRoot)
        clientApp.mount(host)
        await nextTick()

        expect(clientTheme!.theme.value).toBe('warm')
        expect(clientTheme!.colorMode.value).toBe('dark')
        expect(host.querySelector('#conflict-box')?.textContent).toBe('warm')

        clientTheme!.initTheme()
        expect(document.documentElement.classList.contains('theme-warm')).toBe(true)

        clientApp.unmount()
    })

    it('does not trigger initTheme prematurely when initialization is manual', async () => {
        let clientTheme: UseThemeReturn | null = null
        const snapshot: ThemeSnapshot = {
            theme: 'pastel',
            colorMode: 'light',
            resolvedColorMode: 'light',
        }

        const Consumer = defineComponent({
            setup() {
                clientTheme = useTheme()
                return () => h('div', 'test')
            },
        })

        const ClientRoot = defineComponent({
            setup() {
                provideTheme({
                    initialState: snapshot,
                    initialization: 'manual',
                })
                return () => h(Consumer)
            },
        })

        host = document.createElement('div')
        host.innerHTML = '<div>test</div>'
        document.body.appendChild(host)

        const clientApp = createSSRApp(ClientRoot)
        clientApp.mount(host)
        await nextTick()

        expect(document.documentElement.classList.contains('theme-pastel')).toBe(false)

        clientTheme!.initTheme()
        expect(document.documentElement.classList.contains('theme-pastel')).toBe(true)

        clientApp.unmount()
    })
})
