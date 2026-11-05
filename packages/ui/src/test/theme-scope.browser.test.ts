import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@/test/browser-mount'
import { BASE_THEME, THEME_PRESETS } from '../../../shared/src/design-tokens'
import '../../dist/styles.css'

const CUSTOM_BACKGROUND = '#123456'
const CUSTOM_PRIMARY = '#654321'

let wrapper: ReturnType<typeof mount> | undefined
let rootWasDark = false

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
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
