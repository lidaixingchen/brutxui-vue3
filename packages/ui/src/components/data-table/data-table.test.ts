import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import DataTable from './DataTable.vue'

const globalProvide = { provide: { [LOCALE_INJECTION_KEY]: en } }

interface TestRow extends Record<string, unknown> {
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

const testColumns = [
    { id: 'name', header: 'Name', accessorKey: 'name' as const, sortable: true },
    { id: 'email', header: 'Email', accessorKey: 'email' as const },
    { id: 'age', header: 'Age', accessorKey: 'age' as const, sortable: true, align: 'right' as const },
]

describe('DataTable', () => {
    it('renders with data', () => {
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: testColumns,
                rowKey: 'id',
            },
            global: globalProvide,
        })
        expect(wrapper.find('table').exists()).toBe(true)
        expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    })

    it('renders column headers', () => {
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: testColumns,
                rowKey: 'id',
            },
            global: globalProvide,
        })
        const headers = wrapper.findAll('th')
        expect(headers[0].text()).toBe('Name')
        expect(headers[1].text()).toBe('Email')
        expect(headers[2].text()).toBe('Age')
    })

    it('renders cell values', () => {
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: testColumns,
                rowKey: 'id',
            },
            global: globalProvide,
        })
        const rows = wrapper.findAll('tbody tr')
        expect(rows[0].findAll('td')[0].text()).toBe('Alice')
        expect(rows[0].findAll('td')[1].text()).toBe('alice@example.com')
        expect(rows[0].findAll('td')[2].text()).toBe('25')
    })

    it('shows empty message when no data', () => {
        const wrapper = mount(DataTable, {
            props: {
                data: [],
                columns: testColumns,
                rowKey: 'id',
                emptyMessage: 'No records found',
            },
            global: globalProvide,
        })
        expect(wrapper.text()).toContain('No records found')
    })

    it('applies custom class', () => {
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: testColumns,
                rowKey: 'id',
                class: 'custom-table',
            },
            global: globalProvide,
        })
        expect(wrapper.classes()).toContain('custom-table')
    })

    it('has role="grid"', () => {
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: testColumns,
                rowKey: 'id',
            },
            global: globalProvide,
        })
        expect(wrapper.attributes('role')).toBe('grid')
    })

    it('renders checkbox when selectable', () => {
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: testColumns,
                rowKey: 'id',
                selectable: true,
            },
            global: globalProvide,
        })
        const checkboxes = wrapper.findAll('[role="checkbox"]')
        expect(checkboxes.length).toBe(4) // 1 header + 3 rows
    })

    it('emits sort event when clicking sortable column', async () => {
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: testColumns,
                rowKey: 'id',
                sortable: true,
            },
            global: globalProvide,
        })
        const nameHeader = wrapper.findAll('th')[0]
        await nameHeader.trigger('click')
        expect(wrapper.emitted('sort')).toBeTruthy()
        expect(wrapper.emitted('sort')![0]).toEqual(['name', 'asc'])
    })

    it('renders pagination when paginated', () => {
        const largeData = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            age: 20 + i,
        }))

        const wrapper = mount(DataTable, {
            props: {
                data: largeData,
                columns: testColumns,
                rowKey: 'id',
                paginated: true,
                pageSize: 10,
            },
            global: globalProvide,
        })
        expect(wrapper.findAll('tbody tr')).toHaveLength(10)
    })

    it('emits pageChange event', async () => {
        const largeData = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            age: 20 + i,
        }))

        const wrapper = mount(DataTable, {
            props: {
                data: largeData,
                columns: testColumns,
                rowKey: 'id',
                paginated: true,
                pageSize: 10,
            },
            global: globalProvide,
        })
        const nextButton = wrapper.find('button[aria-label="Next page"]')
        await nextButton.trigger('click')
        expect(wrapper.emitted('pageChange')).toBeTruthy()
        expect(wrapper.emitted('pageChange')![0]).toEqual([2])
    })

    it('shows loading overlay when loading', () => {
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: testColumns,
                rowKey: 'id',
                loading: true,
            },
            global: globalProvide,
        })
        expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('renders hidden columns as hidden', () => {
        const columnsWithHidden = [
            ...testColumns,
            { id: 'hidden', header: 'Hidden', accessorKey: 'id' as const, hidden: true },
        ]
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: columnsWithHidden,
                rowKey: 'id',
            },
            global: globalProvide,
        })
        const headers = wrapper.findAll('th')
        expect(headers).toHaveLength(3) // Only visible columns
    })

    it('supports custom row key function', () => {
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: testColumns,
                rowKey: (row: Record<string, unknown>) => `row-${(row as TestRow).id}`,
            },
            global: globalProvide,
        })
        expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    })

    it('applies column alignment', () => {
        const wrapper = mount(DataTable, {
            props: {
                data: testData,
                columns: testColumns,
                rowKey: 'id',
            },
            global: globalProvide,
        })
        const ageHeader = wrapper.findAll('th')[2]
        expect(ageHeader.classes()).toContain('text-right')
    })

    it('clamps current page when filter reduces total pages', async () => {
        const largeData = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            age: 20 + i,
        }))

        const wrapper = mount(DataTable, {
            props: {
                data: largeData,
                columns: testColumns,
                rowKey: 'id',
                paginated: true,
                filterable: true,
                pageSize: 10,
            },
            global: globalProvide,
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
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id' },
            global: globalProvide,
        })
        const rows = wrapper.findAll('tbody tr')
        expect(rows[0].classes()).toContain('even:bg-brutal-muted/50')
    })

    it('striped false removes even:bg-brutal-muted/50 from rows', () => {
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id', striped: false },
            global: globalProvide,
        })
        const rows = wrapper.findAll('tbody tr')
        expect(rows[0].classes()).not.toContain('even:bg-brutal-muted/50')
    })

    it('size="sm" applies py-2 to body cells', () => {
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id', size: 'sm' },
            global: globalProvide,
        })
        const cell = wrapper.find('tbody td')
        expect(cell.classes()).toContain('py-2')
    })

    it('dense applies py-1.5 to body cells', () => {
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id', dense: true },
            global: globalProvide,
        })
        const cell = wrapper.find('tbody td')
        expect(cell.classes()).toContain('py-1.5')
    })

    it('highlights active sort column header with bg-brutal-accent', async () => {
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id', sortable: true },
            global: globalProvide,
        })
        await wrapper.findAll('th')[0].trigger('click')
        const nameHeader = wrapper.findAll('th')[0]
        expect(nameHeader.classes()).toContain('bg-brutal-accent')
    })

    it('highlights active sort column cells with bg-brutal-accent/20', async () => {
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id', sortable: true },
            global: globalProvide,
        })
        await wrapper.findAll('th')[0].trigger('click')
        const rows = wrapper.findAll('tbody tr')
        rows.forEach(row => {
            const cells = row.findAll('td')
            expect(cells[0].classes()).toContain('bg-brutal-accent/20')
            expect(cells[1].classes()).not.toContain('bg-brutal-accent/20')
        })
    })

    it('pagination buttons have pressed feedback class', () => {
        const largeData = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1, name: `User ${i + 1}`, email: `user${i + 1}@example.com`, age: 20 + i,
        }))
        const wrapper = mount(DataTable, {
            props: { data: largeData, columns: testColumns, rowKey: 'id', paginated: true, pageSize: 10 },
            global: globalProvide,
        })
        const buttons = wrapper.findAll('button[aria-label]')
        expect(buttons.length).toBeGreaterThan(0)
        buttons.forEach(btn => {
            expect(btn.classes().join(' ')).toContain('active:translate-y-[var(--brutal-pressed-offset')
        })
    })

    it('filter input is rendered with Input component classes (border-3 border-brutal)', () => {
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id', filterable: true },
            global: globalProvide,
        })
        const input = wrapper.find('input[type="text"]')
        expect(input.classes()).toContain('border-3')
        expect(input.classes()).toContain('border-brutal')
    })

    it('export button renders as Button component after row selection', async () => {
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id', selectable: true, filterable: true },
            global: globalProvide,
        })
        expect(wrapper.find('button').exists()).toBe(false)
        const rowCheckboxes = wrapper.findAll('[role="checkbox"]')
        const checkboxEl = rowCheckboxes[1].element as HTMLInputElement
        checkboxEl.checked = true
        await rowCheckboxes[1].trigger('change')
        const exportBtn = wrapper.find('button')
        expect(exportBtn.exists()).toBe(true)
        expect(exportBtn.text()).toContain('Export CSV')
    })

    it('loading state has no backdrop-blur class', () => {
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id', loading: true },
            global: globalProvide,
        })
        expect(wrapper.html()).not.toContain('backdrop-blur')
    })

    it('selection info bar has bg-brutal-primary and text-brutal-primary-foreground', async () => {
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id', selectable: true },
            global: globalProvide,
        })
        const rowCheckboxes = wrapper.findAll('[role="checkbox"]')
        const checkboxEl = rowCheckboxes[1].element as HTMLInputElement
        checkboxEl.checked = true
        await rowCheckboxes[1].trigger('change')
        expect(wrapper.html()).toContain('border-t-3 border-brutal bg-brutal-primary text-brutal-primary-foreground')
    })

    it('stickyHeader applies sticky top-0 to thead', () => {
        const wrapper = mount(DataTable, {
            props: { data: testData, columns: testColumns, rowKey: 'id', stickyHeader: true },
            global: globalProvide,
        })
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
        const largeData = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1, name: `User ${i + 1}`, email: `user${i + 1}@example.com`, age: 20 + i,
        }))
        return mount(DataTable, {
            props: {
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
            },
            global: globalProvide,
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
