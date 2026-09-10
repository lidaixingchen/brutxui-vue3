import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Statistic from './Statistic.vue'
import { provideLocale } from '@/composables/useLocale'
import { en } from '@/locales/en'

describe('Statistic', () => {
    it('renders basic integer and float numbers with default locale grouping', () => {
        const wrapper = mount(Statistic, {
            props: { value: 1234567 },
        })
        expect(wrapper.text()).toContain('1,234,567')
    })

    it('preserves big numbers exceeding IEEE 754 safe integer limit without truncation', () => {
        // 2^53 - 1 is 9007199254740991. 9007199254740993 cannot be represented as float64 without truncation.
        const wrapperStr = mount(Statistic, {
            props: { value: '9007199254740993' },
        })
        expect(wrapperStr.text()).toContain('9,007,199,254,740,993')

        const wrapperBigInt = mount(Statistic, {
            props: { value: 9007199254740993n },
        })
        expect(wrapperBigInt.text()).toContain('9,007,199,254,740,993')

        // Extremely large number
        const wrapperHuge = mount(Statistic, {
            props: { value: '123456789012345678901234567890' },
        })
        expect(wrapperHuge.text()).toContain('123,456,789,012,345,678,901,234,567,890')
    })

    it('handles big numbers with decimal precision safely', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: '9007199254740993.456',
                precision: 2,
            },
        })
        expect(wrapper.text()).toContain('9,007,199,254,740,993.46')
    })

    it('supports negative numbers with big integer part', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: '-9007199254740993.5',
                precision: 2,
            },
        })
        expect(wrapper.text()).toContain('-9,007,199,254,740,993.50')
    })

    it('pads zeros to meet precision requirement', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 42,
                precision: 2,
            },
        })
        expect(wrapper.text()).toContain('42.00')
    })

    it('rounds up fraction with carry into integer part', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: '99.999',
                precision: 2,
            },
        })
        expect(wrapper.text()).toContain('100.00')
    })

    it('supports precision of 0', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: '1234.56',
                precision: 0,
            },
        })
        expect(wrapper.text()).toContain('1,235')
    })

    it('supports explicit locale override', () => {
        // German uses dot for thousands and comma for decimal
        const wrapper = mount(Statistic, {
            props: {
                value: '1234567.89',
                locale: 'de-DE',
            },
        })
        expect(wrapper.text()).toContain('1.234.567,89')
    })

    it('supports explicit decimalSeparator and groupSeparator overrides', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 1234567.89,
                decimalSeparator: '-',
                groupSeparator: '_',
                precision: 2,
            },
        })
        expect(wrapper.text()).toContain('1_234_567-89')
    })

    it('allows disabling group separators by passing empty string', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 1234567,
                groupSeparator: '',
            },
        })
        expect(wrapper.text()).toContain('1234567')
    })

    it('handles empty and invalid input with placeholder', () => {
        const wrapperNull = mount(Statistic, {
            props: { value: null },
        })
        expect(wrapperNull.text()).toBe('-')

        const wrapperUndefined = mount(Statistic, {
            props: { value: undefined },
        })
        expect(wrapperUndefined.text()).toBe('-')

        const wrapperInvalid = mount(Statistic, {
            props: { value: 'not-a-number' },
        })
        expect(wrapperInvalid.text()).toBe('-')

        const wrapperCustom = mount(Statistic, {
            props: { value: null, placeholder: 'N/A' },
        })
        expect(wrapperCustom.text()).toBe('N/A')
    })

    it('renders title, prefix, and suffix props', () => {
        const wrapper = mount(Statistic, {
            props: {
                title: 'Total Revenue',
                prefix: '$',
                suffix: 'USD',
                value: 50000,
            },
        })
        expect(wrapper.text()).toContain('Total Revenue')
        expect(wrapper.text()).toContain('$')
        expect(wrapper.text()).toContain('50,000')
        expect(wrapper.text()).toContain('USD')
    })

    it('prioritizes slots over title, prefix, and suffix props', () => {
        const wrapper = mount(Statistic, {
            props: {
                title: 'Prop Title',
                prefix: 'Prop Prefix',
                suffix: 'Prop Suffix',
                value: 100,
            },
            slots: {
                title: 'Slot Title',
                prefix: 'Slot Prefix',
                suffix: 'Slot Suffix',
            },
        })
        expect(wrapper.text()).toContain('Slot Title')
        expect(wrapper.text()).not.toContain('Prop Title')
        expect(wrapper.text()).toContain('Slot Prefix')
        expect(wrapper.text()).not.toContain('Prop Prefix')
        expect(wrapper.text()).toContain('Slot Suffix')
        expect(wrapper.text()).not.toContain('Prop Suffix')
    })

    it('renders upward trend with accessible label and icon', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 100,
                trend: 'up',
            },
        })
        expect(wrapper.find('svg').exists()).toBe(true)
        const srOnly = wrapper.find('.sr-only')
        expect(srOnly.exists()).toBe(true)
        expect(srOnly.text()).toBe('上升')
    })

    it('renders downward trend with accessible label and icon', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 100,
                trend: 'down',
            },
        })
        expect(wrapper.find('svg').exists()).toBe(true)
        const srOnly = wrapper.find('.sr-only')
        expect(srOnly.exists()).toBe(true)
        expect(srOnly.text()).toBe('下降')
    })

    it('respects provideLocale for trend accessibility text', () => {
        const Parent = defineComponent({
            setup() {
                provideLocale(en)
                return () => h(Statistic, { value: 100, trend: 'up' })
            },
        })
        const wrapper = mount(Parent)
        const srOnly = wrapper.find('.sr-only')
        expect(srOnly.text()).toBe('Up')
    })

    it('supports custom formatter function', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 1000,
                formatter: (val) => `CUSTOM:${val}`,
            },
        })
        expect(wrapper.text()).toContain('CUSTOM:1000')
    })

    it('supports default slot for count-up or custom animation wrappers', () => {
        const wrapper = mount(Statistic, {
            props: { value: 9999 },
            slots: {
                default: (slotProps: { value: unknown; formattedValue: string }) =>
                    h('span', { class: 'animated-counter' }, `[${slotProps.formattedValue}]`),
            },
        })
        const animated = wrapper.find('.animated-counter')
        expect(animated.exists()).toBe(true)
        expect(animated.text()).toBe('[9,999]')
    })

    it('applies variant and size classes', () => {
        const wrapper = mount(Statistic, {
            props: {
                value: 123,
                variant: 'card',
                size: 'lg',
                class: 'my-custom-statistic',
            },
        })
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('shadow-brutal')
        expect(wrapper.classes()).toContain('my-custom-statistic')
    })
})
