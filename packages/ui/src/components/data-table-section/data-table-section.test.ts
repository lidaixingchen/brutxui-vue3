import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import DataTableSection from './DataTableSection.vue'
import type { ColumnDef } from './types'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

interface TestEmployee {
    name: string
    email: string
    role: string
}

const mockColumns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', sortable: true },
]

const mockRows: TestEmployee[] = [
    { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
    { name: 'Bob', email: 'bob@example.com', role: 'User' },
    { name: 'Charlie', email: 'charlie@example.com', role: 'Editor' },
]

// Helper to mount DataTableSection with proper generic typing
function mountDataTableSection(props?: Record<string, unknown>, options?: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic component requires cast for proper typing
    return mount(DataTableSection as any, {
        props,
        ...localeProvide,
        ...options,
    })
}

describe('DataTableSection', () => {
    it('renders with default props', () => {
        const wrapper = mountDataTableSection()
        expect(wrapper.find('h2').exists()).toBe(true)
    })

    it('renders custom title', () => {
        const wrapper = mountDataTableSection({ title: 'User List' })
        expect(wrapper.find('h2').text()).toBe('User List')
    })

    it('renders column headers', () => {
        const wrapper = mountDataTableSection({ columns: mockColumns })
        expect(wrapper.text()).toContain('Name')
        expect(wrapper.text()).toContain('Email')
        expect(wrapper.text()).toContain('Role')
    })

    it('renders rows', () => {
        const wrapper = mountDataTableSection({ columns: mockColumns, rows: mockRows })
        expect(wrapper.text()).toContain('Alice')
        expect(wrapper.text()).toContain('bob@example.com')
        expect(wrapper.text()).toContain('Editor')
    })

    it('shows search input when searchable is true', () => {
        const wrapper = mountDataTableSection({ searchable: true })
        expect(wrapper.find('input').exists()).toBe(true)
    })

    it('hides search input when searchable is false', () => {
        const wrapper = mountDataTableSection({ searchable: false })
        expect(wrapper.find('input').exists()).toBe(false)
    })

    it('emits sort event when sortable column header is clicked', async () => {
        const wrapper = mountDataTableSection({ columns: mockColumns, rows: mockRows })
        const headers = wrapper.findAll('th')
        await headers[0].trigger('click')
        expect(wrapper.emitted('sort')).toBeTruthy()
        expect(wrapper.emitted('sort')![0]).toEqual([{ key: 'name', direction: 'asc' }])
    })

    it('emits sort event when DataTable clears sort', async () => {
        const wrapper = mountDataTableSection({ columns: mockColumns, rows: mockRows })
        const headers = wrapper.findAll('th')

        await headers[0].trigger('click')
        await headers[0].trigger('click')
        await headers[0].trigger('click')

        expect(wrapper.emitted('sort')![2]).toEqual([{ key: 'name', direction: null }])
    })

    it('emits row-click event when a row is clicked', async () => {
        const wrapper = mountDataTableSection({ columns: mockColumns, rows: mockRows })
        const rows = wrapper.findAll('tbody tr')
        await rows[0].trigger('click')
        expect(wrapper.emitted('row-click')).toBeTruthy()
        expect(wrapper.emitted('row-click')![0]).toEqual([mockRows[0]])
    })

    it('shows no results message when rows are empty', () => {
        const wrapper = mountDataTableSection({ columns: mockColumns, rows: [] })
        expect(wrapper.text()).toContain('No matching results found')
    })

    it('applies custom class', () => {
        const wrapper = mountDataTableSection({ class: 'my-table' })
        expect(wrapper.classes()).toContain('my-table')
    })

    it('renders header slot', () => {
        const wrapper = mountDataTableSection(undefined, { slots: { header: '<div class="custom-header">Custom Header</div>' } })
        expect(wrapper.find('.custom-header').exists()).toBe(true)
    })

    it('renders footer slot', () => {
        const wrapper = mountDataTableSection(undefined, { slots: { footer: '<div class="custom-footer">Custom Footer</div>' } })
        expect(wrapper.find('.custom-footer').exists()).toBe(true)
    })

    it('renders default slot', () => {
        const wrapper = mountDataTableSection(undefined, { slots: { default: '<div class="custom-content">Custom Content</div>' } })
        expect(wrapper.find('.custom-content').exists()).toBe(true)
    })

    it('filters rows by search query', async () => {
        const wrapper = mountDataTableSection({ columns: mockColumns, rows: mockRows, searchable: true })
        const input = wrapper.find('input')
        await input.setValue('Alice')
        expect(wrapper.text()).toContain('Alice')
        expect(wrapper.text()).not.toContain('Bob')
    })

    it('shows pagination when total pages exceed 1', () => {
        const manyRows: TestEmployee[] = Array.from({ length: 15 }, (_, i) => ({
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            role: 'User',
        }))
        const wrapper = mountDataTableSection({ columns: mockColumns, rows: manyRows, pageSize: 10 })
        expect(wrapper.find('nav').exists()).toBe(true)
    })
})

// === Visual Compliance Tests (spec §7.5) ===

describe('DataTableSection visual compliance', () => {
    it('container has shadow-brutal-lg and rounded-brutal', () => {
        const wrapper = mountDataTableSection({ columns: mockColumns, rows: mockRows })
        expect(wrapper.classes()).toContain('shadow-brutal-lg')
        expect(wrapper.classes()).toContain('rounded-brutal')
    })

    it('container has border-3 border-brutal', () => {
        const wrapper = mountDataTableSection({ columns: mockColumns, rows: mockRows })
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
    })

    it('title area has border-b-3 separator', () => {
        const wrapper = mountDataTableSection({ title: 'Test Title', columns: mockColumns, rows: mockRows })
        const titleArea = wrapper.find('h2').element.parentElement
        expect(titleArea?.classList.contains('border-b-3')).toBe(true)
        expect(titleArea?.classList.contains('border-brutal')).toBe(true)
    })

    it('title uses font-black and tracking-tight', () => {
        const wrapper = mountDataTableSection({ title: 'Test Title' })
        const title = wrapper.find('h2')
        expect(title.classes()).toContain('font-black')
        expect(title.classes()).toContain('tracking-tight')
    })

    it('empty state uses text-brutal-fg not text-brutal-muted-foreground', () => {
        const wrapper = mountDataTableSection({ columns: mockColumns, rows: [] })
        const html = wrapper.html()
        expect(html).toContain('text-brutal-fg')
        expect(html).not.toContain('text-brutal-muted-foreground')
    })
})
