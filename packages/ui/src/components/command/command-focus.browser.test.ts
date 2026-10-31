import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mount } from '@/test/browser-mount'
import Command from './Command.vue'
import CommandInput from './CommandInput.vue'
import CommandItem from './CommandItem.vue'
import CommandList from './CommandList.vue'

const options = [
    { value: 'first', label: 'First option' },
    { value: 'second', label: 'Second option' },
    { value: 'third', label: 'Third option' },
]

const selectedValues: string[] = []
let mounted: ReturnType<typeof mount> | undefined

const commandFixture = defineComponent({
    setup: () => () => h(Command, {}, () => [
        h(CommandInput),
        h(CommandList, {}, () => options.map(option => h(
            CommandItem,
            { value: option.value, onSelect: () => selectedValues.push(option.value) },
            () => option.label,
        ))),
    ]),
})

const navigationCases = [
    { key: 'Home', sequence: '{Home}', start: 'Third option', expected: 'First option' },
    { key: 'End', sequence: '{End}', start: 'First option', expected: 'Third option' },
    { key: 'Shift+ArrowDown', sequence: '{Shift>}{ArrowDown}{/Shift}', start: 'First option', expected: 'Second option' },
]

afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    selectedValues.length = 0
})

function findItem(label: string): HTMLElement {
    const item = Array.from(document.querySelectorAll<HTMLElement>('[data-slot="command-item"]'))
        .find(element => element.textContent?.trim() === label)
    if (!item) throw new Error(`找不到命令项：${label}`)
    return item
}

describe('Command virtual focus browser behavior', () => {
    it.each(navigationCases)('$key navigates from pointer mode and synchronizes virtual focus', async ({ sequence, start, expected }) => {
        mounted = mount(commandFixture)
        const input = document.querySelector<HTMLInputElement>('[role="searchbox"]')
        if (!input) throw new Error('找不到命令搜索框')

        const startItem = findItem(start)
        await userEvent.hover(startItem)
        await expect.poll(() => startItem.hasAttribute('data-highlighted')).toBe(true)
        expect(document.querySelectorAll('[data-focus-visible]')).toHaveLength(0)

        input.focus()
        expect(document.activeElement).toBe(input)
        await userEvent.keyboard(sequence)

        const expectedItem = findItem(expected)
        await expect.poll(() => document.querySelector('[data-slot="command-item"][data-highlighted]')).toBe(expectedItem)
        await expect.poll(() => document.querySelectorAll('[data-focus-visible]')).toHaveLength(1)
        expect(document.querySelector('[data-focus-visible]')).toBe(expectedItem)
        expect(document.querySelectorAll('[data-slot="command-item"][data-highlighted]')).toHaveLength(1)
        await expect.poll(() => input.getAttribute('aria-activedescendant')).toBe(expectedItem.id)
        expect(document.activeElement).toBe(input)
        expect(selectedValues).toEqual([])
    })
})
