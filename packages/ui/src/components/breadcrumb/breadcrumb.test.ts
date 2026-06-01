import { mount } from '@vue/test-utils'
import Breadcrumb from './Breadcrumb.vue'
import BreadcrumbList from './BreadcrumbList.vue'
import BreadcrumbItem from './BreadcrumbItem.vue'
import BreadcrumbLink from './BreadcrumbLink.vue'
import BreadcrumbPage from './BreadcrumbPage.vue'
import BreadcrumbSeparator from './BreadcrumbSeparator.vue'
import BreadcrumbEllipsis from './BreadcrumbEllipsis.vue'

describe('Breadcrumb', () => {
    it('renders nav element with aria-label', () => {
        const wrapper = mount(Breadcrumb)
        expect(wrapper.element.tagName).toBe('NAV')
        expect(wrapper.attributes('aria-label')).toBe('breadcrumb')
    })

    it('renders slot content', () => {
        const wrapper = mount(Breadcrumb, {
            slots: { default: '<ol>Items</ol>' },
        })
        expect(wrapper.text()).toBe('Items')
    })

    it('applies custom class', () => {
        const wrapper = mount(Breadcrumb, { props: { class: 'my-nav' } })
        expect(wrapper.classes()).toContain('my-nav')
    })
})

describe('BreadcrumbList', () => {
    it('renders ol element', () => {
        const wrapper = mount(BreadcrumbList)
        expect(wrapper.element.tagName).toBe('OL')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbList)
        expect(wrapper.classes()).toContain('flex')
        expect(wrapper.classes()).toContain('items-center')
        expect(wrapper.classes()).toContain('text-sm')
        expect(wrapper.classes()).toContain('font-medium')
    })

    it('renders slot content', () => {
        const wrapper = mount(BreadcrumbList, {
            slots: { default: '<li>Item</li>' },
        })
        expect(wrapper.text()).toBe('Item')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbList, { props: { class: 'my-list' } })
        expect(wrapper.classes()).toContain('my-list')
    })
})

describe('BreadcrumbItem', () => {
    it('renders li element', () => {
        const wrapper = mount(BreadcrumbItem)
        expect(wrapper.element.tagName).toBe('LI')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbItem)
        expect(wrapper.classes()).toContain('inline-flex')
        expect(wrapper.classes()).toContain('items-center')
        expect(wrapper.classes()).toContain('gap-1.5')
    })

    it('renders slot content', () => {
        const wrapper = mount(BreadcrumbItem, {
            slots: { default: '<a>Link</a>' },
        })
        expect(wrapper.text()).toBe('Link')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbItem, { props: { class: 'my-item' } })
        expect(wrapper.classes()).toContain('my-item')
    })
})

describe('BreadcrumbLink', () => {
    it('renders default as anchor element', () => {
        const wrapper = mount(BreadcrumbLink, {
            slots: { default: 'Home' },
        })
        expect(wrapper.element.tagName).toBe('A')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbLink)
        expect(wrapper.classes()).toContain('transition-colors')
        expect(wrapper.classes()).toContain('cursor-pointer')
    })

    it('renders slot content', () => {
        const wrapper = mount(BreadcrumbLink, {
            slots: { default: 'Home' },
        })
        expect(wrapper.text()).toBe('Home')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbLink, { props: { class: 'my-link' } })
        expect(wrapper.classes()).toContain('my-link')
    })

    it('renders as custom element via as prop', () => {
        const wrapper = mount(BreadcrumbLink, {
            props: { as: 'span' },
            slots: { default: 'Home' },
        })
        expect(wrapper.element.tagName).toBe('SPAN')
    })
})

describe('BreadcrumbPage', () => {
    it('renders span element', () => {
        const wrapper = mount(BreadcrumbPage)
        expect(wrapper.element.tagName).toBe('SPAN')
    })

    it('applies aria attributes', () => {
        const wrapper = mount(BreadcrumbPage)
        expect(wrapper.attributes('role')).toBe('link')
        expect(wrapper.attributes('aria-disabled')).toBe('true')
        expect(wrapper.attributes('aria-current')).toBe('page')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbPage)
        expect(wrapper.classes()).toContain('font-black')
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('rounded-brutal')
        expect(wrapper.classes()).toContain('shadow-brutal-sm')
        expect(wrapper.classes()).toContain('select-none')
    })

    it('renders slot content', () => {
        const wrapper = mount(BreadcrumbPage, {
            slots: { default: 'Current Page' },
        })
        expect(wrapper.text()).toBe('Current Page')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbPage, { props: { class: 'my-page' } })
        expect(wrapper.classes()).toContain('my-page')
    })
})

describe('BreadcrumbSeparator', () => {
    it('renders li element', () => {
        const wrapper = mount(BreadcrumbSeparator)
        expect(wrapper.element.tagName).toBe('LI')
    })

    it('applies aria attributes', () => {
        const wrapper = mount(BreadcrumbSeparator)
        expect(wrapper.attributes('role')).toBe('presentation')
        expect(wrapper.attributes('aria-hidden')).toBe('true')
    })

    it('renders default separator text', () => {
        const wrapper = mount(BreadcrumbSeparator)
        expect(wrapper.text()).toBe('/')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbSeparator)
        expect(wrapper.classes()).toContain('font-bold')
    })

    it('renders custom slot content', () => {
        const wrapper = mount(BreadcrumbSeparator, {
            slots: { default: '<span>→</span>' },
        })
        expect(wrapper.text()).toBe('→')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbSeparator, { props: { class: 'my-sep' } })
        expect(wrapper.classes()).toContain('my-sep')
    })
})

describe('BreadcrumbEllipsis', () => {
    it('renders span element', () => {
        const wrapper = mount(BreadcrumbEllipsis)
        expect(wrapper.element.tagName).toBe('SPAN')
    })

    it('applies aria attributes', () => {
        const wrapper = mount(BreadcrumbEllipsis)
        expect(wrapper.attributes('role')).toBe('presentation')
        expect(wrapper.attributes('aria-hidden')).toBe('true')
    })

    it('renders sr-only text', () => {
        const wrapper = mount(BreadcrumbEllipsis)
        const srOnly = wrapper.find('.sr-only')
        expect(srOnly.exists()).toBe(true)
        expect(srOnly.text()).toBe('More')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbEllipsis)
        expect(wrapper.classes()).toContain('flex')
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('rounded-brutal')
        expect(wrapper.classes()).toContain('shadow-brutal-sm')
        expect(wrapper.classes()).toContain('select-none')
        expect(wrapper.classes()).toContain('cursor-pointer')
    })

    it('renders custom slot content', () => {
        const wrapper = mount(BreadcrumbEllipsis, {
            slots: { default: '<span>…</span>' },
        })
        expect(wrapper.text()).toContain('…')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbEllipsis, { props: { class: 'my-ellipsis' } })
        expect(wrapper.classes()).toContain('my-ellipsis')
    })
})
