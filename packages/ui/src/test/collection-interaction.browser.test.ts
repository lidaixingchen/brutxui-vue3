import { afterEach, describe, expect, it, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, type Component } from 'vue'
import { DropdownMenuRoot as DropdownMenu, DropdownMenuTrigger } from 'reka-ui'
import { BASE_THEME, THEME_PRESETS, TOKEN_TO_CSS_VAR, calculateContrastRatio } from 'brutx-shared-vue'
import { mount } from './browser-mount'
import Select from '@/components/select/Select.vue'
import SelectTrigger from '@/components/select/SelectTrigger.vue'
import SelectContent from '@/components/select/SelectContent.vue'
import SelectItem from '@/components/select/SelectItem.vue'
import Command from '@/components/command/Command.vue'
import CommandInput from '@/components/command/CommandInput.vue'
import CommandList from '@/components/command/CommandList.vue'
import CommandItem from '@/components/command/CommandItem.vue'
import Combobox from '@/components/combobox/Combobox.vue'
import Cascader from '@/components/cascader/Cascader.vue'
import TreeSelect from '@/components/tree-select/TreeSelect.vue'
import TreeView from '@/components/tree-view/TreeView.vue'
import Transfer from '@/components/transfer/Transfer.vue'
import DropdownMenuContent from '@/components/dropdown-menu/DropdownMenuContent.vue'
import DropdownMenuItem from '@/components/dropdown-menu/DropdownMenuItem.vue'
import DropdownMenuShortcut from '@/components/dropdown-menu/DropdownMenuShortcut.vue'
import '../../dist/styles.css'

declare module 'vitest/browser' {
    interface BrowserCommands {
        pressPrimaryPointer: () => Promise<void>
        releasePrimaryPointer: () => Promise<void>
    }
}

const labels = ['苹果', '香蕉']
const MIN_TEXT_CONTRAST = 4.5
const options = labels.map((label, index) => ({ value: String(index), label }))
const nodes = options.map(option => ({ id: option.value, label: option.label }))
const updates = vi.fn()
let mounted: ReturnType<typeof mount> | undefined

const selectFixture = defineComponent({
    setup: () => () => h(Select, { defaultOpen: true, modelValue: '0', 'onUpdate:modelValue': updates }, {
        default: () => [
            h(SelectTrigger, {}, () => labels[0]),
            h(SelectContent, {}, () => options.map(option => h(SelectItem, { value: option.value }, () => option.label))),
        ],
    }),
})

const commandFixture = defineComponent({
    setup: () => () => h(Command, {}, () => [
        h(CommandInput),
        h(CommandList, {}, () => options.map(option => h(CommandItem, { value: option.value, onSelect: updates }, () => option.label))),
    ]),
})

const menuFixture = defineComponent({
    setup: () => () => h(DropdownMenu, { defaultOpen: true }, () => [
        h(DropdownMenuTrigger, {}, () => '操作'),
        h(DropdownMenuContent, {}, () => options.map(option => h(DropdownMenuItem, { onSelect: updates }, () => option.label))),
    ]),
})

const cases: { name: string; component: Component; props?: Record<string, unknown>; trigger?: string; rows: string }[] = [
    { name: 'Select', component: selectFixture, rows: '[role="option"]' },
    { name: 'Command', component: commandFixture, rows: '[data-slot="command-item"]' },
    { name: 'Combobox', component: Combobox, props: { options, modelValue: '0' }, trigger: '[role="combobox"]', rows: '[data-slot="command-item"]' },
    { name: 'Cascader', component: Cascader, props: { options, modelValue: ['0'] }, trigger: '[role="combobox"]', rows: '[role="option"]' },
    { name: 'TreeSelect', component: TreeSelect, props: { nodes, modelValue: '0' }, trigger: '[role="combobox"]', rows: '[role="treeitem"] > div:first-child' },
    { name: 'TreeView', component: TreeView, props: { nodes, modelValue: '0' }, rows: '[role="treeitem"] > div:first-child' },
    { name: 'Transfer', component: Transfer, props: { data: options.map(option => ({ key: option.value, label: option.label })), modelValue: [] }, rows: '[data-slot="transfer-item"]' },
    { name: 'DropdownMenu', component: menuFixture, rows: '[role="menuitem"]' },
]

afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    updates.mockClear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('style')
})

function findRow(selector: string, label = labels[1]): HTMLElement {
    const row = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(element => element.textContent?.trim() === label)
    if (!row) throw new Error(`找不到选项行：${label}`)
    return row
}

function geometry(row: HTMLElement) {
    const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT)
    let text = walker.nextNode()
    while (text && !text.textContent?.includes(labels[1])) text = walker.nextNode()
    if (!text) throw new Error('找不到选项文字')
    const range = document.createRange()
    range.selectNodeContents(text)
    const rowRect = row.getBoundingClientRect()
    const textRect = range.getBoundingClientRect()
    return {
        row: [rowRect.x, rowRect.y, rowRect.width, rowRect.height],
        text: [textRect.x, textRect.y, textRect.width, textRect.height],
        weight: getComputedStyle(text.parentElement!).fontWeight,
    }
}

function resolveColor(color: string) {
    const element = document.createElement('span')
    element.style.color = color
    document.body.append(element)
    const resolved = getComputedStyle(element).color
    element.remove()
    return resolved
}

function selectionMarks() {
    return Array.from(document.querySelectorAll<HTMLElement>('[aria-selected="true"], [aria-checked="true"], [aria-checked="mixed"]'))
        .map(element => ({
            id: element.id,
            role: element.getAttribute('role'),
            text: element.textContent,
            selected: element.getAttribute('aria-selected'),
            checked: element.getAttribute('aria-checked'),
        }))
}

function rowPresentation(row: HTMLElement) {
    const style = getComputedStyle(row)
    return {
        transform: style.transform,
        translate: style.translate,
        scale: style.scale,
        // 聚焦环与行投影共用 box-shadow，行投影单独读取 Tailwind 阴影槽位。
        shadow: style.getPropertyValue('--tw-shadow'),
    }
}

async function settleAnimations() {
    await nextTick()
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished))
}

