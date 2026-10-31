import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import type { CascaderOption } from './cascader-types'
import Cascader from './Cascader.vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'

const initialOptions: CascaderOption[] = [
    { value: '1', label: 'A' },
    { value: 1, label: 'B' },
]

let mounted: ReturnType<typeof mount> | undefined

afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    document.body.textContent = ''
})

function findRow(label: string): HTMLElement {
    const row = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'))
        .find(option => option.querySelector('span')?.textContent?.trim() === label)
    if (!row) throw new Error(`找不到选项行：${label}`)
    return row
}

async function openWithKeyboard() {
    await userEvent.tab()
    const trigger = document.querySelector<HTMLElement>('[role="combobox"]')!
    expect(document.activeElement).toBe(trigger)
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => document.querySelectorAll('[role="checkbox"]')).toHaveLength(2)
    return trigger
}

async function focusCheckboxWithKeyboard(row: HTMLElement) {
    const checkbox = row.querySelector<HTMLElement>('[role="checkbox"]')!
    if (document.activeElement !== checkbox) await userEvent.tab()
    await expect.poll(() => document.activeElement).toBe(checkbox)
    expect(checkbox.matches(':focus-visible')).toBe(true)
    return checkbox
}

function createFixture(options: Ref<CascaderOption[]>) {
    return defineComponent({
        setup: () => () => h(Cascader, {
            options: options.value,
            multiple: true,
            modelValue: [],
        }),
    })
}

describe('Cascader 可见焦点身份', () => {
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
        mounted = mount(createFixture(options))

        await openWithKeyboard()
        await userEvent.hover(findRow('Parent'))
        await focusCheckboxWithKeyboard(findRow('Parent'))
        await userEvent.tab()
        const otherCheckbox = findRow('Other').querySelector<HTMLElement>('[role="checkbox"]')!
        await expect.poll(() => document.activeElement).toBe(otherCheckbox)
        await userEvent.tab()

        const childCheckbox = findRow('Child').querySelector<HTMLElement>('[role="checkbox"]')!
        await expect.poll(() => document.activeElement).toBe(childCheckbox)
        expect(childCheckbox.matches(':focus-visible')).toBe(true)
        expect(findRow('Parent').hasAttribute('data-focus-visible')).toBe(false)
        expect(findRow('Child').hasAttribute('data-focus-visible')).toBe(true)
    })
})
