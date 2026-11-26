import { renderToString } from '@vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createSSRApp, defineComponent, h, ref, type Component } from 'vue'
import { mount } from '@/test/browser-mount'
import { ColorPicker } from '../color-picker'
import { DatePicker, DatePickerRange, DateTimePicker, MonthPicker, WeekPicker, YearPicker } from '../date-picker'
import { Popconfirm } from '../popconfirm'
import { Popover, PopoverContent, PopoverTrigger } from '.'

const OUTER_DIALOG = '[role="dialog"][data-state="open"]'
const PICKERS: ReadonlyArray<readonly [string, Component]> = [
    ['ColorPicker', ColorPicker], ['DatePicker', DatePicker], ['DateTimePicker', DateTimePicker],
    ['DatePickerRange', DatePickerRange], ['MonthPicker', MonthPicker], ['WeekPicker', WeekPicker],
    ['YearPicker', YearPicker],
]

async function expectNamedDialog(trigger: HTMLElement, name: string) {
    const dialogSelector = `${OUTER_DIALOG}[aria-labelledby="${CSS.escape(trigger.id)}"]`
    await expect.poll(() => document.querySelector(dialogSelector)).not.toBeNull()
    const dialog = document.querySelector<HTMLElement>(dialogSelector)!
    await expect.element(dialog).toHaveAccessibleName(name)
    const id = dialog.getAttribute('aria-labelledby')
    expect(id).toBe(trigger.id)
    expect(document.getElementById(id!)).toBe(trigger)
}

describe.each(PICKERS)('%s 弹层名称', (_name, component) => {
    it('关联实际触发器并跟随公开 id 属性更新', async () => {
        const id = ref<string>()
        const name = '选择日期或颜色'
        const wrapper = mount(defineComponent({
            setup: () => () => h(component, { id: id.value, 'aria-label': name }),
        }))
        try {
            const trigger = wrapper.element.querySelector<HTMLButtonElement>('[role="combobox"]')!
            const generatedId = trigger.id
            expect(generatedId).not.toBe('')
            await userEvent.click(trigger)
            await expectNamedDialog(trigger, name)

            id.value = 'custom-picker'
            await expect.poll(() => trigger.id).toBe('custom-picker')
            await expectNamedDialog(trigger, name)

            id.value = undefined
            await expect.poll(() => trigger.id).toBe(generatedId)
            await expectNamedDialog(trigger, name)
        } finally {
            wrapper.unmount()
        }
    })
})

it('保留 asChild 按钮的 ID 并处理弹层打开时的 ID 变化和触发器替换', async () => {
    const id = ref<string | undefined>('slot-first')
    const fallbackId = ref('fallback-trigger')
    const slotKey = ref('original-slot')
    const replacement = ref(false)
    const wrapper = mount(defineComponent({
        setup: () => () => h(Popover, {}, () => [
            replacement.value
                ? h(PopoverTrigger, { key: 'replacement', id: 'replacement-trigger' }, () => '替换后的触发器')
                : h(PopoverTrigger, { key: 'original', asChild: true, id: fallbackId.value }, () =>
                    h('button', { id: id.value, key: slotKey.value }, '原触发器')),
            h(PopoverContent, {}, () => '弹层内容'),
        ]),
    }))
    try {
        const first = wrapper.element.querySelector('button')!
        expect(first.id).toBe('slot-first')
        await userEvent.click(first)
        await expectNamedDialog(first, '原触发器')

        id.value = 'slot-updated'
        await expect.poll(() => first.id).toBe('slot-updated')
        await expectNamedDialog(first, '原触发器')

        id.value = undefined
        await expect.poll(() => first.id).toBe('fallback-trigger')
        await expectNamedDialog(first, '原触发器')

        fallbackId.value = 'updated-fallback-trigger'
        await expect.poll(() => first.id).toBe('updated-fallback-trigger')
        await expectNamedDialog(first, '原触发器')

        slotKey.value = 'new-slot'
        id.value = 'new-slot-trigger'
        const slotLocator = page.getByRole('button', { name: '原触发器' })
        await expect.element(slotLocator).toHaveAttribute('id', 'new-slot-trigger')
        const newSlot = slotLocator.element() as HTMLButtonElement
        expect(first.isConnected).toBe(false)
        await expectNamedDialog(newSlot, '原触发器')

        replacement.value = true
        const secondLocator = page.getByRole('button', { name: '替换后的触发器' })
        await expect.element(secondLocator).toHaveAttribute('id', 'replacement-trigger')
        const second = secondLocator.element() as HTMLButtonElement
        expect(newSlot.isConnected).toBe(false)
        await expectNamedDialog(second, '替换后的触发器')

        await userEvent.keyboard('{Escape}')
        await expect.poll(() => document.querySelector(OUTER_DIALOG)).toBeNull()
        await expect.element(secondLocator).toHaveFocus()
        await userEvent.click(second)
        await expectNamedDialog(second, '替换后的触发器')
    } finally {
        wrapper.unmount()
    }
})

