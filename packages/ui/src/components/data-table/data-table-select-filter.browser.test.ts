import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { mount } from '@/test/browser-mount'
import DataTable from './DataTable.vue'
import type { DataTableColumn, DataTableFilterState } from './types'

const allOption = '全部'
const numericZeroOption = { label: '数字零', value: 0 }
const stringZeroOption = { label: '字符串零', value: '0' }
const allStringOption = { label: '字符串 all', value: 'all' }
const rows = [
    { id: 1, label: '零结果', status: 0 },
    { id: 2, label: '其他结果', status: 'all' },
]
const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { id: 'label', header: '记录', accessorKey: 'label' },
    {
        id: 'status',
        header: '状态',
        accessorKey: 'status',
        filterType: 'select',
        filterOptions: [numericZeroOption, stringZeroOption, allStringOption],
    },
]

let table: ReturnType<typeof mount> | undefined

afterEach(() => {
    table?.unmount()
    table = undefined
})

describe('DataTable 单选列筛选', () => {
    it('保留选项值类型并通过全部选项清除列筛选', async () => {
        const filters: DataTableFilterState[] = []
        table = mount(DataTable, {
            props: { data: rows, columns, rowKey: 'id', filterable: true, onFilter: (state: DataTableFilterState) => filters.push(state) },
        })
        const filter = table.vm?.filter as { setFilterState: (state: DataTableFilterState) => void }
        const trigger = page.getByRole('combobox')
        const listbox = page.getByRole('listbox')
        const firstRow = page.getByText(rows[0].label, { exact: true })
        const secondRow = page.getByText(rows[1].label, { exact: true })
        const option = (label: string) => listbox.getByRole('option', { name: label, exact: true })

        await page.getByRole('button', { name: 'Filter status' }).click()
        await expect.element(trigger).toHaveTextContent(allOption)
        await trigger.click()
        await expect.element(option(allOption)).toHaveAttribute('aria-selected', 'true')
        await option(numericZeroOption.label).click()
        await expect.element(trigger).toHaveTextContent(numericZeroOption.label)
        await expect.element(firstRow).toBeVisible()
        await expect.element(secondRow).not.toBeInTheDocument()
        expect(filters.at(-1)?.columns).toEqual({ status: 0 })

        await trigger.click()
        await option(stringZeroOption.label).click()
        await expect.element(trigger).toHaveTextContent(stringZeroOption.label)
        expect(filters.at(-1)?.columns).toEqual({ status: '0' })

        filter.setFilterState({ columns: { status: numericZeroOption.value } })
        await expect.element(trigger).toHaveTextContent(numericZeroOption.label)
        await trigger.click()
        await expect.element(option(numericZeroOption.label)).toHaveAttribute('aria-selected', 'true')
        await option(allStringOption.label).click()
        await expect.element(trigger).toHaveTextContent(allStringOption.label)
        await expect.element(firstRow).not.toBeInTheDocument()
        await expect.element(secondRow).toBeVisible()
        expect(filters.at(-1)?.columns).toEqual({ status: 'all' })

        await trigger.click()
        await option(allOption).click()
        await expect.element(trigger).toHaveTextContent(allOption)
        await expect.element(firstRow).toBeVisible()
        await expect.element(secondRow).toBeVisible()
        expect(filters.at(-1)?.columns).toEqual({})
        await trigger.click()
        await expect.element(option(allOption)).toHaveAttribute('aria-selected', 'true')
    })
})
