import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import Statistic from './Statistic.vue'
import Counter from '../counter/Counter.vue'

const localeProvide = { [LOCALE_INJECTION_KEY]: en }

describe('Statistic.vue', () => {
    it('renders title and numeric value correctly', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 1234.56,
                title: 'Active Users',
                precision: 2,
            },
            global: { provide: localeProvide },
        })

        // 1. 验证标题渲染
        expect(wrapper.text()).toContain('Active Users')

        // 2. 验证嵌套了 Counter
        const counter = wrapper.findComponent(Counter)
        expect(counter.exists()).toBe(true)
        expect(counter.props('to')).toBe(1234.56)
        expect(counter.props('decimals')).toBe(2)
        expect(counter.props('title')).toBe('Active Users')
    })

    it('applies card container styling when card prop is true', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 100,
                card: true,
            },
            global: { provide: localeProvide },
        })

        expect(wrapper.classes()).toContain('border-2')
        expect(wrapper.classes()).toContain('border-brutal-black')
        expect(wrapper.classes()).toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]')
    })

    it('passes decimal separator correctly to Counter', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 1234.56,
                precision: 2,
                decimalSeparator: ',',
                groupSeparator: '.',
            },
            global: { provide: localeProvide },
        })

        const counter = wrapper.findComponent(Counter)
        expect(counter.props('decimalSeparator')).toBe(',')
        expect(counter.props('separator')).toBe('.')
    })

    it('passes prefix and suffix correctly to Counter', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 99,
                prefix: '$',
                suffix: 'USD',
            },
            global: { provide: localeProvide },
        })

        const counter = wrapper.findComponent(Counter)
        expect(counter.props('prefix')).toBe('$')
        expect(counter.props('suffix')).toBe('USD')
    })
})
