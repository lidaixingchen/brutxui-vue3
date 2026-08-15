import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { vi, beforeEach, afterEach } from 'vitest'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import DataTable from './DataTable.vue'
import type { DataTableColumn, DataTableProps } from './types'

const globalProvide = { provide: { [LOCALE_INJECTION_KEY]: en } }

interface TestRow {
    id: number
    name: string
    email: string
    age: number
}

const testData: TestRow[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', age: 25 },
    { id: 2, name: 'Bob', email: 'bob@example.com', age: 30 },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
]

const testColumns: DataTableColumn<TestRow>[] = [
    { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
    { id: 'email', header: 'Email', accessorKey: 'email' },
    { id: 'age', header: 'Age', accessorKey: 'age', sortable: true, align: 'right' },
]

// Helper to mount DataTable with proper generic typing
function mountDataTable(props: Partial<DataTableProps<TestRow>> & { data: TestRow[]; columns: DataTableColumn<TestRow>[]; rowKey: keyof TestRow | ((row: TestRow) => string | number) }) {

    return mount(DataTable as any, {
        props: props as Record<string, unknown>,
        global: globalProvide,
    })
}

describe('DataTable', () => {
    it('renders with data', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
        })
        expect(wrapper.find('table').exists()).toBe(true)
        expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    })

    it('renders column headers', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
        })
        const headers = wrapper.findAll('th')
        expect(headers[0].text()).toBe('Name')
        expect(headers[1].text()).toBe('Email')
        expect(headers[2].text()).toBe('Age')
    })

    it('renders cell values', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
        })
        const rows = wrapper.findAll('tbody tr')
        expect(rows[0].findAll('td')[0].text()).toBe('Alice')
        expect(rows[0].findAll('td')[1].text()).toBe('alice@example.com')
        expect(rows[0].findAll('td')[2].text()).toBe('25')
    })

    it('shows empty message when no data', () => {
        const wrapper = mountDataTable({
            data: [],
            columns: testColumns,
            rowKey: 'id',
            emptyMessage: 'No records found',
        })
        expect(wrapper.text()).toContain('No records found')
    })

    it('applies custom class', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            class: 'custom-table',
        })
        expect(wrapper.classes()).toContain('custom-table')
    })

    it('has role="grid"', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
        })
        expect(wrapper.attributes('role')).toBe('grid')
    })

    it('renders checkbox when selectable', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            selectable: true,
        })
        const checkboxes = wrapper.findAll('[role="checkbox"]')
        expect(checkboxes.length).toBe(4) // 1 header + 3 rows
    })

    it('emits sort event when clicking sortable column', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            sortable: true,
        })
        const nameHeader = wrapper.findAll('th')[0]
        await nameHeader.trigger('click')
        expect(wrapper.emitted('sort')).toBeTruthy()
        expect(wrapper.emitted('sort')![0]).toEqual(['name', 'asc'])
    })

    it('renders pagination when paginated', () => {
        const largeData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            age: 20 + i,
        }))

        const wrapper = mountDataTable({
            data: largeData,
            columns: testColumns,
            rowKey: 'id',
            paginated: true,
            pageSize: 10,
        })
        expect(wrapper.findAll('tbody tr')).toHaveLength(10)
    })

    it('emits page-change event', async () => {
        const largeData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            age: 20 + i,
        }))

        const wrapper = mountDataTable({
            data: largeData,
            columns: testColumns,
            rowKey: 'id',
            paginated: true,
            pageSize: 10,
        })
        const nextButton = wrapper.find('button[aria-label="Next page"]')
        await nextButton.trigger('click')
        expect(wrapper.emitted('page-change')).toBeTruthy()
        expect(wrapper.emitted('page-change')![0]).toEqual([2])
    })

    it('shows loading overlay when loading', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            loading: true,
        })
        expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('renders hidden columns as hidden', () => {
        const columnsWithHidden: DataTableColumn<TestRow>[] = [
            ...testColumns,
            { id: 'hidden', header: 'Hidden', accessorKey: 'id', hidden: true },
        ]
        const wrapper = mountDataTable({
            data: testData,
            columns: columnsWithHidden,
            rowKey: 'id',
        })
        const headers = wrapper.findAll('th')
        expect(headers).toHaveLength(3) // Only visible columns
    })

    it('supports custom row key function', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: (row: TestRow) => `row-${row.id}`,
        })
        expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    })

    it('applies column alignment', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
        })
        const ageHeader = wrapper.findAll('th')[2]
        expect(ageHeader.classes()).toContain('text-right')
    })

    it('clamps current page when filter reduces total pages', async () => {
        const largeData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            age: 20 + i,
        }))

        const wrapper = mountDataTable({
            data: largeData,
            columns: testColumns,
            rowKey: 'id',
            paginated: true,
            filterable: true,
            pageSize: 10,
        })

        await wrapper.find('button[aria-label="Next page"]').trigger('click')
        await wrapper.find('button[aria-label="Next page"]').trigger('click')

        await wrapper.find('input[type="text"]').setValue('User 25')

        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.text()).toContain('User 25')
    })

    it('uses custom filter placeholder when provided', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            filterable: true,
            filterPlaceholder: 'Search section rows',
        })

        expect(wrapper.find('input[type="text"]').attributes('placeholder')).toBe('Search section rows')
        expect(wrapper.find('input[type="text"]').attributes('aria-label')).toBe('Search section rows')
    })
})

