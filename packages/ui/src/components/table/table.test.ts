import { mount } from '@vue/test-utils'
import Table from './Table.vue'
import TableHeader from './TableHeader.vue'
import TableBody from './TableBody.vue'
import TableFooter from './TableFooter.vue'
import TableRow from './TableRow.vue'
import TableHead from './TableHead.vue'
import TableCell from './TableCell.vue'
import TableCaption from './TableCaption.vue'

describe('Table', () => {
    it('renders with default props', () => {
        const wrapper = mount(Table)
        const table = wrapper.find('table')
        expect(table.exists()).toBe(true)
        expect(table.classes()).toContain('w-full')
        expect(table.classes()).toContain('caption-bottom')
        expect(table.classes()).toContain('text-sm')
        expect(table.classes()).toContain('border-3')
        expect(table.classes()).toContain('border-brutal')
    })

    it('renders slot content', () => {
        const wrapper = mount(Table, {
            slots: { default: '<tbody><tr><td>Data</td></tr></tbody>' },
        })
        expect(wrapper.find('table').text()).toBe('Data')
    })

    it('wraps table in container with overflow-x-auto', () => {
        const wrapper = mount(Table)
        const container = wrapper.find('div')
        expect(container.exists()).toBe(true)
        expect(container.classes()).toContain('relative')
        expect(container.classes()).toContain('w-full')
        expect(container.classes()).toContain('overflow-x-auto')
    })

    it('applies custom class', () => {
        const wrapper = mount(Table, { props: { class: 'my-table' } })
        expect(wrapper.find('table').classes()).toContain('my-table')
    })

    it('passes ariaLabel to table aria-label attribute', () => {
        const wrapper = mount(Table, { props: { ariaLabel: '用户列表' } })
        expect(wrapper.find('table').attributes('aria-label')).toBe('用户列表')
    })

    it('does not render aria-label when ariaLabel is not provided', () => {
        const wrapper = mount(Table)
        expect(wrapper.find('table').attributes('aria-label')).toBeUndefined()
    })
})

describe('TableHeader', () => {
    it('renders slot content', () => {
        const wrapper = mount(TableHeader, {
            slots: { default: '<tr><th>Col</th></tr>' },
        })
        expect(wrapper.text()).toBe('Col')
    })

    it('renders thead element', () => {
        const wrapper = mount(TableHeader)
        expect(wrapper.element.tagName).toBe('THEAD')
    })

    it('applies default variant classes', () => {
        const wrapper = mount(TableHeader)
        expect(wrapper.classes()).toContain('[&_tr]:border-b-3')
        expect(wrapper.classes()).toContain('[&_tr]:border-brutal')
        expect(wrapper.classes()).toContain('bg-brutal-accent')
        expect(wrapper.classes()).toContain('text-brutal-accent-foreground')
    })

    it('applies primary variant classes', () => {
        const wrapper = mount(TableHeader, { props: { variant: 'primary' } })
        expect(wrapper.classes()).toContain('bg-brutal-primary')
        expect(wrapper.classes()).toContain('text-brutal-primary-foreground')
    })

    it('applies secondary variant classes', () => {
        const wrapper = mount(TableHeader, { props: { variant: 'secondary' } })
        expect(wrapper.classes()).toContain('bg-brutal-secondary')
        expect(wrapper.classes()).toContain('text-brutal-secondary-foreground')
    })

    it('applies custom class and merges properly', () => {
        const wrapper = mount(TableHeader, { props: { class: 'my-thead bg-red-500' } })
        expect(wrapper.classes()).toContain('my-thead')
        expect(wrapper.classes()).toContain('bg-red-500')
        expect(wrapper.classes()).not.toContain('bg-brutal-accent')
    })
})

describe('TableBody', () => {
    it('renders slot content', () => {
        const wrapper = mount(TableBody, {
            slots: { default: '<tr><td>Row</td></tr>' },
        })
        expect(wrapper.text()).toBe('Row')
    })

    it('renders tbody element', () => {
        const wrapper = mount(TableBody)
        expect(wrapper.element.tagName).toBe('TBODY')
    })

    it('applies default classes from tableBodyVariants', () => {
        const wrapper = mount(TableBody)
        expect(wrapper.classes()).toContain('[&>tr:last-child]:border-0')
        expect(wrapper.classes()).toContain('[&>tr:nth-child(even)]:bg-brutal-muted')
    })

    it('applies custom class', () => {
        const wrapper = mount(TableBody, { props: { class: 'my-tbody' } })
        expect(wrapper.classes()).toContain('my-tbody')
        expect(wrapper.classes()).toContain('[&>tr:last-child]:border-0')
    })
})

