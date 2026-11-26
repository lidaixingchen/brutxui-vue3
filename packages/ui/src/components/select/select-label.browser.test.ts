import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { SelectRoot, SelectValue } from 'reka-ui'
import { mount } from '@/test/browser-mount'
import Select from './Select.vue'
import SelectContent from './SelectContent.vue'
import SelectItem from './SelectItem.vue'
import SelectTrigger from './SelectTrigger.vue'

let mounted: ReturnType<typeof mount> | undefined
const selectModes = ['options', 'slot', 'primitives'] as const
const typeaheadMatches = [
    { key: 'n', target: 'New', value: 'renamed' },
    { key: 'o', target: 'Orbit', value: 'other' },
]

afterEach(() => mounted?.unmount())

describe('Select 动态选项文案', () => {
    it.each(selectModes)('在 %s 入口同步选中文案并保留焦点', async (mode) => {
        const selectedValue = 'a'
        const otherValue = 'b'
        const label = ref('Alpha')
        const otherLabel = 'Bravo'
        const order = ref([selectedValue, otherValue])
        const update = vi.fn()
        const select = vi.fn()
        const DynamicLabel = defineComponent(() => () => h('strong', label.value))
        const rootProps = { modelValue: selectedValue, 'onUpdate:modelValue': update }
        const parts = () => [
            h(SelectTrigger, { 'aria-label': 'Choice' }, () => h(SelectValue, { placeholder: 'Choose' })),
            h(SelectContent, null, () => order.value.map(value =>
                h(SelectItem, { key: value, value, onSelect: select }, () =>
                    value === selectedValue ? h(DynamicLabel) : otherLabel))),
        ]

        mounted = mount(defineComponent(() => () => {
            if (mode === 'slot') return h(Select, rootProps, parts)
            if (mode === 'primitives') return h(SelectRoot, rootProps, parts)
            return h(Select, {
                ...rootProps,
                ariaLabel: 'Choice',
                placeholder: 'Choose',
                options: order.value.map(value => ({ value, label: value === selectedValue ? label.value : otherLabel })),
            })
        }))

        const trigger = page.getByRole('combobox', { includeHidden: true })
        const triggerElement = trigger.element() as HTMLElement
        await expect.element(trigger).toHaveTextContent('Alpha')
        triggerElement.focus()
        label.value = 'Updated'
        await expect.element(trigger).toHaveTextContent('Updated')
        expect(document.activeElement).toBe(triggerElement)
        await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')

        await userEvent.keyboard('{ArrowDown}')
        const selectedOption = page.getByRole('option', { name: 'Updated' })
        await expect.element(selectedOption).toHaveAttribute('aria-selected', 'true')
        await expect.element(selectedOption).toHaveFocus()
        const selectedElement = selectedOption.element()

        label.value = otherLabel
        order.value = [otherValue, selectedValue]
        const renamedOption = page.getByRole('option', { name: otherLabel, selected: true })
        await expect.element(renamedOption).toHaveFocus()
        expect(renamedOption.element()).toBe(selectedElement)
        expect(trigger.element()).toBe(triggerElement)
        await expect.element(trigger).toHaveTextContent(otherLabel)
        await expect.element(trigger).toHaveAttribute('aria-expanded', 'true')
        expect(update).not.toHaveBeenCalled()
        expect(select).not.toHaveBeenCalled()

        await userEvent.keyboard('{ArrowUp}')
        await expect.element(page.getByRole('option', { name: otherLabel, selected: false })).toHaveFocus()
        await userEvent.keyboard('{Enter}')
        await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
        await expect.element(trigger).toHaveFocus()
        expect(update).toHaveBeenCalledExactlyOnceWith(otherValue)
        if (mode !== 'options') expect(select).toHaveBeenCalledTimes(1)

        order.value = [otherValue]
        await expect.element(trigger).toHaveTextContent('Choose')
        label.value = 'Returned'
        order.value = [selectedValue, otherValue]
        await expect.element(trigger).toHaveTextContent('Returned')
        expect(update).toHaveBeenCalledTimes(1)
    })

    it.each(selectModes.flatMap(mode => typeaheadMatches.map(match => ({ mode, ...match }))))('在 $mode 入口展开后键入 $key 定位当前文案 $target', async ({ mode, key, target, value }) => {
        const label = ref('Old')
        const renamedDisabled = ref(false)
        const update = vi.fn()
        const rootProps = { modelValue: 'selected', 'onUpdate:modelValue': update }
        const options = () => [
            { value: 'selected', label: 'Anchor' },
            { value: 'disabled', label: 'North', disabled: true },
            { value: 'renamed', label: label.value, disabled: renamedDisabled.value },
            { value: 'other', label: 'Orbit' },
        ]
        const parts = () => [
            h(SelectTrigger, null, () => h(SelectValue)),
            h(SelectContent, null, () => options().map(option =>
                h(SelectItem, { key: option.value, value: option.value, disabled: option.disabled }, () => h('strong', option.label)))),
        ]

        mounted = mount(defineComponent(() => () => {
            if (mode === 'slot') return h(Select, rootProps, parts)
            if (mode === 'primitives') return h(SelectRoot, rootProps, parts)
            return h(Select, { ...rootProps, options: options() })
        }))

        const trigger = page.getByRole('combobox', { includeHidden: true })
        await userEvent.click(trigger)
        const selectedOption = page.getByRole('option', { name: 'Anchor', selected: true })
        await expect.element(selectedOption).toHaveFocus()
        const renamedElement = page.getByRole('option', { name: 'Old' }).element()
        label.value = 'New'
        const renamedOption = page.getByRole('option', { name: 'New' })
        await expect.element(renamedOption).toBeVisible()
        expect(renamedOption.element()).toBe(renamedElement)
        renamedDisabled.value = true
        await expect.element(renamedOption).toHaveAttribute('aria-disabled', 'true')
        renamedDisabled.value = false
        await expect.element(renamedOption).not.toHaveAttribute('aria-disabled')
        await expect.element(selectedOption).toHaveFocus()
        expect(update).not.toHaveBeenCalled()

        await userEvent.keyboard(key)
        await expect.element(page.getByRole('option', { name: target })).toHaveFocus()
        expect(update).not.toHaveBeenCalled()

        await userEvent.keyboard('{Enter}')
        await expect.element(trigger).toHaveFocus()
        await expect.element(trigger).toHaveTextContent('Anchor')
        expect(update).toHaveBeenCalledExactlyOnceWith(value)
    })

    it('文案变化后仍可键入调用方指定的 textValue', async () => {
        const label = ref('Old')
        mounted = mount(defineComponent(() => () => h(SelectRoot, { modelValue: 'selected' }, () => [
            h(SelectTrigger, null, () => h(SelectValue)),
            h(SelectContent, null, () => [
                h(SelectItem, { value: 'selected' }, () => 'Anchor'),
                h(SelectItem, { value: 'renamed', textValue: 'Keyword' }, () => label.value),
            ]),
        ])))

        await userEvent.click(page.getByRole('combobox'))
        await expect.element(page.getByRole('option', { name: 'Anchor' })).toHaveFocus()
        label.value = 'New'
        const renamedOption = page.getByRole('option', { name: 'New' })
        await expect.element(renamedOption).toBeVisible()
        await userEvent.keyboard('k')
        await expect.element(renamedOption).toHaveFocus()
    })
})
