import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { userEvent } from 'vitest/browser'
import { mount } from '@/test/browser-mount'
import Combobox from './Combobox.vue'

const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
]

type BrowserMountResult = ReturnType<typeof mount>

let host: HTMLDivElement | null = null
let wrapper: BrowserMountResult | null = null

beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
})

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    host?.remove()
    host = null
})

describe('Combobox keyboard browser integration', () => {
    it('keeps checked and accessible selection in sync with the committed multiple value', async () => {
        const manyOptions = [...options, { value: 'cherry', label: 'Cherry' }, { value: 'date', label: 'Date', disabled: true }]
        const committed = ref(['apple', 'banana'])
        const updates: (string | string[] | undefined)[] = []
        wrapper = mount(defineComponent({
            setup: () => () => h(Combobox, {
                options: manyOptions,
                multiple: true,
                modelValue: committed.value,
                'onUpdate:modelValue': value => updates.push(value),
            }),
        }), { attachTo: host! })

        const trigger = host!.querySelector<HTMLElement>('[role="combobox"]')!
        await userEvent.click(trigger)
        const input = document.querySelector<HTMLInputElement>('[role="searchbox"]')!
        const list = document.querySelector<HTMLElement>('[role="listbox"]')!
        const items = [...list.querySelectorAll<HTMLElement>('[role="option"]')]
        const [apple, , cherry, disabled] = items
        const selection = () => items.map(item => ({
            value: item.textContent?.trim(),
            ariaSelected: item.getAttribute('aria-selected'),
            checked: Boolean(item.querySelector('svg')),
        }))
        const initialSelection = manyOptions.map((option, index) => ({
            value: option.label,
            ariaSelected: String(index < committed.value.length),
            checked: index < committed.value.length,
        }))

        expect(list.getAttribute('aria-multiselectable')).toBe('true')
        expect(trigger.hasAttribute('aria-multiselectable')).toBe(false)
        await expect.poll(selection).toEqual(initialSelection)

        await userEvent.click(cherry)
        expect(updates).toEqual([['apple', 'banana', 'cherry']])
        expect(selection()).toEqual(initialSelection)
        expect(input.getAttribute('aria-activedescendant')).toBe(cherry.id)

        input.focus()
        await userEvent.keyboard('{Home}{Enter}')
        expect(input.getAttribute('aria-activedescendant')).toBe(apple.id)
        expect(updates).toEqual([['apple', 'banana', 'cherry'], ['banana']])
        expect(selection()).toEqual(initialSelection)
        disabled.click()
        expect(updates).toHaveLength(2)

        committed.value = ['banana', 'cherry']
        await expect.poll(selection).toEqual(manyOptions.map(option => {
            const checked = committed.value.includes(option.value)
            return { value: option.label, ariaSelected: String(checked), checked }
        }))
        expect(trigger.textContent?.trim()).toBe('Banana, Cherry')
        expect(updates).toHaveLength(2)
    })

    it('selects the highlighted option with ArrowDown and Enter from the search input', async () => {
        const selectedValues: (string | string[] | undefined)[] = []
        wrapper = mount(Combobox, {
            props: {
                options,
                'onUpdate:modelValue': (value: string | string[] | undefined) => selectedValues.push(value),
            },
            attachTo: host!,
        })
        const trigger = host!.querySelector<HTMLElement>('[role="combobox"]')
        if (!trigger) throw new Error('Combobox trigger not found')

        await userEvent.click(trigger)
        const input = document.querySelector<HTMLInputElement>('[data-slot="command-input"] input')
        if (!input) throw new Error('Combobox search input not found')

        await userEvent.click(input)
        await userEvent.type(input, 'Apple')
        await userEvent.keyboard('[ArrowDown][Enter]')

        await expect.poll(() => selectedValues).toEqual(['apple'])
        await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')
    })

    it('retains virtual focus across asynchronous multiple selection confirmation', async () => {
        const acceptanceDelay = 70
        const committed = ref<string | string[] | undefined>(['apple'])
        const updates: typeof committed.value[] = []
        const available = [...options, { value: 'cherry', label: 'Cherry' }]
        wrapper = mount(defineComponent({
            setup: () => () => h(Combobox, {
                options: available,
                multiple: true,
                modelValue: committed.value,
                'onUpdate:modelValue': value => {
                    updates.push(value)
                    setTimeout(() => { committed.value = value }, acceptanceDelay)
                },
            }),
        }), { attachTo: host! })

        await userEvent.click(host!.querySelector<HTMLElement>('[role="combobox"]')!)
        const input = document.querySelector<HTMLInputElement>('[role="searchbox"]')!
        const cherry = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
            .find(option => option.textContent?.trim() === 'Cherry')!
        input.focus()
        await userEvent.keyboard('{Home}{End}{Enter}')
        await expect.poll(() => cherry.getAttribute('aria-selected')).toBe('true')
        expect(input.getAttribute('aria-activedescendant')).toBe(cherry.id)
        await userEvent.keyboard('{Enter}')
        expect(updates).toEqual([['apple', 'cherry'], ['apple']])
        await expect.poll(() => cherry.getAttribute('aria-selected')).toBe('false')
        expect(input.getAttribute('aria-activedescendant')).toBe(cherry.id)
    })

    it('applies a composed search value when IME composition ends', async () => {
        wrapper = mount(Combobox, { props: { options }, attachTo: host! })
        const trigger = host!.querySelector<HTMLElement>('[role="combobox"]')
        if (!trigger) throw new Error('Combobox trigger not found')

        await userEvent.click(trigger)
        const input = document.querySelector<HTMLInputElement>('[data-slot="command-input"] input')
        if (!input) throw new Error('Combobox search input not found')
        await userEvent.click(input)

        input.value = 'Apple'
        input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
        input.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            data: 'Apple',
            inputType: 'insertCompositionText',
            isComposing: true,
        }))
        await nextTick()
        expect(document.querySelectorAll('[data-slot="command-item"]')).toHaveLength(options.length)

        input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'Apple' }))
        await expect.poll(() => document.querySelectorAll('[data-slot="command-item"]')).toHaveLength(1)
    })
})
