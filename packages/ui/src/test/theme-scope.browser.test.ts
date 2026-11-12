import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h, type CSSProperties } from 'vue'
import { mount } from '@/test/browser-mount'
import { BASE_THEME, THEME_PRESETS } from '../../../shared/src/design-tokens'
import Button from '../components/button/Button.vue'
import '../../dist/styles.css'
import cliStyles from '../../../cli/src/styles/brutalist.css?raw'

const CUSTOM_BACKGROUND = '#123456'
const CUSTOM_PRIMARY = '#654321'

let wrapper: ReturnType<typeof mount> | undefined
let rootWasDark = false
let cliHost: HTMLElement | undefined

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    cliHost?.remove()
    cliHost = undefined
    document.documentElement.classList.toggle('dark', rootWasDark)
})

function findSurface(root: HTMLElement, id: string): HTMLElement {
    const surface = root.querySelector<HTMLElement>(`[data-theme-surface="${id}"]`)
    if (!surface) throw new Error(`Missing theme surface: ${id}`)
    return surface
}

describe('scoped theme color utilities', () => {
    it('resolves root dark mode, local dark scopes, presets, and live token updates', () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.add('dark')
        wrapper = mount({
            render: () => h('main', [
                h('div', { class: 'bg-brutal-bg', 'data-theme-surface': 'root-dark' }),
                h('div', { style: { backgroundColor: 'var(--brutal-bg)' }, 'data-theme-surface': 'root-dark-token' }),
            ]),
        })

        const root = wrapper.element as HTMLElement
        const rootDark = findSurface(root, 'root-dark')
        expect(getComputedStyle(document.documentElement).getPropertyValue('--brutal-bg').trim()).toBe(BASE_THEME.dark.bg)
        expect(getComputedStyle(rootDark).backgroundColor).toBe(getComputedStyle(findSurface(root, 'root-dark-token')).backgroundColor)

        wrapper.unmount()
        wrapper = undefined
        document.documentElement.classList.remove('dark')

        wrapper = mount({
            render: () => h('main', [
                h('section', { class: 'dark', 'data-theme-scope': 'dark' }, [
                    h('div', { class: 'bg-brutal-bg', 'data-theme-surface': 'local-dark' }),
                    h('div', { style: { backgroundColor: 'var(--brutal-bg)' }, 'data-theme-surface': 'local-dark-token' }),
                ]),
                h('section', { class: 'theme-pastel', 'data-theme-scope': 'pastel' }, [
                    h('div', { class: 'bg-brutal-bg', 'data-theme-surface': 'pastel' }),
                    h('div', { style: { backgroundColor: 'var(--brutal-bg)' }, 'data-theme-surface': 'pastel-bg-token' }),
                    h('div', { class: 'bg-brutal-primary', 'data-theme-surface': 'pastel-primary' }),
                    h('div', { style: { backgroundColor: 'var(--brutal-primary)' }, 'data-theme-surface': 'pastel-primary-token' }),
                    h('div', { class: 'bg-brutal-primary-subtle', 'data-theme-surface': 'pastel-primary-subtle' }),
                    h('div', { style: { backgroundColor: 'var(--brutal-primary-subtle)' }, 'data-theme-surface': 'pastel-subtle-token' }),
                ]),
                h('section', { class: 'theme-pastel dark', 'data-theme-scope': 'pastel-dark' }, [
                    h('div', { class: 'bg-brutal-bg', 'data-theme-surface': 'pastel-dark-bg' }),
                    h('div', { style: { backgroundColor: 'var(--brutal-bg)' }, 'data-theme-surface': 'pastel-dark-bg-token' }),
                    h('div', { class: 'bg-brutal-primary', 'data-theme-surface': 'pastel-dark-primary' }),
                    h('div', { style: { backgroundColor: 'var(--brutal-primary)' }, 'data-theme-surface': 'pastel-dark-primary-token' }),
                ]),
            ]),
        })

        const scopedRoot = wrapper.element as HTMLElement
        const darkScope = scopedRoot.querySelector<HTMLElement>('[data-theme-scope="dark"]')!
        const localDark = findSurface(scopedRoot, 'local-dark')
        expect(getComputedStyle(darkScope).getPropertyValue('--brutal-bg').trim()).toBe(BASE_THEME.dark.bg)
        expect(getComputedStyle(localDark).backgroundColor).toBe(getComputedStyle(findSurface(scopedRoot, 'local-dark-token')).backgroundColor)

        const pastelScope = scopedRoot.querySelector<HTMLElement>('[data-theme-scope="pastel"]')!
        const pastel = findSurface(scopedRoot, 'pastel')
        const pastelBgToken = findSurface(scopedRoot, 'pastel-bg-token')
        const pastelPrimary = findSurface(scopedRoot, 'pastel-primary')
        const pastelPrimaryToken = findSurface(scopedRoot, 'pastel-primary-token')
        const pastelPrimarySubtle = findSurface(scopedRoot, 'pastel-primary-subtle')
        const pastelSubtleToken = findSurface(scopedRoot, 'pastel-subtle-token')
        const pastelLightTokens = THEME_PRESETS.pastel.light
        expect(getComputedStyle(pastelScope).getPropertyValue('--brutal-bg').trim()).toBe(pastelLightTokens.bg)
        expect(getComputedStyle(pastel).backgroundColor).toBe(getComputedStyle(pastelBgToken).backgroundColor)
        expect(getComputedStyle(pastelPrimary).backgroundColor).toBe(getComputedStyle(pastelPrimaryToken).backgroundColor)
        expect(getComputedStyle(pastelPrimarySubtle).backgroundColor).toBe(getComputedStyle(pastelSubtleToken).backgroundColor)
        const initialSubtle = getComputedStyle(pastelPrimarySubtle).backgroundColor

        const pastelDarkScope = scopedRoot.querySelector<HTMLElement>('[data-theme-scope="pastel-dark"]')!
        const pastelDarkTokens = THEME_PRESETS.pastel.dark
        const pastelDarkBackground = findSurface(scopedRoot, 'pastel-dark-bg')
        const pastelDarkBackgroundToken = findSurface(scopedRoot, 'pastel-dark-bg-token')
        const pastelDarkPrimary = findSurface(scopedRoot, 'pastel-dark-primary')
        const pastelDarkPrimaryToken = findSurface(scopedRoot, 'pastel-dark-primary-token')
        expect(getComputedStyle(pastelDarkScope).getPropertyValue('--brutal-bg').trim()).toBe(pastelDarkTokens.bg)
        expect(getComputedStyle(pastelDarkBackground).backgroundColor).toBe(getComputedStyle(pastelDarkBackgroundToken).backgroundColor)
        expect(getComputedStyle(pastelDarkPrimary).backgroundColor).toBe(getComputedStyle(pastelDarkPrimaryToken).backgroundColor)

        pastelScope.style.setProperty('--brutal-bg', CUSTOM_BACKGROUND)
        expect(getComputedStyle(pastel).backgroundColor).toBe(getComputedStyle(pastelBgToken).backgroundColor)
        expect(getComputedStyle(pastelScope).getPropertyValue('--brutal-bg').trim()).toBe(CUSTOM_BACKGROUND)
        pastelScope.style.setProperty('--brutal-primary', CUSTOM_PRIMARY)
        expect(getComputedStyle(pastelPrimary).backgroundColor).toBe(getComputedStyle(pastelPrimaryToken).backgroundColor)
        const updatedSubtle = getComputedStyle(pastelPrimarySubtle).backgroundColor
        expect(updatedSubtle).toBe(getComputedStyle(pastelSubtleToken).backgroundColor)
        expect(updatedSubtle).not.toBe(initialSubtle)
        expect(getComputedStyle(pastelDarkScope).getPropertyValue('--brutal-primary-subtle')).toContain('color-mix')
    })
})