it('将 Popconfirm 的外层弹窗关联至调用方按钮', async () => {
    const wrapper = mount(defineComponent({
        setup: () => () => h(Popconfirm, { title: '确认移除？' }, () =>
            h('button', { id: 'confirm-slot-trigger' }, '移除')),
    }))
    try {
        const trigger = wrapper.element.querySelector('button')!
        await userEvent.click(trigger)
        await expectNamedDialog(trigger, '移除')
        await expect.element(page.getByRole('alertdialog', { name: '确认移除？' })).toBeInTheDocument()
    } finally {
        wrapper.unmount()
    }
})

it('在 SSR 和水合之间保留自动 ID 并隔离两个弹层', async () => {
    const names = ['第一个触发器', '第二个触发器']
    const Root = defineComponent({
        setup: () => () => h('div', names.map(name => h(Popover, { key: name, defaultOpen: true }, () => [
            h(PopoverTrigger, { asChild: true }, () => h('button', name)),
            h(PopoverContent, {}, () => '弹层内容'),
        ]))),
    })
    const host = document.body.appendChild(document.createElement('div'))
    const app = createSSRApp(Root)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
        host.innerHTML = await renderToString(createSSRApp(Root))
        const ssrIds = Array.from(host.querySelectorAll('button'), button => button.id)
        expect(ssrIds).toHaveLength(names.length)
        expect(ssrIds.every(Boolean)).toBe(true)
        expect(new Set(ssrIds).size).toBe(names.length)

        app.mount(host)
        const triggers = Array.from(host.querySelectorAll('button'))
        expect(triggers.map(button => button.id)).toEqual(ssrIds)
        for (const [index, trigger] of triggers.entries()) {
            await expectNamedDialog(trigger, names[index]!)
        }
        expect(error).not.toHaveBeenCalled()
        expect(warn).not.toHaveBeenCalled()
    } finally {
        app.unmount()
        host.remove()
        error.mockRestore()
        warn.mockRestore()
    }
})

it('关联晚于触发器挂载的弹层并跟随按钮 ID 变化', async () => {
    const showContent = ref(false)
    const id = ref('mounted-trigger')
    const wrapper = mount(defineComponent({
        setup: () => () => h(Popover, { open: true }, () => [
            h(PopoverTrigger, { id: id.value }, () => '先挂载的触发器'),
            showContent.value ? h(PopoverContent, {}, () => '后挂载的弹层') : null,
        ]),
    }))
    try {
        const trigger = wrapper.element.querySelector('button')!
        showContent.value = true
        await expectNamedDialog(trigger, '先挂载的触发器')
        id.value = 'renamed-mounted-trigger'
        await expect.poll(() => trigger.id).toBe('renamed-mounted-trigger')
        await expectNamedDialog(trigger, '先挂载的触发器')
    } finally {
        wrapper.unmount()
    }
})

it.each(['content', 'slot'] as const)('保留 %s 的显式名称并响应动态修改', async (target) => {
    const dialogLabel = ref<string | undefined>('显式名称')
    const labelledby = ref<string>()
    const wrapper = mount(defineComponent({
        setup: () => () => h('div', [
            h('span', { id: 'custom-dialog-heading' }, '显式标题'),
            h(Popover, { open: true }, () => {
                const names = { 'aria-label': dialogLabel.value, 'aria-labelledby': labelledby.value }
                return [
                    h(PopoverTrigger, {}, () => '触发器名称'),
                    target === 'content'
                        ? h(PopoverContent, names, () => '弹层内容')
                        : h(PopoverContent, { asChild: true }, () => h('section', names, '弹层内容')),
                ]
            }),
        ]),
    }))
    try {
        await expect.element(page.getByRole('dialog', { name: '显式名称' })).toBeInTheDocument()
        labelledby.value = 'custom-dialog-heading'
        await expect.element(page.getByRole('dialog', { name: '显式标题' })).toBeInTheDocument()
        labelledby.value = undefined
        dialogLabel.value = '新的显式名称'
        await expect.element(page.getByRole('dialog', { name: '新的显式名称' })).toBeInTheDocument()
        dialogLabel.value = undefined
        const trigger = wrapper.element.querySelector('button')!
        await expectNamedDialog(trigger, '触发器名称')
    } finally {
        wrapper.unmount()
    }
})

it('渲染空插槽和带片段的触发器时仅注册实际按钮', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(defineComponent({
        setup: () => () => h('div', [
            h(Popconfirm, { title: '没有触发按钮', open: true }),
            h('button', { 'data-unrelated-button': true }, '无关按钮'),
            h(Popover, { open: true }, () => [
                h(PopoverTrigger, { asChild: true }, () => [
                    h('button', { id: 'fragment-trigger' }, '片段内的按钮'),
                    h('span', '附加文本'),
                ]),
                h(PopoverContent, {}, () => '片段按钮的弹层'),
            ]),
        ]),
    }))
    try {
        const trigger = wrapper.element.querySelector<HTMLButtonElement>('#fragment-trigger')!
        await expectNamedDialog(trigger, '片段内的按钮')
        expect(wrapper.element.querySelector('[data-unrelated-button]')?.id).toBe('')
        expect(warn).not.toHaveBeenCalled()
    } finally {
        wrapper.unmount()
        warn.mockRestore()
    }
})
