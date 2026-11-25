import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { userEvent } from 'vitest/browser'
import { mount } from '@/test/browser-mount'
import DataTable from './DataTable.vue'
import type { DataTableColumn } from './types'

interface Row {
    id: number
    name: string
}

const rows: Row[] = [
    { id: 1, name: 'Bob' },
    { id: 2, name: 'Alice' },
]

const columns: DataTableColumn<Row>[] = [
    { id: 'name', header: 'Name', accessorKey: 'name', sortable: true, filterType: 'text' },
]

const layouts = [
    { name: 'native table', virtualScroll: undefined },
    { name: 'virtual table', virtualScroll: { enabled: true, rowHeight: 40 } },
] as const

const keys = [
    { name: 'Enter', input: '{Enter}' },
    { name: 'Space', input: '{Space}' },
] as const

let unmount: (() => void) | null = null

afterEach(() => {
    unmount?.()
    unmount = null
})

function mountDataTable(layout: (typeof layouts)[number], onSort: (column: string, direction: 'asc' | 'desc' | null) => void) {
    const wrapper = mount(DataTable, {
        props: {
            data: rows,
            columns: layout.virtualScroll ? columns.map((column) => ({ ...column, width: 120 })) : columns,
            rowKey: 'id',
            sortable: true,
            filterable: true,
            virtualScroll: layout.virtualScroll,
            onSort,
        },
    })
    unmount = wrapper.unmount
    return wrapper
}

describe.each(layouts)('DataTable $name keyboard interactions', (layout) => {
    it.each(keys)('opens the filter with $name without sorting', async ({ input }) => {
        const sortEvents: Array<[string, 'asc' | 'desc' | null]> = []
        const wrapper = mountDataTable(layout, (column, direction) => sortEvents.push([column, direction]))
        const filterButton = wrapper.element.querySelector<HTMLButtonElement>('[aria-label="Filter name"]')
        expect(filterButton).not.toBeNull()

        filterButton!.focus()
        expect(document.activeElement).toBe(filterButton)
        await userEvent.keyboard(input)
        await nextTick()

        expect(filterButton!.getAttribute('aria-expanded')).toBe('true')
        expect(sortEvents).toEqual([])
        expect(wrapper.element.querySelector('[aria-sort]')?.getAttribute('aria-sort')).toBe('none')
    })

    it.each(keys)('sorts when the header itself is focused and receives $name', async ({ input }) => {
        const sortEvents: Array<[string, 'asc' | 'desc' | null]> = []
        const wrapper = mountDataTable(layout, (column, direction) => sortEvents.push([column, direction]))
        const header = wrapper.element.querySelector<HTMLElement>('[data-table-width-key="column:name"][aria-sort]')
        expect(header).not.toBeNull()

        header!.focus()
        expect(document.activeElement).toBe(header)
        await userEvent.keyboard(input)
        await nextTick()

        expect(sortEvents).toEqual([['name', 'asc']])
        expect(header!.getAttribute('aria-sort')).toBe('ascending')
    })

    it('updates keyboard availability, heading direction and visible row order when sorting is switched', async () => {
        const sortable = ref(true)
        const sortEvents: Array<[string, 'asc' | 'desc' | null]> = []
        const wrapper = mount(defineComponent({
            setup: () => () => h(DataTable<Row>, {
                data: rows,
                columns: columns.map((column) => ({ ...column, width: 120 })),
                rowKey: 'id',
                sortable: sortable.value,
                virtualScroll: layout.virtualScroll,
                onSort: (column, direction) => sortEvents.push([column, direction]),
            }),
        }))
        unmount = wrapper.unmount
        const header = wrapper.element.querySelector<HTMLElement>('[data-table-width-key="column:name"][aria-sort]')!
        const visibleRows = () => Array.from(
            wrapper.element.querySelectorAll('tbody td, [role="rowgroup"] [role="gridcell"]'),
            (cell) => cell.textContent?.trim(),
        )

        await expect.poll(visibleRows).toEqual(['Bob', 'Alice'])
        header.focus()
        await userEvent.keyboard('{Enter}')
        await expect.poll(visibleRows).toEqual(['Alice', 'Bob'])
        expect(header.getAttribute('aria-sort')).toBe('ascending')

        sortable.value = false
        await nextTick()
        await expect.poll(visibleRows).toEqual(['Bob', 'Alice'])
        expect(header.getAttribute('aria-sort')).toBe('none')
        expect(header.hasAttribute('tabindex')).toBe(false)

        sortable.value = true
        await nextTick()
        await expect.poll(visibleRows).toEqual(['Alice', 'Bob'])
        expect(header.getAttribute('aria-sort')).toBe('ascending')
        expect(header.getAttribute('tabindex')).toBe('0')
        expect(sortEvents).toEqual([['name', 'asc']])
    })
})