// === Visual / Behavior Tests (spec §7.3) ===

describe('DataTable visual compliance', () => {
    it('striped default true applies even:bg-brutal-muted/50 to rows', () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id' })
        const rows = wrapper.findAll('tbody tr')
        expect(rows[0].classes()).toContain('even:bg-brutal-muted/50')
    })

    it('striped false removes even:bg-brutal-muted/50 from rows', () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', striped: false })
        const rows = wrapper.findAll('tbody tr')
        expect(rows[0].classes()).not.toContain('even:bg-brutal-muted/50')
    })

    it('size="sm" applies py-2 to body cells', () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', size: 'sm' })
        const cell = wrapper.find('tbody td')
        expect(cell.classes()).toContain('py-2')
    })

    it('dense applies py-1.5 to body cells', () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', dense: true })
        const cell = wrapper.find('tbody td')
        expect(cell.classes()).toContain('py-1.5')
    })

    it('dense overrides size padding on cells', () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', size: 'sm', dense: true })
        const cell = wrapper.find('tbody td')
        expect(cell.classes()).toContain('py-1.5')
        expect(cell.classes()).not.toContain('py-2')
        expect(cell.classes()).not.toContain('py-3')
    })

    it('selected rows drop even:bg striping so selection background stays visible', async () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', selectable: true })
        // 选中偶数行（第一行）：even:bg-* 特异性高于 bg-brutal-primary，
        // 若条纹类仍存在，偶数行选中态背景会被条纹灰覆盖
        await wrapper.findAll('[role="checkbox"]')[1].trigger('click')
        const rows = wrapper.findAll('tbody tr')
        expect(rows[0].classes()).not.toContain('even:bg-brutal-muted/50')
        expect(rows[0].classes()).toContain('bg-brutal-primary')
        // 未选中行保留条纹
        expect(rows[2].classes()).toContain('even:bg-brutal-muted/50')
    })

    it('highlights active sort column header with bg-brutal-accent', async () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', sortable: true })
        await wrapper.findAll('th')[0].trigger('click')
        const nameHeader = wrapper.findAll('th')[0]
        expect(nameHeader.classes()).toContain('bg-brutal-accent')
    })

    it('highlights active sort column cells with bg-brutal-accent/20', async () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', sortable: true })
        await wrapper.findAll('th')[0].trigger('click')
        const rows = wrapper.findAll('tbody tr')
        rows.forEach(row => {
            const cells = row.findAll('td')
            expect(cells[0].classes()).toContain('bg-brutal-accent/20')
            expect(cells[1].classes()).not.toContain('bg-brutal-accent/20')
        })
    })

    it('pagination buttons have pressed feedback class', () => {
        const largeData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1, name: `User ${i + 1}`, email: `user${i + 1}@example.com`, age: 20 + i,
        }))
        const wrapper = mountDataTable({ data: largeData, columns: testColumns, rowKey: 'id', paginated: true, pageSize: 10 })
        const buttons = wrapper.findAll('button[aria-label]')
        expect(buttons.length).toBeGreaterThan(0)
        buttons.forEach(btn => {
            expect(btn.classes().join(' ')).toContain('active:translate-y-[var(--brutal-shadow-offset-y')
        })
    })

    it('filter input is rendered with Input component classes (border-3 border-brutal)', () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', filterable: true })
        const container = wrapper.find('.brutal-input-container')
        expect(container.classes()).toContain('border-3')
        expect(container.classes()).toContain('border-brutal')
    })

    it('export button renders as Button component after row selection', async () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', selectable: true, filterable: true })
        const rowCheckboxes = wrapper.findAll('[role="checkbox"]')
        await rowCheckboxes[1].trigger('click')
        await wrapper.vm.$nextTick()
        const exportBtn = wrapper.findAll('button').find(btn => btn.text().includes('Export CSV'))
        expect(exportBtn).toBeDefined()
        expect(exportBtn!.text()).toContain('Export CSV')
    })

    it('loading state has no backdrop-blur class', () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', loading: true })
        expect(wrapper.html()).not.toContain('backdrop-blur')
    })

    it('selection info bar has bg-brutal-primary and text-brutal-primary-foreground', async () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', selectable: true })
        const rowCheckboxes = wrapper.findAll('[role="checkbox"]')
        await rowCheckboxes[1].trigger('click')
        await wrapper.vm.$nextTick()
        expect(wrapper.html()).toContain('bg-brutal-primary text-brutal-primary-foreground')
    })

    it('stickyHeader applies sticky top-0 to thead', () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', stickyHeader: true })
        const thead = wrapper.find('thead')
        expect(thead.classes()).toContain('sticky')
        expect(thead.classes()).toContain('top-0')
    })
})

