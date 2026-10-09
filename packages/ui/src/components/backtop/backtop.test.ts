import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import Backtop from './Backtop.vue'

const localeProvide = { [LOCALE_INJECTION_KEY]: en }
const TEST_VISIBILITY_HEIGHT: number = 200

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

    it('positions fixed when no target', async () => {
        const wrapper = mount(Backtop, {
            props: { visibilityHeight: 0 },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        await nextTick()
        const btn = wrapper.find('button')
        expect(btn.exists()).toBe(true)
        expect(btn.classes()).toContain('fixed')
        expect(btn.classes()).not.toContain('absolute')
        wrapper.unmount()
    })

    it('positions absolute when target is provided', async () => {
        const container = document.createElement('div')
        container.scrollTop = 0
        document.body.appendChild(container)
        const wrapper = mount(Backtop, {
            props: { target: container, visibilityHeight: 0 },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        await nextTick()
        const btn = wrapper.find('button')
        expect(btn.exists()).toBe(true)
        expect(btn.classes()).toContain('absolute')
        expect(btn.classes()).not.toContain('fixed')
        container.remove()
        wrapper.unmount()
    })

    it('shows button when element target scrolls beyond visibilityHeight', async () => {
        const container = document.createElement('div')
        container.scrollTop = 0
        document.body.appendChild(container)
        const wrapper = mount(Backtop, {
            props: { target: container, visibilityHeight: 200 },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        expect(wrapper.find('button').exists()).toBe(false)

        container.scrollTop = 300
        container.dispatchEvent(new Event('scroll'))
        await nextTick()
        expect(wrapper.find('button').exists()).toBe(true)
        container.remove()
        wrapper.unmount()
    })

    it('shows button when selector target scrolls beyond visibilityHeight', async () => {
        const container = document.createElement('div')
        container.id = 'scroll-box'
        container.scrollTop = 0
        document.body.appendChild(container)
        const wrapper = mount(Backtop, {
            props: { target: '#scroll-box', visibilityHeight: 200 },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        expect(wrapper.find('button').exists()).toBe(false)

        container.scrollTop = 300
        container.dispatchEvent(new Event('scroll'))
        await nextTick()
        expect(wrapper.find('button').exists()).toBe(true)
        container.remove()
        wrapper.unmount()
    })

    it('tolerates invalid CSS selector target without throwing', () => {
        expect(() =>
            mount(Backtop, {
                props: { target: '[foo=', visibilityHeight: 200 },
                global: { provide: localeProvide },
                attachTo: document.body,
            })
        ).not.toThrow()
        // container 解析为 null（非法选择器），按钮保持隐藏
    })

    it('binds scroll listener when dynamic selector target appears', async () => {
        const wrapper = mount(Backtop, {
            props: { target: '.late-box', visibilityHeight: 200 },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        expect(wrapper.find('button').exists()).toBe(false)

        const container = document.createElement('div')
        container.className = 'late-box'
        container.scrollTop = 300
        document.body.appendChild(container)

        // 等待 MutationObserver 回调执行并完成绑定
        await flushPromises()
        await nextTick()

        container.dispatchEvent(new Event('scroll'))
        await nextTick()
        expect(wrapper.find('button').exists()).toBe(true)

        container.remove()
        wrapper.unmount()
    })

    it('rebinds scroll listener when selector target is removed and re-added', async () => {
        const wrapper = mount(Backtop, {
            props: { target: '.rebox', visibilityHeight: 200 },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        expect(wrapper.find('button').exists()).toBe(false)

        const first = document.createElement('div')
        first.className = 'rebox'
        first.scrollTop = 300
        document.body.appendChild(first)
        await flushPromises()
        await nextTick()
        first.dispatchEvent(new Event('scroll'))
        await nextTick()
        expect(wrapper.find('button').exists()).toBe(true)

        // 目标被条件渲染销毁：观察器保持存活（解绑 + 隐藏）
        first.remove()
        await flushPromises()
        await nextTick()

        // 目标重建（新 DOM 节点）：观察器自动为新节点重新绑定滚动监听
        const second = document.createElement('div')
        second.className = 'rebox'
        second.scrollTop = 300
        const secondAddSpy = vi.spyOn(second, 'addEventListener')
        document.body.appendChild(second)
        await flushPromises()
        await nextTick()

        expect(secondAddSpy).toHaveBeenCalledWith('scroll', expect.any(Function), expect.objectContaining({ passive: true }))

        second.remove()
        wrapper.unmount()
    })

    it('rebinds when a selector target is replaced in one DOM update', async (): Promise<void> => {
        const wrapper: ReturnType<typeof mount> = mount(Backtop, {
            props: { target: '.swap-box', visibilityHeight: TEST_VISIBILITY_HEIGHT },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        const first: HTMLDivElement = document.createElement('div')
        first.className = 'swap-box'
        first.scrollTop = TEST_VISIBILITY_HEIGHT
        document.body.appendChild(first)
        await flushPromises()
        await nextTick()
        first.dispatchEvent(new Event('scroll'))
        await nextTick()
        expect(wrapper.find('button').exists()).toBe(true)

        const second: HTMLDivElement = document.createElement('div')
        second.className = 'swap-box'
        second.scrollTop = 0
        first.remove()
        document.body.appendChild(second)
        await flushPromises()
        await nextTick()
        expect(wrapper.find('button').exists()).toBe(false)

        second.scrollTop = TEST_VISIBILITY_HEIGHT
        second.dispatchEvent(new Event('scroll'))
        await vi.waitFor(() => expect(wrapper.find('button').exists()).toBe(true))

        second.remove()
        wrapper.unmount()
    })

    it('observes replacements after switching from an element to an existing selector target', async (): Promise<void> => {
        const visibilityHeight: number = 200
        const first: HTMLDivElement = document.createElement('div')
        const second: HTMLDivElement = document.createElement('div')
        const replacement: HTMLDivElement = document.createElement('div')
        second.className = 'switch-selector-target'
        replacement.className = second.className
        replacement.scrollTop = visibilityHeight
        document.body.append(first, second)
        const replacementScroll: ReturnType<typeof vi.spyOn> = vi.spyOn(replacement, 'scrollTo').mockImplementation((): void => {})
        const wrapper: VueWrapper = mount(Backtop, {
            props: { target: first, visibilityHeight },
            global: { provide: localeProvide },
            attachTo: document.body,
        })

        try {
            await wrapper.setProps({ target: '.switch-selector-target' })
            second.replaceWith(replacement)
            await flushPromises()
            await nextTick()

            expect(wrapper.find('button').exists()).toBe(true)
            await wrapper.get('button').trigger('click')
            expect(replacementScroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
        } finally {
            wrapper.unmount()
            first.remove()
            second.remove()
            replacement.remove()
            replacementScroll.mockRestore()
        }
    })

    it('rebinds scroll listener when target changes', async () => {
        const first = document.createElement('div')
        first.className = 'first-box'
        first.scrollTop = 0
        document.body.appendChild(first)
        const second = document.createElement('div')
        second.className = 'second-box'
        second.scrollTop = 0
        document.body.appendChild(second)

        const wrapper = mount(Backtop, {
            props: { target: '.first-box', visibilityHeight: 200 },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        expect(wrapper.find('button').exists()).toBe(false)

        await wrapper.setProps({ target: '.second-box' })

        // 旧监听已移除：first 滚动不再触发显隐
        first.scrollTop = 300
        first.dispatchEvent(new Event('scroll'))
        await nextTick()
        expect(wrapper.find('button').exists()).toBe(false)

        // 新监听已绑定：second 滚动触发
        second.scrollTop = 300
        second.dispatchEvent(new Event('scroll'))
        await nextTick()
        expect(wrapper.find('button').exists()).toBe(true)

        first.remove()
        second.remove()
        wrapper.unmount()
    })

    it('removes scroll listener and cancels throttle on unmount', async () => {
        const container = document.createElement('div')
        container.scrollTop = 0
        const removeSpy = vi.spyOn(container, 'removeEventListener')
        document.body.appendChild(container)

        const wrapper = mount(Backtop, {
            props: { target: container, visibilityHeight: 200 },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        wrapper.unmount()

        expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
        container.remove()
    })

    it('applies z-floating class and localized aria-label', async () => {
        const wrapper = mount(Backtop, {
            props: { visibilityHeight: 0 },
            attachTo: document.body,
        })
        await nextTick()
        const btn = wrapper.find('button')
        expect(btn.classes()).toContain('z-floating')
        expect(btn.attributes('aria-label')).toBe('回到顶部')
        wrapper.unmount()
    })
})
