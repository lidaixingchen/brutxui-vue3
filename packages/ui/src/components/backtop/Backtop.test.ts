import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import Backtop from './Backtop.vue'

const localeProvide = { [LOCALE_INJECTION_KEY]: en }

describe('Backtop.vue', () => {

    it('remains hidden when scroll offset is below visibilityHeight', async () => {
        const wrapper = mount(Backtop, {
            props: { visibilityHeight: 200 },
            global: { provide: localeProvide },
            attachTo: document.body
        })

        Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true })
        Object.defineProperty(window, 'pageYOffset', { value: 100, writable: true, configurable: true })
        document.documentElement.scrollTop = 100
        window.dispatchEvent(new Event('scroll'))
        
        await nextTick()
        expect(wrapper.find('button').exists()).toBe(false)

        wrapper.unmount()
    })

    it('becomes visible when scroll offset exceeds visibilityHeight', async () => {
        const wrapper = mount(Backtop, {
            props: { visibilityHeight: 200 },
            global: { provide: localeProvide },
            attachTo: document.body
        })

        Object.defineProperty(window, 'scrollY', { value: 300, writable: true, configurable: true })
        Object.defineProperty(window, 'pageYOffset', { value: 300, writable: true, configurable: true })
        document.documentElement.scrollTop = 300
        window.dispatchEvent(new Event('scroll'))

        await nextTick()
        expect(wrapper.find('button').exists()).toBe(true)

        wrapper.unmount()
    })

    it('triggers scrollTo and emits click event when clicked', async () => {
        const scrollToMock = vi.fn()
        window.scrollTo = scrollToMock

        const wrapper = mount(Backtop, {
            props: { visibilityHeight: 200 },
            global: { provide: localeProvide },
            attachTo: document.body
        })

        Object.defineProperty(window, 'scrollY', { value: 300, writable: true, configurable: true })
        Object.defineProperty(window, 'pageYOffset', { value: 300, writable: true, configurable: true })
        document.documentElement.scrollTop = 300
        window.dispatchEvent(new Event('scroll'))
        await nextTick()

        const btn = wrapper.find('button')
        expect(btn.exists()).toBe(true)

        await btn.trigger('click')

        expect(wrapper.emitted('click')).toBeTruthy()
        expect(scrollToMock).toHaveBeenCalledWith({
            top: 0,
            behavior: 'smooth'
        })

        wrapper.unmount()
    })

    it('has primary as the default variant and applies custom styles', async () => {
        const wrapper = mount(Backtop, {
            props: { visibilityHeight: 100 },
            global: { provide: localeProvide },
            attachTo: document.body
        })

        Object.defineProperty(window, 'scrollY', { value: 150, writable: true, configurable: true })
        Object.defineProperty(window, 'pageYOffset', { value: 150, writable: true, configurable: true })
        document.documentElement.scrollTop = 150
        window.dispatchEvent(new Event('scroll'))
        await nextTick()

        const btn = wrapper.findComponent({ name: 'Button' })
        expect(btn.exists()).toBe(true)
        expect(btn.props('variant')).toBe('primary')
        expect(btn.classes()).toContain('bg-brutal-yellow')
        expect(btn.classes()).toContain('text-brutal-black')

        wrapper.unmount()
    })
})