// === Style Guard: Neo-Brutalist anti-pattern regression (spec §7.4) ===
// Update these assertions when styles intentionally change.

describe('DataTable style guard', () => {
    function getAllClasses(html: string): string[] {
        const matches = [...html.matchAll(/class="([^"]*)"/g)]
        return matches.flatMap(m => m[1].split(/\s+/)).filter(Boolean)
    }

    function mountComprehensive() {
        const largeData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1, name: `User ${i + 1}`, email: `user${i + 1}@example.com`, age: 20 + i,
        }))
        return mountDataTable({
            data: largeData,
            columns: testColumns,
            rowKey: 'id',
            sortable: true,
            filterable: true,
            selectable: true,
            paginated: true,
            pageSize: 10,
            loading: true,
            size: 'sm',
            dense: true,
            striped: true,
            stickyHeader: true,
        })
    }

    it('no border-2 on main borders', () => {
        const classes = getAllClasses(mountComprehensive().html())
        expect(classes).not.toContain('border-2')
        expect(classes).not.toContain('border-t-2')
        expect(classes).not.toContain('border-b-2')
        expect(classes).not.toContain('border-r-2')
        expect(classes).not.toContain('border-l-2')
    })

    it('no backdrop-blur', () => {
        const classes = getAllClasses(mountComprehensive().html())
        expect(classes.some(c => c.startsWith('backdrop-blur'))).toBe(false)
    })

    it('no non-brutal shadows (shadow-md, shadow-lg)', () => {
        const classes = getAllClasses(mountComprehensive().html())
        expect(classes).not.toContain('shadow-md')
        expect(classes).not.toContain('shadow-lg')
    })

    it('no opacity-faded borders (border-brutal/number)', () => {
        const classes = getAllClasses(mountComprehensive().html())
        expect(classes.some(c => /^border-brutal\/\d/.test(c))).toBe(false)
    })

    it('no divide-y-2 or divide-brutal/', () => {
        const classes = getAllClasses(mountComprehensive().html())
        expect(classes).not.toContain('divide-y-2')
        expect(classes.some(c => c.startsWith('divide-brutal/'))).toBe(false)
    })
})

