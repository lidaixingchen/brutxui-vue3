import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import Result from './Result.vue'

const localeProvide = { [LOCALE_INJECTION_KEY]: en }

describe('Result.vue', () => {
    it('renders title and subTitle correctly', () => {
        const wrapper = mount(Result, {
            props: {
                title: 'Submission Successful',
                subTitle: 'Your application has been received.',
            },
            global: { provide: localeProvide },
        })

        expect(wrapper.text()).toContain('Submission Successful')
        expect(wrapper.text()).toContain('Your application has been received.')
    })

    it('renders different status icon container color correctly', () => {
        const successWrapper = mount(Result, {
            props: { status: 'success' },
            global: { provide: localeProvide },
        })
        const errorWrapper = mount(Result, {
            props: { status: 'error' },
            global: { provide: localeProvide },
        })

        // 成功状态底色应为绿色 #22c55e
        const successIconContainer = successWrapper.find('.w-16.h-16')
        expect(successIconContainer.classes()).toContain('bg-[#22c55e]')

        // 失败状态底色应为 destructive
        const errorIconContainer = errorWrapper.find('.w-16.h-16')
        expect(errorIconContainer.classes()).toContain('bg-brutal-destructive')
    })

    it('renders extra action slot content correctly', () => {
        const wrapper = mount(Result, {
            slots: {
                extra: '<button class="btn-home">Go Home</button>',
            },
            global: { provide: localeProvide },
        })

        expect(wrapper.find('.btn-home').exists()).toBe(true)
        expect(wrapper.find('.btn-home').text()).toBe('Go Home')
    })

    it('renders plain variant without card chrome', () => {
        const wrapper = mount(Result, {
            props: { variant: 'plain' },
            global: { provide: localeProvide },
        })

        expect(wrapper.classes()).toContain('p-0')
        expect(wrapper.classes()).not.toContain('border-3')
    })

    it('links icon size to iconSize prop', () => {
        const wrapper = mount(Result, {
            props: { iconSize: 'lg' },
            global: { provide: localeProvide },
        })

        const icon = wrapper.find('svg')
        expect(icon.classes()).toContain('h-5')
        expect(icon.classes()).toContain('w-5')
    })

    it('supports empty status and h3 title tag', () => {
        const wrapper = mount(Result, {
            props: {
                status: 'empty',
                title: 'No results',
                titleAs: 'h3',
            },
            global: { provide: localeProvide },
        })

        expect(wrapper.find('h3').text()).toBe('No results')
        expect(wrapper.find('.w-16.h-16').classes()).toContain('bg-brutal-accent')
    })
})
