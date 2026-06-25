import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import DataTable from './DataTable.vue'

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
        const checkboxes = wrapper.findAll('input[type="checkbox"]')
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
                rowKey: (row: TestRow) => `row-${row.id}`,
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
})
