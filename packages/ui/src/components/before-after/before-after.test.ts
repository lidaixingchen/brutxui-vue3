import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import BeforeAfter from './BeforeAfter.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

describe('BeforeAfter', () => {
    it('renders before and after images', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
            ...localeProvide,
        })
        const imgs = wrapper.findAll('img')
        expect(imgs).toHaveLength(2)
        expect(imgs[0].attributes('src')).toBe('/before.jpg')
        expect(imgs[1].attributes('src')).toBe('/after.jpg')
    })

    it('applies default root classes', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
            ...localeProvide,
        })
        const classes = wrapper.classes()
        expect(classes).toContain('relative')
        expect(classes).toContain('overflow-hidden')
        expect(classes).toContain('border-3')
        expect(classes).toContain('border-brutal')
        expect(classes).toContain('shadow-brutal')
        expect(classes).toContain('rounded-brutal')
    })

    it('renders range input', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
            ...localeProvide,
        })
        const input = wrapper.find('input[type="range"]')
        expect(input.exists()).toBe(true)
        expect(input.attributes('min')).toBe('0')
        expect(input.attributes('max')).toBe('100')
    })

    it('images have correct default alt text', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
            ...localeProvide,
        })
        const imgs = wrapper.findAll('img')
        expect(imgs[0].attributes('alt')).toBe('Before')
        expect(imgs[1].attributes('alt')).toBe('After')
    })

    it('images use custom alt text when provided', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
                beforeAlt: 'Original',
                afterAlt: 'Modified',
            },
            ...localeProvide,
        })
        const imgs = wrapper.findAll('img')
        expect(imgs[0].attributes('alt')).toBe('Original')
        expect(imgs[1].attributes('alt')).toBe('Modified')
    })

    it('range input uses default value of 50', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
            ...localeProvide,
        })
        const input = wrapper.find('input[type="range"]')
        expect((input.element as HTMLInputElement).value).toBe('50')
    })

    it('range input uses custom defaultValue', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
                defaultValue: 75,
            },
            ...localeProvide,
        })
        const input = wrapper.find('input[type="range"]')
        expect((input.element as HTMLInputElement).value).toBe('75')
    })

    it('disables range input when disabled prop is true', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
                disabled: true,
            },
            ...localeProvide,
        })
        const input = wrapper.find('input[type="range"]')
        expect((input.element as HTMLInputElement).disabled).toBe(true)
    })

    it('renders handle with MoveHorizontal icon', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
            ...localeProvide,
        })
        const handle = wrapper.find('.absolute.top-1\\/2')
        expect(handle.exists()).toBe(true)
    })

    it('merges custom class prop', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
                class: 'custom-class',
            },
            ...localeProvide,
        })
        expect(wrapper.classes()).toContain('custom-class')
    })
})

describe('BeforeAfter orientation', () => {
    const baseProps = { before: '/before.jpg', after: '/after.jpg' }

    it('renders horizontal clipPath by default', () => {
        const wrapper = mount(BeforeAfter, { props: baseProps, ...localeProvide })
        const afterImg = wrapper.findAll('img')[1]
        const clipPath = afterImg.element.parentElement?.style.clipPath || ''
        expect(clipPath).toContain('inset(0 50% 0 0)')
    })

    it('renders vertical clipPath when orientation is vertical', () => {
        const wrapper = mount(BeforeAfter, {
            props: { ...baseProps, orientation: 'vertical' },
            ...localeProvide,
        })
        const afterImg = wrapper.findAll('img')[1]
        const clipPath = afterImg.element.parentElement?.style.clipPath || ''
        expect(clipPath).toContain('inset(0 0 50% 0)')
    })

    it('renders vertical slider line in horizontal mode', () => {
        const wrapper = mount(BeforeAfter, { props: baseProps, ...localeProvide })
        const sliderLine = wrapper.find('.bg-brutal-fg')
        expect(sliderLine.classes()).toContain('top-0')
        expect(sliderLine.classes()).toContain('bottom-0')
        expect(sliderLine.classes()).toContain('w-[4px]')
        expect(sliderLine.classes()).toContain('-translate-x-1/2')
    })

    it('renders horizontal slider line in vertical mode', () => {
        const wrapper = mount(BeforeAfter, {
            props: { ...baseProps, orientation: 'vertical' },
            ...localeProvide,
        })
        const sliderLine = wrapper.find('.bg-brutal-fg')
        expect(sliderLine.classes()).toContain('left-0')
        expect(sliderLine.classes()).toContain('right-0')
        expect(sliderLine.classes()).toContain('h-[4px]')
        expect(sliderLine.classes()).toContain('-translate-y-1/2')
    })

    it('positions handle at top-1/2 in horizontal mode', () => {
        const wrapper = mount(BeforeAfter, { props: baseProps, ...localeProvide })
        const handle = wrapper.find('.bg-brutal-primary')
        expect(handle.classes()).toContain('top-1/2')
        expect(handle.classes()).toContain('-translate-y-1/2')
    })

    it('positions handle at left-1/2 in vertical mode', () => {
        const wrapper = mount(BeforeAfter, {
            props: { ...baseProps, orientation: 'vertical' },
            ...localeProvide,
        })
        const handle = wrapper.find('.bg-brutal-primary')
        expect(handle.classes()).toContain('left-1/2')
        expect(handle.classes()).toContain('-translate-x-1/2')
    })

    it('uses cursor-ew-resize for horizontal range input', () => {
        const wrapper = mount(BeforeAfter, { props: baseProps, ...localeProvide })
        const input = wrapper.find('input[type="range"]')
        expect(input.classes()).toContain('cursor-ew-resize')
    })

    it('uses cursor-ns-resize for vertical range input', () => {
        const wrapper = mount(BeforeAfter, {
            props: { ...baseProps, orientation: 'vertical' },
            ...localeProvide,
        })
        const input = wrapper.find('input[type="range"]')
        expect(input.classes()).toContain('cursor-ns-resize')
    })

    it('does not set writing-mode for horizontal range input', () => {
        const wrapper = mount(BeforeAfter, { props: baseProps, ...localeProvide })
        const input = wrapper.find('input[type="range"]')
        expect(input.attributes('style')).toBeUndefined()
    })

    it('applies writing-mode vertical-lr for vertical range input', () => {
        const wrapper = mount(BeforeAfter, {
            props: { ...baseProps, orientation: 'vertical' },
            ...localeProvide,
        })
        const input = wrapper.find('input[type="range"]')
        expect(input.attributes('style')).toContain('writing-mode: vertical-lr')
    })

    it('does not rotate handle icon in horizontal mode', () => {
        const wrapper = mount(BeforeAfter, { props: baseProps, ...localeProvide })
        const icon = wrapper.find('.bg-brutal-primary svg')
        expect(icon.classes()).not.toContain('rotate-90')
    })

    it('rotates handle icon 90 degrees in vertical mode', () => {
        const wrapper = mount(BeforeAfter, {
            props: { ...baseProps, orientation: 'vertical' },
            ...localeProvide,
        })
        const icon = wrapper.find('.bg-brutal-primary svg')
        expect(icon.classes()).toContain('rotate-90')
    })
})
