import { mount } from '@vue/test-utils'
import Pagination from './Pagination.vue'

describe('Pagination', () => {
    it('renders with default props', () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 1 },
        })
        expect(wrapper.find('nav').exists()).toBe(true)
        expect(wrapper.find('nav').attributes('role')).toBe('navigation')
        expect(wrapper.find('nav').attributes('aria-label')).toBe('pagination')
    })

    it('emits update:currentPage when page is clicked', async () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 1 },
        })
        const pageButtons = wrapper.findAll('button[aria-label^="Go to page"]')
        expect(pageButtons.length).toBeGreaterThan(0)
        await pageButtons[1].trigger('click')
        expect(wrapper.emitted('update:currentPage')).toBeTruthy()
        expect(wrapper.emitted('update:currentPage')![0]).toEqual([2])
    })

    it('shows correct page numbers', () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 3 },
        })
        const pageButtons = wrapper.findAll('button[aria-label^="Go to page"]')
        const pageNumbers = pageButtons.map((btn) => btn.text())
        expect(pageNumbers).toContain('1')
        expect(pageNumbers).toContain('3')
        expect(pageNumbers).toContain('5')
    })

    it('applies custom class', () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 1, class: 'custom-pagination' },
        })
        expect(wrapper.find('nav').classes()).toContain('custom-pagination')
    })

    it('highlights current page', () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 3 },
        })
        const activePage = wrapper.find('button[aria-current="page"]')
        expect(activePage.exists()).toBe(true)
        expect(activePage.text()).toBe('3')
    })

    it('disables previous button on first page', () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 1 },
        })
        const prevButton = wrapper.find('button[aria-label="Go to previous page"]')
        expect(prevButton.attributes('disabled')).toBeDefined()
    })

    it('disables next button on last page', () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 5 },
        })
        const nextButton = wrapper.find('button[aria-label="Go to next page"]')
        expect(nextButton.attributes('disabled')).toBeDefined()
    })

    it('shows first and last buttons when showFirstLast is true', () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 1, showFirstLast: true },
        })
        expect(wrapper.find('button[aria-label="Go to first page"]').exists()).toBe(true)
        expect(wrapper.find('button[aria-label="Go to last page"]').exists()).toBe(true)
    })

    it('hides first and last buttons when showFirstLast is false', () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 1, showFirstLast: false },
        })
        expect(wrapper.find('button[aria-label="Go to first page"]').exists()).toBe(false)
        expect(wrapper.find('button[aria-label="Go to last page"]').exists()).toBe(false)
    })

    it('shows page counter when showPageNumbers is false', () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 3, showPageNumbers: false },
        })
        expect(wrapper.text()).toContain('3 / 5')
    })

    it('shows dots for large page ranges', () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 20, currentPage: 10 },
        })
        const dots = wrapper.findAll('span').filter((el) => el.text().includes('•••'))
        expect(dots.length).toBeGreaterThan(0)
    })

    it('emits correct page when first button clicked', async () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 3, showFirstLast: true },
        })
        await wrapper.find('button[aria-label="Go to first page"]').trigger('click')
        expect(wrapper.emitted('update:currentPage')![0]).toEqual([1])
    })

    it('emits correct page when last button clicked', async () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 3, showFirstLast: true },
        })
        await wrapper.find('button[aria-label="Go to last page"]').trigger('click')
        expect(wrapper.emitted('update:currentPage')![0]).toEqual([5])
    })

    it('emits correct page when next button clicked', async () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 3 },
        })
        await wrapper.find('button[aria-label="Go to next page"]').trigger('click')
        expect(wrapper.emitted('update:currentPage')![0]).toEqual([4])
    })

    it('emits correct page when previous button clicked', async () => {
        const wrapper = mount(Pagination, {
            props: { totalPages: 5, currentPage: 3 },
        })
        await wrapper.find('button[aria-label="Go to previous page"]').trigger('click')
        expect(wrapper.emitted('update:currentPage')![0]).toEqual([2])
    })
})
