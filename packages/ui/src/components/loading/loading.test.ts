import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, it, expect } from 'vitest'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import Loading from './Loading.vue'
import { vLoading } from '@/directives/loading'
import Spinner from '../spinner/Spinner.vue'

const localeProvide = { [LOCALE_INJECTION_KEY]: en }

describe('Loading.vue (声明式组件)', () => {
    it('renders slot content correctly', () => {
        const wrapper = mount(Loading, {
            props: { loading: false },
            slots: {
                default: '<div class="test-content">Content</div>',
            },
            global: { provide: localeProvide },
        })
        expect(wrapper.find('.test-content').exists()).toBe(true)
        expect(wrapper.findComponent(Spinner).exists()).toBe(false)
    })

    it('renders overlay mask and spinner when loading is true', async () => {
        const wrapper = mount(Loading, {
            props: { loading: true },
            slots: {
                default: '<div class="test-content">Content</div>',
            },
            global: { provide: localeProvide },
        })
        expect(wrapper.findComponent(Spinner).exists()).toBe(true)
    })

    it('renders custom loading text when provided', () => {
        const wrapper = mount(Loading, {
            props: { loading: true, text: 'Custom Loading Text' },
            global: { provide: localeProvide },
        })
        const textSpan = wrapper.find('.bg-brutal-yellow')
        expect(textSpan.exists()).toBe(true)
        expect(textSpan.text()).toBe('Custom Loading Text')
    })
})

describe('v-loading (自定义指令)', () => {
    const TestComponent = {
        template: `
            <div 
                id="target"
                v-loading="isLoading" 
                :element-loading-text="loadingText"
                style="width: 100px; height: 100px;"
            >
                Test Element
            </div>
        `,
        props: ['isLoading', 'loadingText'],
    }

    it('creates overlay, mounts spinner and updates host position to relative when true', async () => {
        const wrapper = mount(TestComponent, {
            props: { isLoading: true, loadingText: 'Wait...' },
            global: {
                directives: { loading: vLoading },
                provide: localeProvide,
            },
            attachTo: document.body, // attachTo document.body 可以让 window.getComputedStyle 正常工作
        })

        const target = wrapper.find('#target')
        const el = target.element as HTMLElement

        // 1. 验证定位劫持
        expect(el.style.position).toBe('relative')

        // 2. 验证蒙版和 Spinner 挂载
        const mask = el.querySelector('.absolute') as HTMLDivElement
        expect(mask).not.toBeNull()
        expect(mask.style.display).toBe('flex')

        // 3. 验证文本渲染
        const textSpan = mask.querySelector('.bg-brutal-yellow')
        expect(textSpan).not.toBeNull()
        expect(textSpan?.textContent).toBe('Wait...')

        wrapper.unmount()
    })

    it('hides overlay and restores host position when toggled to false', async () => {
        const wrapper = mount(TestComponent, {
            props: { isLoading: true, loadingText: '' },
            global: {
                directives: { loading: vLoading },
                provide: localeProvide,
            },
            attachTo: document.body,
        })

        const target = wrapper.find('#target')
        const el = target.element as HTMLElement

        expect(el.style.position).toBe('relative')

        // 切换 isLoading 到 false
        await wrapper.setProps({ isLoading: false })

        const mask = el.querySelector('.absolute') as HTMLDivElement
        expect(mask.style.display).toBe('none')
        
        // 恢复原始 static 定位（由于原始未设置定位，指令将其移除或恢复）
        expect(el.style.position).toBe('')

        wrapper.unmount()
    })

    it('updates text dynamically when attribute changes', async () => {
        const wrapper = mount(TestComponent, {
            props: { isLoading: true, loadingText: 'Text A' },
            global: {
                directives: { loading: vLoading },
                provide: localeProvide,
            },
            attachTo: document.body,
        })

        const target = wrapper.find('#target')
        const el = target.element as HTMLElement
        const mask = el.querySelector('.absolute') as HTMLDivElement

        const textSpan = mask.querySelector('.bg-brutal-yellow')
        expect(textSpan?.textContent).toBe('Text A')

        // 修改 loadingText 属性
        await wrapper.setProps({ loadingText: 'Text B' })

        expect(textSpan?.textContent).toBe('Text B')

        wrapper.unmount()
    })
})
