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
})
