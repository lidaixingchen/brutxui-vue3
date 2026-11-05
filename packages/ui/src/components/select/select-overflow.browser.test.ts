import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick } from 'vue'
import { computeAccessibleName } from 'dom-accessibility-api'
import '../../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import { SelectValue } from 'reka-ui'
import Select from './Select.vue'
import SelectContent from './SelectContent.vue'
import SelectItem from './SelectItem.vue'
import SelectTrigger from './SelectTrigger.vue'

const NARROW_VIEWPORT = { width: 320, height: 844 }
const STANDARD_VIEWPORT = { width: 1280, height: 844 }
const HOST_MARGIN = 12
const SELECTOR_HOST_WIDTH = NARROW_VIEWPORT.width - HOST_MARGIN * 2
const LONG_CHINESE_LABEL = '标签文字较长需要适当截断'.repeat(3)
const LONG_ENGLISH_LABEL = 'LongUnbrokenOptionLabel'.repeat(2)
const DISABLED_LABEL = '禁用选项'.repeat(6)

const options = [
    { value: 'selected', label: LONG_CHINESE_LABEL },
    { value: 'english', label: LONG_ENGLISH_LABEL },
    { value: 'chinese', label: '这是一条较长的中文选择项'.repeat(3) },
    { value: 'disabled', label: DISABLED_LABEL, disabled: true },
]

const updates = vi.fn()

const SelectFixture = defineComponent({
    setup() {
        return () => h(Select, { modelValue: 'selected', 'onUpdate:modelValue': updates }, {
            default: () => [
                h(SelectTrigger, {}, () => h(SelectValue)),
                h(SelectContent, {}, () => options.map(option => h(SelectItem, {
                    value: option.value,
                    disabled: option.disabled,
                }, () => option.label))),
            ],
        })
    },
})

let host: HTMLDivElement | null = null
let mounted: ReturnType<typeof mount> | null = null
let originalViewport: { width: number; height: number } | null = null

function createHost(width: number) {
    host = document.createElement('div')
    Object.assign(host.style, {
        position: 'fixed',
        left: `${HOST_MARGIN}px`,
        top: `${HOST_MARGIN}px`,
        width: `${Math.min(SELECTOR_HOST_WIDTH, width - HOST_MARGIN * 2)}px`,
        boxSizing: 'border-box',
    })
    document.body.append(host)
    return host
}

async function mountSelect(width: number) {
    originalViewport = { width: window.innerWidth, height: window.innerHeight }
    await page.viewport(width, NARROW_VIEWPORT.height)
    const root = createHost(width)
    mounted = mount(SelectFixture, { attachTo: root })
    await nextTick()
    const trigger = root.querySelector<HTMLElement>('[role="combobox"]')
    if (!trigger) throw new Error('Select trigger not found')
    return { root, trigger }
}

async function openSelect(trigger: HTMLElement) {
    await userEvent.click(trigger)
    await expect.poll(() => document.querySelector('[role="listbox"]')).not.toBeNull()
    await nextTick()
    await Promise.all(document.getAnimations()
        .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map(animation => animation.finished))
    const listbox = document.querySelector<HTMLElement>('[role="listbox"]')
    if (!listbox) throw new Error('Select listbox not found')
    return listbox
}

function findOption(listbox: HTMLElement, label: string) {
    const option = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'))
        .find(element => element.textContent?.trim() === label)
    if (!option) throw new Error(`Select option not found: ${label}`)
    return option
}

beforeEach(() => {
    updates.mockClear()
})

afterEach(async () => {
    mounted?.unmount()
    mounted = null
    host?.remove()
    host = null
    if (originalViewport) {
        await page.viewport(originalViewport.width, originalViewport.height)
        originalViewport = null
    }
})

describe('Select responsive option content', () => {
    it('clamps the long Chinese and English options to a narrow viewport while preserving their text', async () => {
        const { trigger } = await mountSelect(NARROW_VIEWPORT.width)
        const listbox = await openSelect(trigger)
        const bounds = listbox.getBoundingClientRect()

        expect(bounds.left).toBeGreaterThanOrEqual(0)
        expect(bounds.right).toBeLessThanOrEqual(window.innerWidth + 1)
        expect(bounds.width).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().width)

        const englishOption = findOption(listbox, LONG_ENGLISH_LABEL)
        const chineseOption = findOption(listbox, LONG_CHINESE_LABEL)
        expect(englishOption.textContent?.trim()).toBe(LONG_ENGLISH_LABEL)
        expect(chineseOption.textContent?.trim()).toBe(LONG_CHINESE_LABEL)
        expect(computeAccessibleName(englishOption)).toBe(LONG_ENGLISH_LABEL)

        const englishText = Array.from(englishOption.querySelectorAll<HTMLElement>('span'))
            .find(element => element.textContent?.trim() === LONG_ENGLISH_LABEL)
        expect(englishText).toBeDefined()
        expect(getComputedStyle(englishText!).textOverflow).toBe('ellipsis')
        expect(englishText!.scrollWidth).toBeGreaterThan(englishText!.clientWidth)
        expect(englishText!.getBoundingClientRect().right).toBeLessThanOrEqual(bounds.right)

        const disabledOption = findOption(listbox, DISABLED_LABEL)
        expect(disabledOption.getAttribute('aria-disabled')).toBe('true')
        expect(disabledOption.hasAttribute('data-disabled')).toBe(true)
        expect(updates).not.toHaveBeenCalled()
        await userEvent.click(englishOption)
        expect(updates).toHaveBeenLastCalledWith('english')
    })

    it('keeps ordinary-width popper placement and disabled selection behavior', async () => {
        const { trigger } = await mountSelect(STANDARD_VIEWPORT.width)
        const listbox = await openSelect(trigger)
        const bounds = listbox.getBoundingClientRect()
        expect(bounds.left).toBeGreaterThanOrEqual(0)
        expect(bounds.right).toBeLessThanOrEqual(window.innerWidth + 1)
        expect(bounds.width).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().width)

        const disabledOption = findOption(listbox, DISABLED_LABEL)
        expect(disabledOption.getAttribute('aria-disabled')).toBe('true')
        expect(disabledOption.hasAttribute('data-disabled')).toBe(true)
        expect(updates).not.toHaveBeenCalled()
        await userEvent.click(findOption(listbox, LONG_ENGLISH_LABEL))
        expect(updates).toHaveBeenLastCalledWith('english')
    })
})