describe('DataTable programmatic control (defineExpose)', () => {
    type DataTableExposed = {
        sort: { toggleSort: (columnId: string) => void; sortState: { value: { column: string; direction: 'asc' | 'desc' | null } } }
        filter: { filterState: { value: { global: string } }; setGlobalFilter: (value: string) => void }
        selection: {
            toggleRow: (row: TestRow) => void
            toggleAllRows: () => void
            clearSelection: () => void
            getSelectedRows: () => TestRow[]
            selectedRows: { value: Set<string | number> }
            isAllSelected: { value: boolean }
        }
        pagination: {
            goToPage: (page: number) => boolean
            nextPage: () => void
            previousPage: () => void
            setPageSize: (size: number) => void
            pageIndex: { value: number }
            pageCount: { value: number }
        }
    }

    function assertDataTableExposed(vm: unknown): asserts vm is DataTableExposed {
        expect(vm).toHaveProperty('sort')
        expect(vm).toHaveProperty('pagination')
    }

    function getExposed(wrapper: ReturnType<typeof mountDataTable>): DataTableExposed {
        assertDataTableExposed(wrapper.vm)
        return wrapper.vm
    }

    it('exposes sort namespace with toggleSort and sortState', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            sortable: true,
        })
        const vm = getExposed(wrapper)
        expect(typeof vm.sort.toggleSort).toBe('function')
        expect(vm.sort.sortState).toBeDefined()
        expect(vm.sort.sortState.value.column).toBe('')
        expect(vm.sort.sortState.value.direction).toBeNull()
    })

    it('sort.toggleSort changes sort state programmatically', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            sortable: true,
        })
        const vm = getExposed(wrapper)
        expect(vm.sort.sortState.value.direction).toBeNull()
        vm.sort.toggleSort('name')
        await nextTick()
        expect(vm.sort.sortState.value.column).toBe('name')
        expect(vm.sort.sortState.value.direction).toBe('asc')
    })

    it('exposes filter namespace with filterState and setGlobalFilter', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            filterable: true,
        })
        const vm = getExposed(wrapper)
        expect(typeof vm.filter.setGlobalFilter).toBe('function')
        expect(vm.filter.filterState).toBeDefined()
        expect(vm.filter.filterState.value.global).toBe('')
        vm.filter.setGlobalFilter('alice')
        await nextTick()
        expect(vm.filter.filterState.value.global).toBe('alice')
    })

    it('exposes selection namespace with methods and refs', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            selectable: true,
        })
        const vm = getExposed(wrapper)
        expect(typeof vm.selection.toggleRow).toBe('function')
        expect(typeof vm.selection.toggleAllRows).toBe('function')
        expect(typeof vm.selection.clearSelection).toBe('function')
        expect(typeof vm.selection.getSelectedRows).toBe('function')
        expect(vm.selection.selectedRows).toBeDefined()
        expect(vm.selection.isAllSelected).toBeDefined()
    })

    it('selection.toggleRow selects a row programmatically', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            selectable: true,
        })
        const vm = getExposed(wrapper)
        vm.selection.toggleRow(testData[0])
        expect(vm.selection.getSelectedRows()).toHaveLength(1)
        expect(vm.selection.getSelectedRows()[0].id).toBe(1)
    })

    it('selection.clearSelection clears selected rows', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            selectable: true,
        })
        const vm = getExposed(wrapper)
        vm.selection.toggleRow(testData[0])
        expect(vm.selection.getSelectedRows()).toHaveLength(1)
        vm.selection.clearSelection()
        expect(vm.selection.getSelectedRows()).toHaveLength(0)
    })

    it('exposes pagination namespace with methods and refs', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            paginated: true,
            pageSize: 2,
        })
        const vm = getExposed(wrapper)
        expect(typeof vm.pagination.goToPage).toBe('function')
        expect(typeof vm.pagination.nextPage).toBe('function')
        expect(typeof vm.pagination.previousPage).toBe('function')
        expect(typeof vm.pagination.setPageSize).toBe('function')
        expect(vm.pagination.pageIndex).toBeDefined()
        expect(vm.pagination.pageCount).toBeDefined()
    })

    it('pagination exposes correct initial page index and count', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            paginated: true,
            pageSize: 2,
        })
        const vm = getExposed(wrapper)
        expect(vm.pagination.pageIndex.value).toBe(1)
        expect(vm.pagination.pageCount.value).toBe(2)
    })

    it('pagination.goToPage moves to the requested page', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            paginated: true,
            pageSize: 2,
        })
        const vm = getExposed(wrapper)
        vm.pagination.goToPage(2)
        await nextTick()
        expect(vm.pagination.pageIndex.value).toBe(2)
    })

    it('pagination.nextPage and previousPage navigate pages', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            paginated: true,
            pageSize: 2,
        })
        const vm = getExposed(wrapper)
        vm.pagination.nextPage()
        await nextTick()
        expect(vm.pagination.pageIndex.value).toBe(2)
        vm.pagination.previousPage()
        await nextTick()
        expect(vm.pagination.pageIndex.value).toBe(1)
    })

    it('pagination.setPageSize resets to first page', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns,
            rowKey: 'id',
            paginated: true,
            pageSize: 2,
        })
        const vm = getExposed(wrapper)
        vm.pagination.goToPage(2)
        await nextTick()
        expect(vm.pagination.pageIndex.value).toBe(2)
        vm.pagination.setPageSize(10)
        await nextTick()
        expect(vm.pagination.pageIndex.value).toBe(1)
        expect(vm.pagination.pageCount.value).toBe(1)
    })
})

