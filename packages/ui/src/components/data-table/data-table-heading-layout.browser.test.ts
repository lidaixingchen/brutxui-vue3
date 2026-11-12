import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { nextTick } from 'vue'
import { mount } from '@/test/browser-mount'
import DataTable from './DataTable.vue'
import type { DataTableColumn } from './types'
import '../../../dist/styles.css'

const COMPACT_VIEWPORT_WIDTH_PX = 320
const NARROW_VIEWPORT_WIDTH_PX = 390
const VIEWPORT_HEIGHT_PX = 844
const MAIN_PADDING_PX = 16
const LONG_TEXT_REPEAT_COUNT = 12
const LONG_CELL_TEXT_REPEAT_COUNT = 300
const LAYOUT_TOLERANCE_PX = 1

const viewportWidths = [COMPACT_VIEWPORT_WIDTH_PX, NARROW_VIEWPORT_WIDTH_PX] as const

const copyCases = [
    {
        name: 'long English copy',
        title: 'QuarterlyRevenueReconciliationDashboardWithoutSpaces',
        description: 'A'.repeat(300),
    },
    {
        name: 'long Chinese copy',
        title: '季度收入核对数据看板与经营复盘报告'.repeat(LONG_TEXT_REPEAT_COUNT),
        description: '本季度收入按照地区进行汇总并核对预算与实际数据差异。'.repeat(LONG_TEXT_REPEAT_COUNT),
    },
    {
        name: 'short copy',
        title: 'Revenue',
        description: 'Quarterly totals',
    },
] as const

interface Row {
    id: number
    name: string
}

const rows: Row[] = [{ id: 1, name: 'Alice' }]
const columns: DataTableColumn<Row>[] = [
    { id: 'name', header: 'Name', accessorKey: 'name' },
]

let unmount: (() => void) | null = null
let main: HTMLElement | null = null

afterEach(() => {
    unmount?.()
    unmount = null
    main?.remove()
    main = null
})

function createMain(): HTMLElement {
    main = document.createElement('main')
    main.style.width = '100%'
    main.style.padding = `${MAIN_PADDING_PX}px`
    main.style.boxSizing = 'border-box'
    document.body.appendChild(main)
    return main
}

function getTextLineRects(element: HTMLElement): DOMRect[] {
    const range = document.createRange()
    range.selectNodeContents(element)
    return Array.from(range.getClientRects())
}

function mountDataTable(props: { title: string; description: string; columns?: DataTableColumn<Row>[]; data?: Row[] }) {
    const { columns: tableColumns = columns, data = rows, title, description } = props
    const wrapper = mount(DataTable, {
        props: {
            data,
            columns: tableColumns,
            rowKey: 'id',
            paginated: false,
            title,
            description,
        },
        attachTo: createMain(),
    })
    unmount = wrapper.unmount
    return wrapper
}

describe.each(viewportWidths)('DataTable heading layout at %spx viewport', (viewportWidth) => {
    it.each(copyCases)('$name wraps within the table while retaining all text', async ({ title, description }) => {
        await page.viewport(viewportWidth, VIEWPORT_HEIGHT_PX)
        const wrapper = mountDataTable({ title, description })
        await nextTick()

        const root = wrapper.element as HTMLElement
        const heading = root.querySelector<HTMLElement>('h2')
        const summary = root.querySelector<HTMLElement>('p')

        expect(root.getAttribute('role')).toBe('grid')
        expect(heading?.textContent).toBe(title)
        expect(summary?.textContent).toBe(description)

        const overflowingCopy = [heading, summary].filter((element): element is HTMLElement => {
            if (!element) return false
            const elementRight = element.getBoundingClientRect().right + LAYOUT_TOLERANCE_PX
            return element.scrollWidth > element.clientWidth
                || getTextLineRects(element).some(line => line.right > elementRight)
        })

        expect(overflowingCopy).toEqual([])
        expect(root.getBoundingClientRect().left).toBeGreaterThanOrEqual(MAIN_PADDING_PX)
        expect(root.getBoundingClientRect().right).toBeLessThanOrEqual(viewportWidth - MAIN_PADDING_PX)
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(viewportWidth)
    })
})

describe('DataTable body horizontal scrolling in a browser', () => {
    it('keeps the native table body horizontally scrollable within its own region', async () => {
        await page.viewport(COMPACT_VIEWPORT_WIDTH_PX, VIEWPORT_HEIGHT_PX)
        const wrapper = mountDataTable({
            title: 'Revenue',
            description: 'Quarterly totals',
            data: [{ id: 1, name: 'A'.repeat(LONG_CELL_TEXT_REPEAT_COUNT) }],
        })
        await nextTick()

        const horizontalScroll = wrapper.element.querySelector<HTMLElement>('[data-table-horizontal-scroll]')!
        horizontalScroll.scrollLeft = horizontalScroll.scrollWidth

        expect(horizontalScroll.scrollWidth).toBeGreaterThan(horizontalScroll.clientWidth)
        expect(horizontalScroll.scrollLeft).toBeGreaterThan(0)
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(COMPACT_VIEWPORT_WIDTH_PX)
    })
})
