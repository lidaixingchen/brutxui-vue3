import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { calculateContrastRatio } from 'brutx-shared-vue'
import { mount } from '@/test/browser-mount'
import Result from './Result.vue'
import '../../../dist/styles.css'

const PRESETS = [
    { name: 'classic', className: '' },
    { name: 'pastel', className: 'theme-pastel' },
    { name: 'mono', className: 'theme-mono' },
    { name: 'warm', className: 'theme-warm' },
]
const MODES = ['light', 'dark']
const CUSTOM_PAIRS = [
    { background: '#141414', foreground: '#ffffff' },
    { background: '#f6eedc', foreground: '#5d253a' },
]
let wrapper: ReturnType<typeof mount> | undefined
let originalDark = false

beforeEach(() => {
    originalDark = document.documentElement.classList.contains('dark')
    document.documentElement.classList.remove('dark')
})

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.documentElement.classList.toggle('dark', originalDark)
})

function mountEmpty(className: string, style = {}) {
    wrapper = mount(defineComponent({
        setup: () => () => h('section', { class: className, style }, [
            h(Result, { status: 'empty', title: '暂无数据', subTitle: '创建第一条记录后显示内容。' }),
        ]),
    }))
    return wrapper.element as HTMLElement
}

function expectedPair(scope: HTMLElement) {
    const reference = document.createElement('span')
    reference.style.color = 'var(--brutal-accent-foreground)'
    reference.style.backgroundColor = 'var(--brutal-accent)'
    scope.append(reference)
    const computed = getComputedStyle(reference)
    const pair = { foreground: computed.color, background: computed.backgroundColor }
    reference.remove()
    return pair
}

function iconPair(scope: HTMLElement) {
    const icon = scope.querySelector('svg')!
    expect(icon.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(scope.querySelector('[role="status"]')).not.toBeNull()
    return {
        foreground: getComputedStyle(icon).color,
        background: getComputedStyle(icon.parentElement!).backgroundColor,
    }
}

describe.each(PRESETS)('Result 空状态预设 $name', (preset) => {
    it.each(MODES)('在 %s 模式使用强调色及其前景色', (mode) => {
        const scope = mountEmpty([preset.className, mode === 'dark' ? 'dark' : ''].filter(Boolean).join(' '))
        expect(iconPair(scope)).toEqual(expectedPair(scope))
        expect(scope.textContent).toContain('暂无数据')
    })
})

describe('Result 空状态自定义主题', () => {
    it.each(CUSTOM_PAIRS)('在 $background 背景上使用 $foreground 前景', ({ background, foreground }) => {
        const scope = mountEmpty('', { '--brutal-accent': background, '--brutal-accent-foreground': foreground })
        const actual = iconPair(scope)
        const expected = expectedPair(scope)

        expect(calculateContrastRatio(expected.foreground, expected.background)).toBeGreaterThanOrEqual(4.5)
        expect(actual).toEqual(expected)
        expect(calculateContrastRatio(actual.foreground, actual.background)).toBeGreaterThanOrEqual(4.5)
    })
})