describe('集合选项真实样式与交互', () => {
    it.each(cases)('$name 高亮与真实按住期间保持几何、标记和行投影稳定', async ({ component, props, trigger, rows }) => {
        mounted = mount(component, { props: { ...props, 'onUpdate:modelValue': updates } })
        if (trigger) await userEvent.click(mounted.element.querySelector<HTMLElement>(trigger)!)
        await settleAnimations()
        const row = findRow(rows)
        await expect.poll(() => row.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
        await settleAnimations()
        const before = geometry(row)
        await userEvent.hover(row)
        await expect.poll(() => row.hasAttribute('data-highlighted')).toBe(true)
        expect(geometry(row)).toEqual(before)
        expect(getComputedStyle(row).backgroundColor).toBe(resolveColor(BASE_THEME.light.itemHighlight))
        expect(getComputedStyle(row).color).toBe(resolveColor(BASE_THEME.light.itemHighlightForeground))
        const marks = selectionMarks()
        const presentation = rowPresentation(row)
        await commands.pressPrimaryPointer()
        try {
            expect(row.matches(':active')).toBe(true)
            expect(geometry(row)).toEqual(before)
            expect(rowPresentation(row)).toEqual(presentation)
            expect(selectionMarks()).toEqual(marks)
            expect(updates).not.toHaveBeenCalled()
        } finally {
            await commands.releasePrimaryPointer()
        }
    })

    it('Command 键盘虚拟焦点与指针模式切换保持唯一当前项', async () => {
        mounted = mount(commandFixture)
        const input = document.querySelector<HTMLInputElement>('input')!
        await userEvent.click(input)
        await userEvent.keyboard('{ArrowDown}')
        await expect.poll(() => document.querySelectorAll('[data-focus-visible]')).toHaveLength(1)
        expect(document.activeElement).toBe(input)
        const focused = document.querySelector<HTMLElement>('[data-focus-visible]')!
        expect(input.getAttribute('aria-activedescendant')).toBe(focused.id)
        expect(getComputedStyle(focused).boxShadow).not.toBe('none')
        await userEvent.hover(findRow('[data-slot="command-item"]'))
        await expect.poll(() => document.querySelectorAll('[data-focus-visible]')).toHaveLength(0)
        expect(document.querySelectorAll('[data-highlighted]')).toHaveLength(1)
        expect(updates).not.toHaveBeenCalled()
    })

    it.each(['light', 'dark'] as const)('预设与自定义色对在 %s 模式通过实际样式对比度验收', async (mode) => {
        mounted = mount(commandFixture)
        const row = findRow('[data-slot="command-item"]')
        await userEvent.hover(row)
        for (const preset of [{ name: 'classic', tokens: BASE_THEME[mode] }, ...Object.entries(THEME_PRESETS).map(([name, theme]) => ({ name, tokens: { ...BASE_THEME[mode], ...theme[mode] } }))]) {
            document.documentElement.className = `${mode === 'dark' ? 'dark' : ''} theme-${preset.name}`
            const style = getComputedStyle(row)
            expect(style.backgroundColor).toBe(resolveColor(preset.tokens.itemHighlight))
            expect(calculateContrastRatio(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
        }
        document.documentElement.style.setProperty(`--${TOKEN_TO_CSS_VAR.itemHighlight}`, BASE_THEME[mode].secondary)
        document.documentElement.style.setProperty(`--${TOKEN_TO_CSS_VAR.itemHighlightForeground}`, BASE_THEME[mode].secondaryForeground)
        expect(getComputedStyle(row).backgroundColor).toBe(resolveColor(BASE_THEME[mode].secondary))
        expect(getComputedStyle(row).color).toBe(resolveColor(BASE_THEME[mode].secondaryForeground))
    })

    it('Transfer 行勾选保留在源面板直到执行转移', async () => {
        mounted = mount(Transfer, { props: { data: options.map(option => ({ key: option.value, label: option.label })), modelValue: [], 'onUpdate:modelValue': updates } })
        const row = findRow('[data-slot="transfer-item"]')
        const checkbox = row.querySelector<HTMLElement>('[role="checkbox"]')!
        await userEvent.click(checkbox)
        expect(checkbox.getAttribute('aria-checked')).toBe('true')
        await userEvent.hover(findRow('[data-slot="transfer-item"]', labels[0]))
        expect(checkbox.getAttribute('aria-checked')).toBe('true')
        expect(updates).not.toHaveBeenCalled()
    })

    it('危险菜单项与快捷键使用成对前景色', async () => {
        mounted = mount(defineComponent({
            setup: () => () => h(DropdownMenu, { defaultOpen: true }, () => [
                h(DropdownMenuTrigger, {}, () => '操作'),
                h(DropdownMenuContent, {}, () => h(DropdownMenuItem, { dataTone: 'danger' }, () => [
                    h('span', {}, labels[1]),
                    h(DropdownMenuShortcut, {}, () => '⌘K'),
                ])),
            ]),
        }))
        await expect.poll(() => document.querySelector('[role="menuitem"]')).not.toBeNull()
        const row = document.querySelector<HTMLElement>('[role="menuitem"]')!
        await expect.poll(() => row.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
        await userEvent.hover(row)
        expect(getComputedStyle(row).backgroundColor).toBe(resolveColor(BASE_THEME.light.destructive))
        const shortcut = row.querySelector<HTMLElement>('span:last-child')!
        expect(getComputedStyle(shortcut).color).toBe(getComputedStyle(row).color)
        expect(getComputedStyle(shortcut).opacity).toBe('1')
    })
})
