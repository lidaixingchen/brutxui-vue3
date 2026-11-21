import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import {
    BASE_THEME,
    THEME_PRESETS,
    calculateContrastRatio,
    isContrastCompliant,
} from 'brutx-shared-vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import CodeBlock from './CodeBlock.vue'

const MODES = ['light', 'dark'] as const
const THEME_CASES = MODES.flatMap(mode => [
    { name: `default ${mode}`, tokens: BASE_THEME[mode] },
    ...Object.entries(THEME_PRESETS).map(([name, preset]) => ({
        name: `${name} ${mode}`,
        tokens: { ...BASE_THEME[mode], ...preset[mode] },
    })),
])

const CUSTOM_THEME_CASES = [
    {
        name: 'light custom muted surface',
        tokens: { bg: '#ffffff', muted: '#ffffff', fg: '#757575' },
    },
    {
        name: 'dark custom muted surface',
        tokens: { bg: '#141414', muted: '#141414', fg: '#888888' },
    },
]

type FilenameThemeTokens = typeof BASE_THEME.light | Pick<typeof BASE_THEME.light, 'bg' | 'muted' | 'fg'>

const FILENAME = 'src/services/audit.ts'
const PIXEL_SAMPLE_SIZE = 1
let wrapper: ReturnType<typeof mount> | null = null

function toCssVariables(tokens: FilenameThemeTokens) {
    return Object.fromEntries(
        Object.entries(tokens).map(([name, value]) => [`--brutal-${name}`, value]),
    )
}

function sampleForegroundOnBackground(foreground: string, background: string) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = PIXEL_SAMPLE_SIZE
    const context = canvas.getContext('2d')!
    context.fillStyle = background
    context.fillRect(0, 0, 1, 1)
    context.fillStyle = foreground
    context.fillRect(0, 0, 1, 1)
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data
    return `rgb(${r}, ${g}, ${b})`
}

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
})

describe.each([...THEME_CASES, ...CUSTOM_THEME_CASES])('CodeBlock filename contrast: $name', ({ tokens }) => {
    it('keeps the filename at WCAG AA contrast on its rendered header', () => {
        wrapper = mount(defineComponent({
            setup: () => () => h('div', { style: toCssVariables(tokens) }, [
                h(CodeBlock, {
                    code: 'const value = 1',
                    language: 'javascript',
                    filename: FILENAME,
                }),
            ]),
        }))

        const root = wrapper.element.querySelector('[class*="bg-brutal-muted"]')?.parentElement
        const header = root?.querySelector('[class*="bg-brutal-muted"]')
        const filename = [...(root?.querySelectorAll('span') ?? [])]
            .find(element => element.textContent === FILENAME)

        expect(header).toBeTruthy()
        expect(filename).toBeTruthy()

        const background = getComputedStyle(header!).backgroundColor
        const foreground = getComputedStyle(filename!).color
        const renderedForeground = sampleForegroundOnBackground(foreground, background)
        const ratio = calculateContrastRatio(renderedForeground, background)

        expect(
            isContrastCompliant(ratio, 'AA'),
            `${FILENAME} has ${ratio.toFixed(2)}:1 contrast (${foreground} on ${background})`,
        ).toBe(true)
    })
})