describe('DataTable regression fixes', () => {
    const selectCols: DataTableColumn<TestRow>[] = [
        { id: 'name', header: 'Name', accessorKey: 'name' },
        { id: 'age', header: 'Age', accessorKey: 'age', filterType: 'select', filterOptions: [{ label: '25', value: 25 }, { label: '30', value: 30 }] },
    ]

    it('does not emit row-click when clicking interactive elements inside a row', async () => {
        const wrapper = mount(DataTable as any, {
            props: { data: testData, columns: testColumns, rowKey: 'id', rowClickable: true },
            slots: { 'cell-name': '<select aria-label="inline select"><option>X</option></select>' },
            global: globalProvide,
        })
        await wrapper.find('tbody select').trigger('click')
        expect(wrapper.emitted('row-click')).toBeUndefined()
        // 点击普通单元格仍触发
        await wrapper.findAll('tbody td')[1].trigger('click')
        expect(wrapper.emitted('row-click')).toHaveLength(1)
        wrapper.unmount()
    })

    it('keeps selection and page when data reference changes with same row keys', async () => {
        const largeData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1, name: `User ${i + 1}`, email: `user${i + 1}@example.com`, age: 20 + i,
        }))
        const wrapper = mountDataTable({
            data: largeData,
            columns: testColumns,
            rowKey: 'id',
            paginated: true,
            pageSize: 10,
            selectable: true,
        })
        await wrapper.findAll('[role="checkbox"]')[1].trigger('click')
        await wrapper.find('button[aria-label="Next page"]').trigger('click')
        await nextTick()
        expect((wrapper.vm as any).pagination.pageIndex.value).toBe(2)

        // 内容重组（引用变化、key 集合相同）：不重置选择与页码
        const reordered = [...largeData].reverse()
        await wrapper.setProps({ data: reordered })
        await nextTick()
        expect((wrapper.vm as any).selection.getSelectedRows()).toHaveLength(1)
        expect((wrapper.vm as any).pagination.pageIndex.value).toBe(2)
    })

    it('resets selection and page when rows are removed', async () => {
        const largeData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1, name: `User ${i + 1}`, email: `user${i + 1}@example.com`, age: 20 + i,
        }))
        const wrapper = mountDataTable({
            data: largeData,
            columns: testColumns,
            rowKey: 'id',
            paginated: true,
            pageSize: 10,
            selectable: true,
        })
        await wrapper.findAll('[role="checkbox"]')[1].trigger('click')
        await wrapper.find('button[aria-label="Next page"]').trigger('click')
        await nextTick()

        await wrapper.setProps({ data: largeData.slice(0, 20) })
        await nextTick()
        expect((wrapper.vm as any).selection.getSelectedRows()).toHaveLength(0)
        expect((wrapper.vm as any).pagination.pageIndex.value).toBe(1)
    })

    it('select filter accepts number values (type-preserving filter state)', async () => {
        // reka-ui SelectItem 在 happy-dom 下渲染抛错（既有环境限制），
        // 故此处直接验证还原后的 number 值在过滤链路中正常工作
        const wrapper = mountDataTable({ data: testData, columns: selectCols, rowKey: 'id', filterable: true })
        ;(wrapper.vm as any).filter.setFilterState({ global: '', columns: { age: 25 } })
        await nextTick()
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.text()).toContain('Alice')
    })

    it('text filter input shows stringified value for non-string filter state', async () => {
        const textCols: DataTableColumn<TestRow>[] = [
            { id: 'name', header: 'Name', accessorKey: 'name', filterType: 'text' },
        ]
        const wrapper = mountDataTable({ data: testData, columns: textCols, rowKey: 'id', filterable: true })
        ;(wrapper.vm as any).filter.setFilterState({ global: '', columns: { name: 123 } })
        await nextTick()
        await wrapper.get('[aria-label="Filter name"]').trigger('click')
        await nextTick()
        const content = document.body.querySelector<HTMLElement>('[role="dialog"]')
        const input = content?.querySelector<HTMLInputElement>('input')
        expect(input?.value).toBe('123')
        wrapper.unmount()
    })

    it('forces dynamic-height on VirtualScroll when expandable is combined with fixed rowHeight', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns.map(c => ({ ...c, width: 100 })),
            rowKey: 'id',
            expandable: true,
            virtualScroll: { enabled: true, rowHeight: 44 },
        })
        const vs = wrapper.findComponent({ name: 'VirtualScroll' })
        expect(vs.exists()).toBe(true)
        expect((vs as any).props('dynamicHeight')).toBe(true)
    })
})

describe('DataTable virtualScroll + spanMethod warning', () => {
    it('warns once that spanMethod is ignored in virtual scroll mode', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const wrapper = mountDataTable({
            data: testData,
            columns: testColumns.map(c => ({ ...c, width: 100 })),
            rowKey: 'id',
            virtualScroll: { enabled: true, rowHeight: 'auto' },
            spanMethod: () => undefined,
        })
        await nextTick()
        const spanWarns = warnSpy.mock.calls.filter(
            (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).includes('spanMethod'),
        )
        expect(spanWarns.length).toBeGreaterThanOrEqual(1)
        warnSpy.mockRestore()
        wrapper.unmount()
    })
})

