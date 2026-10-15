import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
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
