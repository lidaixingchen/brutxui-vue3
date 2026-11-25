import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { computeAccessibleName } from 'dom-accessibility-api'
import type { CascaderOption, CascaderValue } from './cascader-types'
import Cascader from './Cascader.vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'

const initialOptions: CascaderOption[] = [
    { value: '1', label: 'A' },
    { value: 1, label: 'B' },
]

let mounted: ReturnType<typeof mount> | undefined
let originalViewport: { width: number; height: number } | undefined

afterEach(async () => {
    mounted?.unmount()
    mounted = undefined
    document.body.textContent = ''
    if (originalViewport) {
        await page.viewport(originalViewport.width, originalViewport.height)
        originalViewport = undefined
    }
})

function findRow(label: string): HTMLElement {
    const row = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'))
        .find(option => option.querySelector('[data-slot="cascader-option-label"]')?.textContent?.trim() === label)
    if (!row) throw new Error(`找不到选项行：${label}`)
    return row
}

async function openWithKeyboard(checkboxCount = initialOptions.length) {
    const previousButton = document.createElement('button')
    document.body.prepend(previousButton)
    previousButton.focus()
    await userEvent.tab()
    previousButton.remove()
    const trigger = document.querySelector<HTMLElement>('[role="combobox"]')!
    expect(document.activeElement).toBe(trigger)
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => document.querySelectorAll('[role="checkbox"]')).toHaveLength(checkboxCount)
    return trigger
}

async function focusCheckboxWithKeyboard(row: HTMLElement) {
    const checkbox = row.querySelector<HTMLElement>('[role="checkbox"]')!
    if (document.activeElement !== checkbox) await userEvent.tab()
    await expect.poll(() => document.activeElement).toBe(checkbox)
    expect(checkbox.matches(':focus-visible')).toBe(true)
    return checkbox
}

function createFixture(options: Ref<CascaderOption[]>, model = ref<CascaderValue[][]>([])) {
    return defineComponent({
        setup: () => () => h(Cascader, {
            options: options.value,
            multiple: true,
            modelValue: model.value,
            'onUpdate:modelValue': (value) => { model.value = value as CascaderValue[][] },
        }),
    })
}

