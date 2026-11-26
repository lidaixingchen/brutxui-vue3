import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { mount } from '@/test/browser-mount'
import Command from './Command.vue'
import CommandEmpty from './CommandEmpty.vue'
import CommandGroup from './CommandGroup.vue'
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

    it('indexes one persistent custom slot and updates the navigation collection as its label changes', async () => {
        const query = ref('设置')
        const label = ref('设置')
        const labelId = 'command-custom-label'
        let mounts = 0
        let unmounts = 0
        const CustomLabel = defineComponent({
            setup() {
                onMounted(() => mounts++)
                onUnmounted(() => unmounts++)
                return () => h('span', { id: labelId }, [
                    label.value,
                    h('span', { hidden: true }, '隐藏'),
                    h('span', { 'aria-hidden': 'true' }, '装饰'),
                    h('span', { class: 'sr-only' }, '读屏'),
                ])
            },
        })
        mounted = mount(defineComponent({
            setup: () => () => h(Command, {}, () => [
                h(CommandInput, { modelValue: query.value, 'onUpdate:modelValue': value => { query.value = value } }),
                h(CommandList, {}, () => [
                    h(CommandGroup, { title: '系统' }, () => [
                        h(CommandItem, { value: 'settings', onSelect: value => selectedValues.push(value) }, () => h(CustomLabel)),
                    ]),
                    h(CommandEmpty),
                ]),
            ]),
        }))

        const input = mounted.element.querySelector<HTMLInputElement>('[role="searchbox"]')!
        const group = mounted.element.querySelector<HTMLElement>('[data-slot="command-group"]')!
        const option = () => mounted!.element.querySelector<HTMLElement>('[role="option"]')
        const empty = () => mounted!.element.querySelector('[data-slot="command-empty"]')

        await expect.poll(() => option()?.querySelector('#' + labelId)?.firstChild?.textContent).toBe('设置')
        expect(empty()).toBeNull()
        const originalLabel = document.getElementById(labelId)
        expect(mounts).toBe(1)

        input.focus()
        await userEvent.keyboard('{ArrowDown}')
        expect(input.getAttribute('aria-activedescendant')).toBe(option()!.id)

        for (const hiddenText of ['隐藏', '装饰', '读屏', '偏好']) {
            query.value = hiddenText
            await nextTick()
            await expect.poll(option).toBeNull()
            expect(group.style.display).toBe('none')
            expect(empty()).not.toBeNull()
            expect(input.hasAttribute('aria-activedescendant')).toBe(false)
            await userEvent.keyboard('{ArrowDown}{Enter}')
            expect(selectedValues).toEqual([])
        }
        expect(originalLabel?.closest('[hidden][inert]')?.getAttribute('data-disabled')).toBe('')

        label.value = '偏好'
        await expect.poll(() => option()?.querySelector('#' + labelId)).toBe(originalLabel)
        expect(document.querySelectorAll('#' + labelId)).toHaveLength(1)
        expect(mounts).toBe(1)
        expect(unmounts).toBe(0)
        expect(group.style.display).not.toBe('none')
        expect(empty()).toBeNull()
        await expect.poll(() => input.getAttribute('aria-activedescendant')).toBe(option()!.id)
        await userEvent.keyboard('{Enter}')
        expect(selectedValues).toEqual(['settings'])
    })

    it('preserves consumer attributes and option semantics across filtering', async () => {
        const query = ref('')
        mounted = mount(defineComponent({
            setup: () => () => h(Command, { modelValue: 'selected' }, () => [
                h(CommandInput, { modelValue: query.value, 'onUpdate:modelValue': value => { query.value = value } }),
                h(CommandList, {}, () => [
                    h(CommandItem, { value: 'hidden', id: 'explicit-hidden', hidden: true }, () => 'Hidden option'),
                    h(CommandItem, { value: 'inert', id: 'explicit-inert', inert: true }, () => 'Inert option'),
                    h(CommandItem, {
                        value: 'selected', id: 'selected-option', role: 'presentation', tabindex: 77, 'aria-selected': false,
                    }, () => 'Selected option'),
                    h(CommandItem, { value: 'first', id: 'probe-first', 'aria-label': 'Custom name', 'data-custom': 'keep' }, () => 'Probe first'),
                    h(CommandItem, { value: 'trap', id: 'filter-trap', 'data-disabled': 'external' }, () => 'Filter trap'),
                    h(CommandItem, { value: 'last', id: 'probe-last' }, () => 'Probe last'),
                    h(CommandEmpty),
                ]),
            ]),
        }))

        const option = mounted.element.querySelector('#selected-option')!
        const input = mounted.element.querySelector<HTMLInputElement>('[role="searchbox"]')!
        expect(option.getAttribute('role')).toBe('option')
        expect(option.getAttribute('tabindex')).toBe('-1')
        expect(option.getAttribute('aria-selected')).toBe('true')
        expect(mounted.element.querySelector('#explicit-hidden')?.hasAttribute('hidden')).toBe(true)
        expect(mounted.element.querySelector('#explicit-inert')?.hasAttribute('inert')).toBe(true)
        await expect.element(page.getByRole('option', { name: 'Hidden option' })).not.toBeInTheDocument()
        await expect.element(page.getByRole('option', { name: 'Inert option' })).not.toBeInTheDocument()
        await expect.element(page.getByRole('option', { name: 'Custom name' })).toBeVisible()
        expect(mounted.element.querySelector('#probe-first')?.getAttribute('data-custom')).toBe('keep')

        query.value = 'Probe'
        await expect.poll(() => mounted!.element.querySelector('#filter-trap')?.getAttribute('data-disabled')).toBe('')
        input.focus()
        await userEvent.keyboard('{Home}{ArrowDown}')
        expect(input.getAttribute('aria-activedescendant')).toBe('probe-last')

        query.value = 'no-match'
        await expect.poll(() => input.getAttribute('aria-activedescendant')).toBeNull()
        await userEvent.keyboard('{ArrowDown}{Enter}')
        await expect.element(page.getByRole('option')).not.toBeInTheDocument()
        expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    })
})
