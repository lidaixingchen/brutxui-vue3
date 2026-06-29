import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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
    return mount(DataTable as unknown as Parameters<typeof mount>[0], {
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
            expect(btn.classes().join(' ')).toContain('active:translate-y-[var(--brutal-pressed-offset')
        })
    })

    it('filter input is rendered with Input component classes (border-3 border-brutal)', () => {
        const wrapper = mountDataTable({ data: testData, columns: testColumns, rowKey: 'id', filterable: true })
        const input = wrapper.find('input[type="text"]')
        expect(input.classes()).toContain('border-3')
        expect(input.classes()).toContain('border-brutal')
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

    function getExposed(wrapper: ReturnType<typeof mountDataTable>): DataTableExposed {
        return wrapper.vm as unknown as DataTableExposed
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
