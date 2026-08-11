import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import Breadcrumb from './Breadcrumb.vue'
import BreadcrumbList from './BreadcrumbList.vue'
import BreadcrumbItem from './BreadcrumbItem.vue'
import BreadcrumbLink from './BreadcrumbLink.vue'
import BreadcrumbPage from './BreadcrumbPage.vue'
import BreadcrumbSeparator from './BreadcrumbSeparator.vue'
import BreadcrumbEllipsis from './BreadcrumbEllipsis.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

// 模拟 router-link 等自定义组件：inheritAttrs 透传 class 到根元素，验证 asChild class 合并
const RouterLinkStub = defineComponent({
    name: 'RouterLinkStub',
    props: { to: { type: String, required: true } },
    inheritAttrs: true,
    template: '<a :href="to"><slot /></a>',
})

describe('Breadcrumb', () => {
    it('renders nav element with aria-label', () => {
        const wrapper = mount(Breadcrumb, { ...localeProvide })
        expect(wrapper.element.tagName).toBe('NAV')
        expect(wrapper.attributes('aria-label')).toBe('breadcrumb')
    })

    it('renders slot content', () => {
        const wrapper = mount(Breadcrumb, {
            slots: { default: '<ol>Items</ol>' },
            ...localeProvide,
        })
        expect(wrapper.text()).toBe('Items')
    })

    it('applies custom class', () => {
        const wrapper = mount(Breadcrumb, { props: { class: 'my-nav' }, ...localeProvide })
        expect(wrapper.classes()).toContain('my-nav')
    })
})

describe('BreadcrumbList', () => {
    it('renders ol element', () => {
        const wrapper = mount(BreadcrumbList, { ...localeProvide })
        expect(wrapper.element.tagName).toBe('OL')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbList, { ...localeProvide })
        expect(wrapper.classes()).toContain('flex')
        expect(wrapper.classes()).toContain('items-center')
        expect(wrapper.classes()).toContain('text-sm')
        expect(wrapper.classes()).toContain('font-medium')
    })

    it('renders slot content', () => {
        const wrapper = mount(BreadcrumbList, {
            slots: { default: '<li>Item</li>' },
            ...localeProvide,
        })
        expect(wrapper.text()).toBe('Item')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbList, { props: { class: 'my-list' }, ...localeProvide })
        expect(wrapper.classes()).toContain('my-list')
    })

    it('keeps breadcrumb-list static hook class', () => {
        // styles.css @layer base 以 .breadcrumb-list 重置外部 Markdown 样式污染，误删会回归
        const wrapper = mount(BreadcrumbList, { ...localeProvide })
        expect(wrapper.classes()).toContain('breadcrumb-list')
    })

    it('lets custom gap override base gap via twMerge', () => {
        const wrapper = mount(BreadcrumbList, { props: { class: 'gap-4' }, ...localeProvide })
        expect(wrapper.classes()).toContain('gap-4')
        expect(wrapper.classes()).not.toContain('gap-2.5')
    })

    it('renders empty slot', () => {
        const wrapper = mount(BreadcrumbList, { ...localeProvide })
        expect(wrapper.element.tagName).toBe('OL')
        expect(wrapper.text()).toBe('')
    })
})

describe('BreadcrumbItem', () => {
    it('renders li element', () => {
        const wrapper = mount(BreadcrumbItem, { ...localeProvide })
        expect(wrapper.element.tagName).toBe('LI')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbItem, { ...localeProvide })
        expect(wrapper.classes()).toContain('inline-flex')
        expect(wrapper.classes()).toContain('items-center')
        expect(wrapper.classes()).toContain('gap-1.5')
    })

    it('renders slot content', () => {
        const wrapper = mount(BreadcrumbItem, {
            slots: { default: '<a>Link</a>' },
            ...localeProvide,
        })
        expect(wrapper.text()).toBe('Link')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbItem, { props: { class: 'my-item' }, ...localeProvide })
        expect(wrapper.classes()).toContain('my-item')
    })
})

