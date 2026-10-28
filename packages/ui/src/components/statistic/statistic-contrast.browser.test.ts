import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { BASE_THEME, THEME_PRESETS, calculateContrastRatio, isContrastCompliant } from 'brutx-shared-vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import Statistic from './Statistic.vue'

const SURFACES = ['bg', 'muted'] as const
const TRENDS = ['up', 'down'] as const
const MODES = ['light', 'dark'] as const
const THEME_CASES = MODES.flatMap(mode => [
    { name: 'base ' + mode, tokens: BASE_THEME[mode] },
    ...Object.entries(THEME_PRESETS).map(([name, preset]) => ({
        name: name + ' ' + mode,
        tokens: { ...BASE_THEME[mode], ...preset[mode] },
    })),
])

let mounted: ReturnType<typeof mount> | null = null

function resolveColor(color: string) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d')!
    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data
    return 'rgb(' + r + ', ' + g + ', ' + b + ')'
}

afterEach(() => {
    mounted?.unmount()
    mounted = null
})

describe.each(THEME_CASES)('Statistic trend contrast: $name', ({ tokens }) => {
    it('keeps both trend colors readable on page and muted surfaces', () => {
        const variables = Object.fromEntries(
            Object.entries(tokens).map(([name, value]) => ['--brutal-' + name, value]),
        )
        mounted = mount(defineComponent({
            setup: () => () => h('div', { style: variables }, SURFACES.flatMap(surface =>
                TRENDS.map(trend => h('div', {
                    class: 'statistic-test-surface',
                    style: { backgroundColor: tokens[surface] },
                }, [
                    h(Statistic, { value: 100, trend }),
                ])),
            )),
        }))

        for (const trend of mounted.element.querySelectorAll<HTMLElement>('.statistic-trend')) {
            const foreground = resolveColor(getComputedStyle(trend).color)
            const background = getComputedStyle(trend.closest('.statistic-test-surface')!).backgroundColor
            const ratio = calculateContrastRatio(foreground, background)
            expect(isContrastCompliant(ratio, 'AA'), foreground + ' on ' + background + ': ' + ratio + ':1').toBe(true)
        }
    })
})