describe('Cascader 可见焦点身份', () => {
    it('用选项文字命名复选框并在 Tab 导航中跳过禁用项', async () => {
        const options = ref<CascaderOption[]>([
            { value: 'first', label: '可选项甲' },
            { value: 'blocked', label: '禁用项', disabled: true },
            { value: 'last', label: '可选项乙' },
        ])
        const model = ref<CascaderValue[][]>([])
        mounted = mount(createFixture(options, model))
        await openWithKeyboard(options.value.length)

        const firstRow = findRow('可选项甲')
        const first = await focusCheckboxWithKeyboard(firstRow)
        const disabled = findRow('禁用项').querySelector<HTMLButtonElement>('[role="checkbox"]')!
        const last = findRow('可选项乙').querySelector<HTMLButtonElement>('[role="checkbox"]')!
        expect(computeAccessibleName(first)).toBe('可选项甲')
        expect(computeAccessibleName(disabled)).toBe('禁用项')
        expect(computeAccessibleName(last)).toBe('可选项乙')
        expect(disabled.disabled).toBe(true)

        await userEvent.tab()
        expect(document.activeElement).toBe(last)
        disabled.focus()
        expect(document.activeElement).toBe(last)
        disabled.click()
        expect(model.value).toEqual([])
        expect(disabled.getAttribute('aria-checked')).toBe('false')

        await userEvent.keyboard(' ')
        expect(model.value).toEqual([['last']])
        expect(last.getAttribute('aria-checked')).toBe('true')
    })

    it('选项重排后仍将可见焦点显示在实际键盘聚焦的多选项上', async () => {
        const options = ref<CascaderOption[]>([...initialOptions])
        mounted = mount(createFixture(options))

        await openWithKeyboard()
        const checkboxA = await focusCheckboxWithKeyboard(findRow('A'))

        options.value = [options.value[1]!, options.value[0]!]
        await nextTick()

        expect(document.activeElement).toBe(checkboxA)
        expect(findRow('A').hasAttribute('data-focus-visible')).toBe(true)
        expect(findRow('B').hasAttribute('data-focus-visible')).toBe(false)

        checkboxA.blur()
        await nextTick()
        expect(document.querySelectorAll('[data-focus-visible]')).toHaveLength(0)
    })

    it('移除聚焦选项并重新打开后不会保留已失效的可见焦点', async () => {
        const options = ref<CascaderOption[]>([...initialOptions])
        mounted = mount(createFixture(options))

        const trigger = await openWithKeyboard()
        await focusCheckboxWithKeyboard(findRow('A'))

        options.value = [options.value[1]!]
        await nextTick()
        expect(document.querySelectorAll('[data-focus-visible]')).toHaveLength(0)

        await userEvent.click(trigger)
        await nextTick()
        await userEvent.click(trigger)
        await expect.poll(() => document.querySelectorAll('[role="option"]')).toHaveLength(1)
        expect(document.querySelector('[role="option"]')?.hasAttribute('data-focus-visible')).toBe(false)
    })

    it('相同值出现在不同列时只标记完整路径对应的行', async () => {
        const options = ref<CascaderOption[]>([
            { value: 'same', label: 'Parent', children: [{ value: 'same', label: 'Child' }] },
            { value: 1, label: 'Other' },
        ])
        const model = ref<CascaderValue[][]>([])
        mounted = mount(createFixture(options, model))

        await openWithKeyboard()
        await userEvent.hover(findRow('Parent'))
        const parentCheckbox = await focusCheckboxWithKeyboard(findRow('Parent'))
        await userEvent.tab()
        const otherCheckbox = findRow('Other').querySelector<HTMLElement>('[role="checkbox"]')!
        await expect.poll(() => document.activeElement).toBe(otherCheckbox)
        await userEvent.tab()

        const childCheckbox = findRow('Child').querySelector<HTMLButtonElement>('[role="checkbox"]')!
        await expect.poll(() => document.activeElement).toBe(childCheckbox)
        expect(computeAccessibleName(parentCheckbox)).toBe('Parent')
        expect(computeAccessibleName(childCheckbox)).toBe('Child')
        expect(childCheckbox.matches(':focus-visible')).toBe(true)
        expect(findRow('Parent').hasAttribute('data-focus-visible')).toBe(false)
        expect(findRow('Child').hasAttribute('data-focus-visible')).toBe(true)

        options.value[0]!.disabled = true
        await nextTick()
        expect(childCheckbox.disabled).toBe(false)
        expect(document.activeElement).toBe(childCheckbox)
        await userEvent.keyboard(' ')
        expect(model.value).toEqual([['same', 'same']])
    })

    it('在窄视口中随方向键滚动，使当前层级始终可见', async () => {
        originalViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(320, 850)
        const options: CascaderOption[] = [{
            value: 'country', label: '中国', children: [{
                value: 'province', label: '浙江省', children: [{
                    value: 'city', label: '杭州市', children: [{ value: 'district', label: '西湖区' }],
                }],
            }],
        }]
        mounted = mount(defineComponent({ setup: () => () => h(Cascader, { options }) }))

        const trigger = document.querySelector<HTMLElement>('[role="combobox"]')!
        trigger.focus()
        expect(document.activeElement).toBe(trigger)
        await userEvent.keyboard('{ArrowDown}')
        await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true')
        await userEvent.keyboard('{ArrowDown}')
        await userEvent.hover(findRow('中国'))
        for (const label of ['浙江省', '杭州市', '西湖区']) {
            await userEvent.keyboard('{ArrowRight}')
            await expect.poll(() => findRow(label).id === trigger.getAttribute('aria-activedescendant')).toBe(true)
        }

        const measureActiveRow = (label: string) => {
            const row = findRow(label)
            const rail = row.closest('[role="listbox"]')!.parentElement!.getBoundingClientRect()
            const bounds = row.getBoundingClientRect()
            return {
                active: row.id === trigger.getAttribute('aria-activedescendant'),
                clippedPixels: Math.max(0, Math.round(rail.left - bounds.left), Math.round(bounds.right - Math.min(rail.right, window.innerWidth))),
            }
        }

        await expect.poll(() => measureActiveRow('西湖区')).toEqual({ active: true, clippedPixels: 0 })
        for (const label of ['杭州市', '浙江省', '中国']) {
            await userEvent.keyboard('{ArrowLeft}')
            await expect.poll(() => findRow(label).id === trigger.getAttribute('aria-activedescendant')).toBe(true)
        }
        await expect.poll(() => measureActiveRow('中国')).toEqual({ active: true, clippedPixels: 0 })
        expect(document.activeElement).toBe(trigger)
    })
})