describe('BreadcrumbLink', () => {
    it('renders default as anchor element', () => {
        const wrapper = mount(BreadcrumbLink, {
            slots: { default: 'Home' },
            ...localeProvide,
        })
        expect(wrapper.element.tagName).toBe('A')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbLink, { ...localeProvide })
        expect(wrapper.classes()).toContain('transition-[transform,box-shadow,color]')
        expect(wrapper.classes()).toContain('cursor-pointer')
    })

    it('renders slot content', () => {
        const wrapper = mount(BreadcrumbLink, {
            slots: { default: 'Home' },
            ...localeProvide,
        })
        expect(wrapper.text()).toBe('Home')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbLink, { props: { class: 'my-link' }, ...localeProvide })
        expect(wrapper.classes()).toContain('my-link')
    })

    it('renders as custom element via as prop', () => {
        const wrapper = mount(BreadcrumbLink, {
            props: { as: 'span' },
            slots: { default: 'Home' },
            ...localeProvide,
        })
        expect(wrapper.element.tagName).toBe('SPAN')
    })

    it('merges variant classes onto as-child native element', () => {
        const wrapper = mount(BreadcrumbLink, {
            props: { asChild: true },
            slots: { default: '<a href="/home">Home</a>' },
            ...localeProvide,
        })
        const anchor = wrapper.find('a')
        expect(anchor.exists()).toBe(true)
        expect(anchor.attributes('href')).toBe('/home')
        expect(anchor.classes()).toContain('transition-[transform,box-shadow,color]')
        expect(anchor.classes()).toContain('cursor-pointer')
    })

    it('merges variant classes onto as-child custom component', () => {
        const wrapper = mount(BreadcrumbLink, {
            props: { asChild: true },
            slots: { default: h(RouterLinkStub, { to: '/home' }, () => 'Home') },
            ...localeProvide,
        })
        const anchor = wrapper.find('a')
        expect(anchor.exists()).toBe(true)
        expect(anchor.attributes('href')).toBe('/home')
        expect(anchor.classes()).toContain('cursor-pointer')
    })
})

describe('BreadcrumbPage', () => {
    it('renders span element', () => {
        const wrapper = mount(BreadcrumbPage, { ...localeProvide })
        expect(wrapper.element.tagName).toBe('SPAN')
    })

    it('applies aria-current without link role', () => {
        const wrapper = mount(BreadcrumbPage, { ...localeProvide })
        expect(wrapper.attributes('aria-current')).toBe('page')
        expect(wrapper.attributes('role')).toBeUndefined()
        expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbPage, { ...localeProvide })
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
            ...localeProvide,
        })
        expect(wrapper.text()).toBe('Current Page')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbPage, { props: { class: 'my-page' }, ...localeProvide })
        expect(wrapper.classes()).toContain('my-page')
    })
})

describe('BreadcrumbSeparator', () => {
    it('renders li element', () => {
        const wrapper = mount(BreadcrumbSeparator, { ...localeProvide })
        expect(wrapper.element.tagName).toBe('LI')
    })

    it('applies aria-hidden without presentation role', () => {
        const wrapper = mount(BreadcrumbSeparator, { ...localeProvide })
        expect(wrapper.attributes('aria-hidden')).toBe('true')
        expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('renders default separator text', () => {
        const wrapper = mount(BreadcrumbSeparator, { ...localeProvide })
        expect(wrapper.text()).toBe('/')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbSeparator, { ...localeProvide })
        expect(wrapper.classes()).toContain('font-bold')
    })

    it('renders custom slot content', () => {
        const wrapper = mount(BreadcrumbSeparator, {
            slots: { default: '<span>→</span>' },
            ...localeProvide,
        })
        expect(wrapper.text()).toBe('→')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbSeparator, { props: { class: 'my-sep' }, ...localeProvide })
        expect(wrapper.classes()).toContain('my-sep')
    })
})

describe('BreadcrumbEllipsis', () => {
    it('renders span element', () => {
        const wrapper = mount(BreadcrumbEllipsis, { ...localeProvide })
        expect(wrapper.element.tagName).toBe('SPAN')
    })

    it('applies aria attributes', () => {
        const wrapper = mount(BreadcrumbEllipsis, { ...localeProvide })
        expect(wrapper.attributes('role')).toBe('presentation')
        const innerSpan = wrapper.find('span[aria-hidden="true"]')
        expect(innerSpan.exists()).toBe(true)
    })

    it('renders sr-only text', () => {
        const wrapper = mount(BreadcrumbEllipsis, { ...localeProvide })
        const srOnly = wrapper.find('.sr-only')
        expect(srOnly.exists()).toBe(true)
        expect(srOnly.text()).toBe('More')
    })

    it('applies variant classes', () => {
        const wrapper = mount(BreadcrumbEllipsis, { ...localeProvide })
        expect(wrapper.classes()).toContain('flex')
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('rounded-brutal')
        expect(wrapper.classes()).toContain('shadow-brutal-sm')
        expect(wrapper.classes()).toContain('select-none')
    })

    it('renders custom slot content', () => {
        const wrapper = mount(BreadcrumbEllipsis, {
            slots: { default: '<span>…</span>' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('…')
    })

    it('applies custom class', () => {
        const wrapper = mount(BreadcrumbEllipsis, { props: { class: 'my-ellipsis' }, ...localeProvide })
        expect(wrapper.classes()).toContain('my-ellipsis')
    })
})