describe('scoped theme geometry utilities', () => {
    it('resolves root and preset border, radius, and shadow tokens on Button', () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount({
            render: () => h('main', [
                h(Button, { 'data-theme-surface': 'root-light' }, () => 'Root'),
                h('section', { class: 'dark' }, [
                    h(Button, { 'data-theme-surface': 'root-dark' }, () => 'Dark'),
                ]),
                ...(['pastel', 'mono', 'warm'] as const).map(name =>
                    h('section', { class: `theme-${name}` }, [
                        h(Button, { 'data-theme-surface': name }, () => name),
                    ]),
                ),
            ]),
        })

        const root = wrapper.element as HTMLElement
        const readGeometry = (id: string) => {
            const button = findSurface(root, id)
            const style = getComputedStyle(button)
            return {
                borderWidth: style.borderTopWidth,
                radius: style.borderTopLeftRadius,
                shadow: style.boxShadow,
            }
        }

        expect(['root-light', 'root-dark', 'pastel', 'mono', 'warm'].map(readGeometry)).toEqual([
            { borderWidth: '3px', radius: '0px', shadow: expect.stringContaining('4px 4px 0px 0px') },
            { borderWidth: '3px', radius: '0px', shadow: expect.stringContaining('4px 4px 0px 0px') },
            { borderWidth: '2px', radius: '8px', shadow: expect.stringContaining('3px 3px 0px 0px') },
            { borderWidth: '4px', radius: '0px', shadow: expect.stringContaining('5px 5px 0px 0px') },
            { borderWidth: '3px', radius: '4px', shadow: expect.stringContaining('4px 4px 0px 0px') },
        ])
    })

    it('applies live scope updates and Button-level token overrides', () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount({
            render: () => h('main', [
                h('section', { 'data-theme-scope': 'live' }, [
                    h(Button, { 'data-theme-surface': 'live' }, () => 'Live'),
                    h(Button, {
                        'data-theme-surface': 'component',
                        style: {
                            '--brutal-border-width': '5px',
                            '--brutal-radius': '20px',
                            '--brutal-shadow-offset-x': '12px',
                            '--brutal-shadow-offset-y': '6px',
                        } as CSSProperties,
                    }, () => 'Component override'),
                ]),
            ]),
        })

        const root = wrapper.element as HTMLElement
        const scope = root.querySelector<HTMLElement>('[data-theme-scope="live"]')!
        const liveButton = findSurface(root, 'live')
        const componentButton = findSurface(root, 'component')
        const readGeometry = (button: HTMLElement) => {
            const style = getComputedStyle(button)
            return {
                borderWidth: style.borderTopWidth,
                radius: style.borderTopLeftRadius,
                shadow: style.boxShadow,
            }
        }

        scope.style.setProperty('--brutal-border-width', '6px')
        scope.style.setProperty('--brutal-radius', '12px')
        scope.style.setProperty('--brutal-shadow-offset-x', '10px')
        scope.style.setProperty('--brutal-shadow-offset-y', '7px')

        expect([readGeometry(liveButton), readGeometry(componentButton)]).toEqual([
            { borderWidth: '6px', radius: '12px', shadow: expect.stringContaining('10px 7px 0px 0px') },
            { borderWidth: '5px', radius: '20px', shadow: expect.stringContaining('12px 6px 0px 0px') },
        ])
    })

    it('keeps the focus ring and token-driven shadow in the same box-shadow stack', async () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount({
            render: () => h('main', [
                h(Button, {
                    'data-theme-surface': 'focusable',
                    style: {
                        '--brutal-shadow-offset-x': '9px',
                        '--brutal-shadow-offset-y': '5px',
                        transition: 'none',
                    } as CSSProperties,
                }, () => 'Focus me'),
            ]),
        })

        const button = findSurface(wrapper.element as HTMLElement, 'focusable')
        await userEvent.tab()
        button.focus()

        expect(document.activeElement).toBe(button)
        expect(button.matches(':focus-visible')).toBe(true)
        const focusedShadow = getComputedStyle(button).boxShadow
        expect(focusedShadow).toContain('9px 5px 0px 0px')
        expect(focusedShadow).toContain('0px 0px 0px 4px')
    })

    it('resolves CLI stylesheet geometry without UI stylesheet rules', async () => {
        cliHost = document.createElement('div')
        document.body.append(cliHost)
        const shadowRoot = cliHost.attachShadow({ mode: 'open' })
        const stylesheet = document.createElement('style')
        stylesheet.textContent = cliStyles
        const scope = document.createElement('section')
        scope.className = 'theme-pastel'
        const surface = document.createElement('div')
        surface.className = 'border-3 border-brutal rounded-brutal shadow-brutal'
        surface.style.borderStyle = 'solid'
        scope.append(surface)
        shadowRoot.append(stylesheet, scope)

        const preset = THEME_PRESETS.pastel.light
        expect(getComputedStyle(surface).borderTopWidth).toBe(preset.borderWidth)
        expect(getComputedStyle(surface).borderTopLeftRadius).toBe(preset.radius)

        const overrides = { borderWidth: '5px', radius: '20px', shadowX: '12px', shadowY: '6px' }
        surface.style.setProperty('--brutal-border-width', overrides.borderWidth)
        surface.style.setProperty('--brutal-radius', overrides.radius)
        surface.style.setProperty('--brutal-shadow-offset-x', overrides.shadowX)
        surface.style.setProperty('--brutal-shadow-offset-y', overrides.shadowY)
        expect(getComputedStyle(surface).borderTopWidth).toBe(overrides.borderWidth)
        expect(getComputedStyle(surface).borderTopLeftRadius).toBe(overrides.radius)
        expect(getComputedStyle(surface).boxShadow).toContain(`${overrides.shadowX} ${overrides.shadowY} 0px 0px`)

        surface.style.width = '100px'
        surface.style.height = '40px'
        surface.classList.add('hover:shadow-brutal-lg')
        await userEvent.hover(surface)
        expect(getComputedStyle(surface).boxShadow).toContain('18px 9px 0px 0px')
        surface.classList.remove('hover:shadow-brutal-lg')
        surface.classList.add('data-[state=active]:shadow-brutal-sm')
        surface.dataset.state = 'active'
        expect(getComputedStyle(surface).boxShadow).toContain('6px 3px 0px 0px')
    })
})
