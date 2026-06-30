import { describe, it, expect } from 'vitest'
import { defineComponent, provide, inject, ref, computed, unref, type InjectionKey, type MaybeRef } from 'vue'
import { mount } from '@vue/test-utils'
import { useLocale, provideLocale, LOCALE_INJECTION_KEY, FALLBACK_LOCALE_INJECTION_KEY } from './useLocale'
import { zhCN } from '../locales/zh-CN'
import { en } from '../locales/en'
import type { Locale } from '../locales/types'

describe('useLocale', () => {
    it('falls back to zhCN when no provider is present', () => {
        const wrapper = mount(defineComponent({
            setup() {
                const { t } = useLocale()
                return { t }
            },
            template: '<div/>',
        }))
        expect(wrapper.vm.t('combobox.placeholder')).toBe(zhCN.combobox.placeholder)
    })

    it('t() finds nested keys', () => {
        const wrapper = mount(defineComponent({
            setup() {
                const { t } = useLocale()
                return { t }
            },
            template: '<div/>',
        }))
        expect(wrapper.vm.t('combobox.searchPlaceholder')).toBe(zhCN.combobox.searchPlaceholder)
    })

    it('t() returns path when key is not found anywhere', () => {
        const wrapper = mount(defineComponent({
            setup() {
                const { t } = useLocale()
                return { t }
            },
            template: '<div/>',
        }))
        expect(wrapper.vm.t('nonexistent.key.path')).toBe('nonexistent.key.path')
    })

    it('provideLocale and useLocale work together', () => {
        // 测试父子组件场景
        const Child = defineComponent({
            setup() {
                const { t, locale } = useLocale()
                return { t, locale }
            },
            template: '<div>{{ t("combobox.placeholder") }}</div>',
        })

        const Parent = defineComponent({
            components: { Child },
            setup() {
                provideLocale(en)
            },
            template: '<Child />',
        })

        const wrapper = mount(Parent)
        const child = wrapper.findComponent(Child)
        expect(child.vm.t('combobox.placeholder')).toBe(en.combobox.placeholder)
    })

    it('provideLocale with fallback works in parent-child', () => {
        const customFallback = {
            combobox: {
                placeholder: 'Custom Confirm',
            },
        } as Partial<Locale>

        const Child = defineComponent({
            setup() {
                const { t } = useLocale()
                return { t }
            },
            template: '<div/>',
        })

        const Parent = defineComponent({
            components: { Child },
            setup() {
                provideLocale({
                    locale: {} as Locale,
                    fallbackLocale: customFallback,
                })
            },
            template: '<Child />',
        })

        const wrapper = mount(Parent)
        const child = wrapper.findComponent(Child)
        expect(child.vm.t('combobox.placeholder')).toBe('Custom Confirm')
    })
})