describe('DataTable virtual scroll & column filtering options', () => {
    const filterColumns: DataTableColumn<TestRow>[] = [
        { id: 'name', header: 'Name', accessorKey: 'name', filterType: 'text' },
        { id: 'email', header: 'Email', accessorKey: 'email', filterType: 'select', filterOptions: [{ label: 'Alice', value: 'alice@example.com' }, { label: 'Bob', value: 'bob@example.com' }] },
        { id: 'age', header: 'Age', accessorKey: 'age', filterType: 'multi-select', filterOptions: [{ label: '25', value: 25 }, { label: '30', value: 30 }] },
    ]

    it('uses div layout and applies role="row" in virtual scroll mode', () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: filterColumns.map(c => ({ ...c, width: 100 })),
            rowKey: 'id',
            virtualScroll: { enabled: true, rowHeight: 'auto' },
        })
        expect(wrapper.find('table').exists()).toBe(false)
        expect(wrapper.find('[role="grid"]').exists()).toBe(true)
        expect(wrapper.html()).toContain('role="row"')
    })

    it('performs column text filtering correctly', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: filterColumns,
            rowKey: 'id',
            filterable: true,
        })
        const vm = wrapper.vm as any
        vm.filter.setFilterState({ global: '', columns: { name: 'Alice' } })
        await nextTick()
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.text()).toContain('Alice')
    })

    it('performs column select filtering correctly', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: filterColumns,
            rowKey: 'id',
            filterable: true,
        })
        const vm = wrapper.vm as any
        vm.filter.setFilterState({ global: '', columns: { email: 'bob@example.com' } })
        await nextTick()
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.text()).toContain('Bob')
    })

    it('performs column multi-select filtering correctly', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: filterColumns,
            rowKey: 'id',
            filterable: true,
        })
        const vm = wrapper.vm as any
        vm.filter.setFilterState({ global: '', columns: { age: [25, 35] } })
        await nextTick()
        // Alice (25) and Charlie (35) should remain
        expect(wrapper.findAll('tbody tr')).toHaveLength(2)
        expect(wrapper.text()).toContain('Alice')
        expect(wrapper.text()).toContain('Charlie')
    })

    it('performs column date-range filtering correctly', async () => {
        const dateData = [
            { id: 1, name: 'A', date: '2026-01-01' },
            { id: 2, name: 'B', date: '2026-06-01' },
            { id: 3, name: 'C', date: '2026-12-01' },
        ]
        const dateColumns = [
            { id: 'name', header: 'Name', accessorKey: 'name' },
            { id: 'date', header: 'Date', accessorKey: 'date', filterType: 'date-range' as const },
        ]
        const wrapper = mount(DataTable as any, {
            props: {
                data: dateData,
                columns: dateColumns,
                rowKey: 'id',
                filterable: true,
            },
            global: globalProvide,
        })
        const vm = wrapper.vm as any
        vm.filter.setFilterState({ global: '', columns: { date: { start: '2026-02-01', end: '2026-07-01' } } })
        await nextTick()
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.text()).toContain('B')
    })
})

describe('DataTable virtualScroll column width warning', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        warnSpy.mockRestore()
    })

    it('re-warns when a previously-removed column is re-added without width', async () => {
        // 列被动态移除再添加后，warnedColumns 应清除已移除列的记录，
        // 使警告在列重新出现时再次触发，避免警告永久静默。
        const cols: DataTableColumn<TestRow>[] = [
            { id: 'name', header: 'Name', accessorKey: 'name' },
        ]
        const wrapper = mountDataTable({
            data: testData,
            columns: cols,
            rowKey: 'id',
            virtualScroll: { enabled: true, rowHeight: 'auto' },
        })

        // 初次挂载：name 列无 width，应触发警告
        await nextTick()
        const firstCallCount = warnSpy.mock.calls.filter(
            (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).includes('Column "name"')
        ).length
        expect(firstCallCount).toBeGreaterThanOrEqual(1)

        // 改为有 width 的列：不再触发警告
        warnSpy.mockClear()
        await wrapper.setProps({ columns: [{ id: 'name', header: 'Name', accessorKey: 'name', width: 120 }] } as any)
        await nextTick()
        const noWarnCount = warnSpy.mock.calls.filter(
            (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).includes('Column "name"')
        ).length
        expect(noWarnCount).toBe(0)

        // 移除 name 列、添加 email 列（无 width）：应触发 email 列警告
        warnSpy.mockClear()
        await wrapper.setProps({ columns: [{ id: 'email', header: 'Email', accessorKey: 'email' }] } as any)
        await nextTick()
        const emailWarnCount = warnSpy.mock.calls.filter(
            (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).includes('Column "email"')
        ).length
        expect(emailWarnCount).toBeGreaterThanOrEqual(1)

        // 再次添加 name 列（无 width）：warnedColumns 已清除 name 的记录，应再次触发警告
        warnSpy.mockClear()
        await wrapper.setProps({ columns: [{ id: 'name', header: 'Name', accessorKey: 'name' }] } as any)
        await nextTick()
        const rewarnCount = warnSpy.mock.calls.filter(
            (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).includes('Column "name"')
        ).length
        expect(rewarnCount).toBeGreaterThanOrEqual(1)

        wrapper.unmount()
    })
})