describe('TableFooter', () => {
    it('renders slot content', () => {
        const wrapper = mount(TableFooter, {
            slots: { default: '<tr><td>Footer</td></tr>' },
        })
        expect(wrapper.text()).toBe('Footer')
    })

    it('renders tfoot element', () => {
        const wrapper = mount(TableFooter)
        expect(wrapper.element.tagName).toBe('TFOOT')
    })

    it('applies default variant classes with fixed last-child selector', () => {
        const wrapper = mount(TableFooter)
        expect(wrapper.classes()).toContain('border-t-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('font-bold')
        expect(wrapper.classes()).toContain('[&>tr:last-child]:border-b-0')
        expect(wrapper.classes()).toContain('bg-brutal-secondary')
        expect(wrapper.classes()).toContain('text-brutal-secondary-foreground')
    })

    it('applies primary variant classes', () => {
        const wrapper = mount(TableFooter, { props: { variant: 'primary' } })
        expect(wrapper.classes()).toContain('bg-brutal-primary')
        expect(wrapper.classes()).toContain('text-brutal-primary-foreground')
    })

    it('applies accent variant classes', () => {
        const wrapper = mount(TableFooter, { props: { variant: 'accent' } })
        expect(wrapper.classes()).toContain('bg-brutal-accent')
        expect(wrapper.classes()).toContain('text-brutal-accent-foreground')
    })

    it('applies custom class', () => {
        const wrapper = mount(TableFooter, { props: { class: 'my-tfoot' } })
        expect(wrapper.classes()).toContain('my-tfoot')
    })
})

describe('TableRow', () => {
    it('renders slot content', () => {
        const wrapper = mount(TableRow, {
            slots: { default: '<td>Cell</td>' },
        })
        expect(wrapper.text()).toBe('Cell')
    })

    it('renders tr element', () => {
        const wrapper = mount(TableRow)
        expect(wrapper.element.tagName).toBe('TR')
    })

    it('applies default row classes', () => {
        const wrapper = mount(TableRow)
        expect(wrapper.classes()).toContain('border-b-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('transition-colors')
        expect(wrapper.classes()).toContain('text-brutal-fg')
        expect(wrapper.classes()).toContain('hover:bg-brutal-muted')
        expect(wrapper.classes()).toContain('data-[state=selected]:bg-brutal-primary/15')
    })

    it('applies custom class', () => {
        const wrapper = mount(TableRow, { props: { class: 'my-row' } })
        expect(wrapper.classes()).toContain('my-row')
    })
})

describe('TableHead', () => {
    it('renders slot content', () => {
        const wrapper = mount(TableHead, {
            slots: { default: 'Header' },
        })
        expect(wrapper.text()).toBe('Header')
    })

    it('renders th element with scope="col" by default', () => {
        const wrapper = mount(TableHead)
        expect(wrapper.element.tagName).toBe('TH')
        expect(wrapper.attributes('scope')).toBe('col')
    })

    it('allows overriding scope attribute', () => {
        const wrapper = mount(TableHead, {
            attrs: { scope: 'row' },
        })
        expect(wrapper.attributes('scope')).toBe('row')
    })

    it('applies default variant classes', () => {
        const wrapper = mount(TableHead)
        expect(wrapper.classes()).toContain('h-12')
        expect(wrapper.classes()).toContain('px-4')
        expect(wrapper.classes()).toContain('text-left')
        expect(wrapper.classes()).toContain('align-middle')
        expect(wrapper.classes()).toContain('font-black')
        expect(wrapper.classes()).toContain('tracking-wide')
        expect(wrapper.classes()).toContain('[&:has([role=checkbox])]:pr-0')
        expect(wrapper.classes()).toContain('border-r-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('last:border-r-0')
        expect(wrapper.classes()).toContain('bg-brutal-accent')
        expect(wrapper.classes()).toContain('text-brutal-accent-foreground')
    })

    it('applies primary variant classes', () => {
        const wrapper = mount(TableHead, { props: { variant: 'primary' } })
        expect(wrapper.classes()).toContain('bg-brutal-primary')
        expect(wrapper.classes()).toContain('text-brutal-primary-foreground')
    })

    it('applies secondary variant classes', () => {
        const wrapper = mount(TableHead, { props: { variant: 'secondary' } })
        expect(wrapper.classes()).toContain('bg-brutal-secondary')
        expect(wrapper.classes()).toContain('text-brutal-secondary-foreground')
    })

    it('applies custom class and merges properly', () => {
        const wrapper = mount(TableHead, { props: { class: 'my-th bg-red-500' } })
        expect(wrapper.classes()).toContain('my-th')
        expect(wrapper.classes()).toContain('bg-red-500')
        expect(wrapper.classes()).not.toContain('bg-brutal-accent')
    })
})

describe('TableCell', () => {
    it('renders slot content', () => {
        const wrapper = mount(TableCell, {
            slots: { default: 'Data' },
        })
        expect(wrapper.text()).toBe('Data')
    })

    it('renders td element', () => {
        const wrapper = mount(TableCell)
        expect(wrapper.element.tagName).toBe('TD')
    })

    it('applies default classes from tableCellVariants', () => {
        const wrapper = mount(TableCell)
        expect(wrapper.classes()).toContain('p-4')
        expect(wrapper.classes()).toContain('align-middle')
        expect(wrapper.classes()).toContain('font-medium')
        expect(wrapper.classes()).toContain('[&:has([role=checkbox])]:pr-0')
        expect(wrapper.classes()).toContain('border-r-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('last:border-r-0')
    })

    it('applies custom class and correctly overrides conflicting classes', () => {
        const wrapper = mount(TableCell, { props: { class: 'my-td p-0' } })
        expect(wrapper.classes()).toContain('my-td')
        expect(wrapper.classes()).toContain('p-0')
        expect(wrapper.classes()).not.toContain('p-4')
    })
})

describe('TableCaption', () => {
    it('renders slot content', () => {
        const wrapper = mount(TableCaption, {
            slots: { default: 'Table caption' },
        })
        expect(wrapper.text()).toBe('Table caption')
    })

    it('renders caption element', () => {
        const wrapper = mount(TableCaption)
        expect(wrapper.element.tagName).toBe('CAPTION')
    })

    it('applies default classes from tableCaptionVariants', () => {
        const wrapper = mount(TableCaption)
        expect(wrapper.classes()).toContain('mt-4')
        expect(wrapper.classes()).toContain('text-sm')
        expect(wrapper.classes()).toContain('font-bold')
        expect(wrapper.classes()).toContain('text-brutal-muted-foreground')
    })

    it('applies custom class', () => {
        const wrapper = mount(TableCaption, { props: { class: 'my-caption' } })
        expect(wrapper.classes()).toContain('my-caption')
        expect(wrapper.classes()).toContain('mt-4')
    })
})
