import { afterEach, expect, it, vi } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { provideLocale } from '@/composables/useLocale'
import { en, zhCN } from '@/locales'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import Pagination from './Pagination.vue'

let mounted: ReturnType<typeof mount> | undefined
afterEach(() => mounted?.unmount())

it('切换语言时同步已选条数的可见文案、触发器名称和选项名称', async () => {
    const locale = ref(zhCN)
    const size = 10
    mounted = mount(defineComponent(() => {
        provideLocale(locale)
        return () => h(Pagination, { modelValue: 1, pageSize: size, layout: 'sizes' })
    }))

    const trigger = page.getByRole('combobox', { includeHidden: true })
    await expect.element(trigger).toHaveAccessibleName(zhCN.pagination.perPage)
    await expect.element(trigger).toHaveTextContent('10 条/页')
    locale.value = en
    await expect.element(trigger).toHaveAccessibleName(en.pagination.perPage)
    await expect.element(trigger).toHaveTextContent('10 / page')

    await userEvent.click(trigger)
    await expect.element(page.getByRole('option', { name: '10 / page' })).toHaveFocus()
    locale.value = zhCN
    await expect.element(trigger).toHaveAttribute('aria-label', zhCN.pagination.perPage)
    await expect.element(trigger).toHaveTextContent('10 条/页')
    await expect.element(page.getByRole('option', { name: '10 条/页', selected: true })).toHaveFocus()
})

it.each(['pointer', 'keyboard'] as const)('展开后禁用时阻止 %s 更改条数和页码，重新启用后恢复选择', async (input) => {
    const disabled = ref(false)
    const initialSize = 10
    const pageSize = ref(initialSize)
    const currentPage = ref(4)
    const nextSize = 20
    const total = 40
    const sizeChange = vi.fn((size: number) => { pageSize.value = size })
    const pageChange = vi.fn((value: number) => { currentPage.value = value })
    mounted = mount(defineComponent(() => {
        provideLocale(en)
        return () => h(Pagination, {
            disabled: disabled.value,
            modelValue: currentPage.value,
            pageSize: pageSize.value,
            pageSizes: [initialSize, nextSize],
            total,
            layout: 'sizes,pager',
            'onUpdate:pageSize': sizeChange,
            'onUpdate:modelValue': pageChange,
        })
    }))

    const trigger = page.getByRole('combobox', { includeHidden: true })
    const currentOption = page.getByRole('option', { name: '10 / page' })
    const nextOption = page.getByRole('option', { name: '20 / page' })
    await userEvent.click(trigger)
    await expect.element(currentOption).toHaveFocus()
    if (input === 'pointer') await userEvent.hover(nextOption)
    else await userEvent.keyboard('{ArrowDown}')
    await expect.element(nextOption).toHaveFocus()

    disabled.value = true
    await expect.element(trigger).toBeDisabled()
    if (input === 'pointer') {
        await commands.pressPrimaryPointer()
        await commands.releasePrimaryPointer()
    } else {
        await userEvent.keyboard('{Enter}')
    }
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect.element(page.getByRole('listbox')).not.toBeInTheDocument()
    expect(sizeChange).not.toHaveBeenCalled()
    expect(pageChange).not.toHaveBeenCalled()
    await expect.element(trigger).toHaveTextContent('10 / page')

    disabled.value = false
    await expect.element(trigger).toBeEnabled()
    await userEvent.click(trigger)
    await expect.element(currentOption).toHaveFocus()
    if (input === 'pointer') {
        await userEvent.click(nextOption)
    } else {
        await userEvent.keyboard('{ArrowDown}')
        await expect.element(nextOption).toHaveFocus()
        await userEvent.keyboard('{Enter}')
    }
    await expect.element(trigger).toHaveTextContent('20 / page')
    expect(sizeChange).toHaveBeenCalledExactlyOnceWith(nextSize)
    expect(pageChange).toHaveBeenCalledExactlyOnceWith(total / nextSize)
})

it('布局重新显示条数选择器时保持菜单收起', async () => {
    const layout = ref('sizes,pager')
    mounted = mount(defineComponent(() => () => h(Pagination, {
        modelValue: 1,
        totalPages: 2,
        layout: layout.value,
    })))

    const trigger = page.getByRole('combobox', { includeHidden: true })
    await userEvent.click(trigger)
    await expect.element(page.getByRole('listbox')).toBeInTheDocument()
    layout.value = 'pager'
    await expect.element(trigger).not.toBeInTheDocument()
    layout.value = 'sizes,pager'
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect.element(page.getByRole('listbox')).not.toBeInTheDocument()
})