// ── 列过滤 UI 交互（绑定链路：DataTableColumnFilter emit → DataTable setter → 过滤）──
// 原生表格与虚拟滚动两个分支都要覆盖，防止只读化后 v-model 绑定遗漏导致列过滤静默失效

describe('DataTable filter UI binding links', () => {
    const filterCols: DataTableColumn<TestRow>[] = [
        { id: 'name', header: 'Name', accessorKey: 'name', filterType: 'text' },
        { id: 'age', header: 'Age', accessorKey: 'age', filterType: 'multi-select', filterOptions: [{ label: '25', value: 25 }, { label: '30', value: 30 }] },
        { id: 'email', header: 'Email', accessorKey: 'email', filterType: 'date-range' },
    ]

    function openColumnFilter(wrapper: ReturnType<typeof mountDataTable>, columnId: string) {
        return wrapper.get(`[aria-label="Filter ${columnId}"]`).trigger('click')
    }

    function popoverInput(): HTMLInputElement {
        const content = document.body.querySelector<HTMLElement>('[role="dialog"]')
        const input = content?.querySelector<HTMLInputElement>('input')
        if (!input) throw new Error('filter popover input not found')
        return input
    }

    it('global search input drives filtered rows via setGlobalFilter', async () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', filterable: true })
        const input = wrapper.find<HTMLInputElement>('input[placeholder="Filter..."]')
        expect(input.exists()).toBe(true)
        await input.setValue('alice')
        await nextTick()
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.text()).toContain('Alice')
    })

    it('native table: text column filter via popover UI', async () => {
        const wrapper = mountDataTable({ data: testData, columns: filterCols, rowKey: 'id', filterable: true })
        await openColumnFilter(wrapper, 'name')
        await nextTick()
        const input = popoverInput()
        input.value = 'Bob'
        input.dispatchEvent(new Event('input'))
        await nextTick()
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.text()).toContain('Bob')
        wrapper.unmount()
    })

    it('virtual scroll: text column filter via popover UI', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: filterCols.map((c) => ({ ...c, width: 100 })),
            rowKey: 'id',
            filterable: true,
            virtualScroll: { enabled: true, rowHeight: 'auto' },
        })
        await openColumnFilter(wrapper, 'name')
        await nextTick()
        const input = popoverInput()
        input.value = 'Alice'
        input.dispatchEvent(new Event('input'))
        await nextTick()
        expect(wrapper.findAll('[role="row"]')).toHaveLength(1)
        wrapper.unmount()
    })

    it('virtual scroll: column filter does not reset global search', async () => {
        const wrapper = mountDataTable({
            data: testData,
            columns: filterCols.map((c) => ({ ...c, width: 100 })),
            rowKey: 'id',
            filterable: true,
            virtualScroll: { enabled: true, rowHeight: 'auto' },
        })
        // 先设全局搜索 Bob → 1 行
        const search = wrapper.find<HTMLInputElement>('input[placeholder="Filter..."]')
        await search.setValue('Bob')
        await nextTick()
        expect(wrapper.findAll('[role="row"]')).toHaveLength(1)

        // 再设 age 多选过滤 = 25（Alice）：global='Bob' AND age=25 → 0 行。
        // 若虚拟滚动分支仍绑定 setFilterState（整体替换），global 会被重置为 '',
        // 只剩 age=25 → Alice 1 行——该断言即暴露此回归
        await openColumnFilter(wrapper, 'age')
        await nextTick()
        const content = document.body.querySelector<HTMLElement>('[role="dialog"]')
        expect(content).not.toBeNull()
        const checkboxes = content!.querySelectorAll<HTMLElement>('[role="checkbox"]')
        checkboxes[0].click()
        await nextTick()
        // global='Bob' AND age=25 → 0 数据行 → 虚拟滚动渲染空态。
        // 虚拟滚动布局为「表头（1 role=row）+ 内容行（此处空态 1 role=row）」共 2 行。
        // 若虚拟滚动分支仍用 setFilterState 整体替换（513 bug），global 被重置为 '',
        // 只剩 age=25 → 渲染 Alice 数据行（而非空态）——文本断言即暴露回归
        expect(wrapper.findAll('[role="row"]')).toHaveLength(2)
        expect(wrapper.text()).not.toContain('Alice')
        // 关闭 popover（reka-ui dismissable 监听 outside pointerdown），避免 teleport 残留污染后续测试
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }))
        await nextTick()
        wrapper.unmount()
    })

    it('native table: multi-select column filter via popover UI', async () => {
        const wrapper = mountDataTable({ data: testData, columns: filterCols, rowKey: 'id', filterable: true })
        await openColumnFilter(wrapper, 'age')
        await nextTick()
        const content = document.body.querySelector<HTMLElement>('[role="dialog"]')
        expect(content).not.toBeNull()
        const checkboxes = content!.querySelectorAll<HTMLElement>('[role="checkbox"]')
        expect(checkboxes.length).toBeGreaterThan(0)
        // 勾选 25 → 仅 Alice
        checkboxes[0].click()
        await nextTick()
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.text()).toContain('Alice')
        wrapper.unmount()
    })

    it('native table: date-range column filter via popover UI', async () => {
        const dateData = [
            { id: 1, name: 'A', email: 'a@example.com', age: 20, date: '2026-01-01' },
            { id: 2, name: 'B', email: 'b@example.com', age: 30, date: '2026-06-01' },
        ]
        const cols: DataTableColumn<TestRow & { date: string }>[] = [
            { id: 'name', header: 'Name', accessorKey: 'name' },
            { id: 'date', header: 'Date', accessorKey: 'date', filterType: 'date-range' as const },
        ]
        const wrapper = mountDataTable({
            data: dateData,
            columns: cols as unknown as DataTableColumn<TestRow>[],
            rowKey: 'id',
            filterable: true,
        })
        await openColumnFilter(wrapper, 'date')
        await nextTick()
        const inputs = document.body.querySelectorAll<HTMLInputElement>('[role="dialog"] input')
        expect(inputs.length).toBe(2)
        // 两次输入之间 flush 一次，对应真实用户先填 start 再填 end 的时序路径；
        // 同一 tick 同步连续触发由下方 "same-tick triggers" 测试锁定
        inputs[0].value = '2026-02-01'
        inputs[0].dispatchEvent(new Event('input'))
        await nextTick()
        inputs[1].value = '2026-07-01'
        inputs[1].dispatchEvent(new Event('input'))
        await nextTick()
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.text()).toContain('B')
        wrapper.unmount()
    })

    it('native table: date-range same-tick start/end triggers keep both bounds', async () => {
        // start/end 在同一 tick 内同步连续触发（程序化/自动化驱动）时，
        // 父级按列函数式合并 + 子组件 pending 缓冲保证两个边界都不丢失。
        // 数据设计：A 早于范围、B 在范围内、C 晚于范围——任一边界丢失都会导致行数偏差
        const dateData = [
            { id: 1, name: 'A', email: 'a@example.com', age: 20, date: '2026-01-01' },
            { id: 2, name: 'B', email: 'b@example.com', age: 30, date: '2026-06-01' },
            { id: 3, name: 'C', email: 'c@example.com', age: 40, date: '2026-12-01' },
        ]
        const cols: DataTableColumn<TestRow & { date: string }>[] = [
            { id: 'name', header: 'Name', accessorKey: 'name' },
            { id: 'date', header: 'Date', accessorKey: 'date', filterType: 'date-range' as const },
        ]
        const wrapper = mountDataTable({
            data: dateData,
            columns: cols as unknown as DataTableColumn<TestRow>[],
            rowKey: 'id',
            filterable: true,
        })
        await openColumnFilter(wrapper, 'date')
        await nextTick()
        const inputs = document.body.querySelectorAll<HTMLInputElement>('[role="dialog"] input')
        expect(inputs.length).toBe(2)
        // 同步连续触发，两次输入之间不 flush
        inputs[0].value = '2026-02-01'
        inputs[0].dispatchEvent(new Event('input'))
        inputs[1].value = '2026-07-01'
        inputs[1].dispatchEvent(new Event('input'))
        await nextTick()
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.text()).toContain('B')
        wrapper.unmount()
    })
})
