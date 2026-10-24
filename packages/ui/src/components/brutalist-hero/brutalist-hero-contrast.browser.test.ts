import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, provide } from 'vue'
import {
    THEME_PRESETS,
    blendAlpha,
    calculateContrastRatio,
    isContrastCompliant,
    parseColorChannels,
} from 'brutx-shared-vue'
import { mount } from '@/test/browser-mount'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { en } from '@/locales/en'
import AuthCard from '@/components/auth-card/AuthCard.vue'
import BrutalistHero from './BrutalistHero.vue'
import PricingSection from '@/components/pricing-section/PricingSection.vue'
import '../../../dist/styles.css'

const MODES = ['light', 'dark'] as const
const THEME_CASES = MODES.flatMap(mode =>
    ['classic', ...Object.keys(THEME_PRESETS)].map(theme => ({ name: `${theme} ${mode}`, mode, theme })),
)

let wrapper: ReturnType<typeof mount> | null = null
let originalRootClassName = ''

function getEffectiveBackground(element: Element, root: Element, underlay: string) {
    const layers: Element[] = []
    let current: Element | null = element

    while (current && current !== root) {
        layers.push(current)
        current = current.parentElement
    }

    let background = underlay
    for (const layer of layers.reverse()) {
        const color = getComputedStyle(layer).backgroundColor
        if (parseColorChannels(color)[3] > 0) {
            background = `rgb(${blendAlpha(color, background).join(', ')})`
        }
    }

    return background
}

function getVisibleForeground(element: Element, root: Element, background: string) {
    let opacity = 1
    let current: Element | null = element

    while (current) {
        opacity *= Number.parseFloat(getComputedStyle(current).opacity)
        if (current === root) break
        current = current.parentElement
    }

    const color = getComputedStyle(element).color
    if (opacity >= 1) return color

    const [r, g, b] = parseColorChannels(color)
    return `rgb(${blendAlpha({ r, g, b, a: opacity }, background).join(', ')})`
}

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.documentElement.className = originalRootClassName
})

describe.each(THEME_CASES)('Hero, Auth, and Pricing text contrast: $name', ({ mode, theme }) => {
    it('keeps terminal, account, and included-plan text readable on its rendered surface', async () => {
        originalRootClassName = document.documentElement.className
        document.documentElement.className = [mode === 'dark' ? 'dark' : '', `theme-${theme}`].join(' ')
        const themeStyles = getComputedStyle(document.documentElement)
        const tokens = {
            bg: themeStyles.getPropertyValue('--brutal-bg').trim(),
            primary: themeStyles.getPropertyValue('--brutal-primary').trim(),
        }
        const fixture = defineComponent({
            setup: () => {
                provide(LOCALE_INJECTION_KEY, en)
                return () => h('div', {
                    'data-contrast-root': '',
                    style: { backgroundColor: tokens.bg },
                }, [
                    h(BrutalistHero),
                    h(AuthCard),
                    h(PricingSection, { preset: 'saas' }),
                ])
            },
        })

        wrapper = mount(fixture)
        await nextTick()

        const root = wrapper.element.matches('[data-contrast-root]')
            ? wrapper.element
            : wrapper.element.querySelector('[data-contrast-root]')!
        const form = root.querySelector('form')!
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        await nextTick()

        const paragraphs = [...root.querySelectorAll('p')]
        const terminalSuccess = paragraphs.filter(element => element.textContent?.trim().startsWith('✓'))
        const cursor = paragraphs.find(element => element.textContent?.trim() === '█')
        const accountLinks = [...root.querySelectorAll('button')].filter(element =>
            ['Forgot password?', 'Register'].includes(element.textContent?.trim() ?? ''),
        )
        const errorInputs = [...root.querySelectorAll('input[aria-describedby]')]
        const errorMessages = errorInputs.flatMap(input => {
            const id = input.getAttribute('aria-describedby')
            const message = id ? root.querySelector(`#${CSS.escape(id)}`) : null
            return message ? [message] : []
        })
        const includedPlanMarkers = [...root.querySelectorAll('[aria-hidden="true"]')].filter(element =>
            element.textContent?.trim() === '✓',
        )

        expect(terminalSuccess.length).toBeGreaterThan(0)
        expect(cursor).toBeTruthy()
        expect(accountLinks).toHaveLength(2)
        for (const link of accountLinks) {
            const styles = getComputedStyle(link)
            expect(styles.textDecorationLine).toContain('underline')
            expect(parseColorChannels(styles.textDecorationColor)).toEqual(parseColorChannels(tokens.primary))
        }
        expect(errorInputs).toHaveLength(2)
        expect(errorInputs.every(input => input.getAttribute('aria-invalid') === 'true')).toBe(true)
        expect(errorMessages).toHaveLength(errorInputs.length)
        expect(includedPlanMarkers.length).toBeGreaterThan(0)

        const textSurfaces = [
            ...terminalSuccess,
            cursor!,
            ...accountLinks,
            ...errorMessages,
            ...includedPlanMarkers,
        ]

        for (const element of textSurfaces) {
            const background = getEffectiveBackground(element, root, tokens.bg)
            const foreground = getVisibleForeground(element, root, background)
            const ratio = calculateContrastRatio(foreground, background)

            expect(
                isContrastCompliant(ratio, 'AA'),
                `${element.textContent?.trim()} has ${ratio.toFixed(2)}:1 contrast (${foreground} on ${background})`,
            ).toBe(true)
        }
    })
})
