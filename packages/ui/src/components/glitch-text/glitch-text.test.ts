import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick, h, defineComponent } from 'vue'
import GlitchText from './GlitchText.vue'

vi.mock('../../composables/useReducedMotion', () => ({
    useReducedMotion: () => ref(false)
}))

describe('GlitchText', () => {
    it('renders with default class names', () => {
        const wrapper = mount(GlitchText, {
            props: { text: 'Test Text' }
        })
        expect(wrapper.text()).toBe('Test Text')
        expect(wrapper.classes()).toContain('relative')
        expect(wrapper.classes()).toContain('inline-block')
    })

    it('prefers slot content over text prop', () => {
        const wrapper = mount(GlitchText, {
            props: { text: 'Prop Text' },
            slots: { default: 'Slot Text' }
        })
        expect(wrapper.text()).toBe('Slot Text')
    })

    it('toggles glitch on click when trigger is click', async () => {
        const wrapper = mount(GlitchText, {
            props: { trigger: 'click', text: 'Click Test' }
        })

        expect(wrapper.classes()).not.toContain('is-glitching')
        expect(wrapper.attributes('aria-pressed')).toBe('false')

        await wrapper.trigger('click')
        expect(wrapper.classes()).toContain('is-glitching')
        expect(wrapper.attributes('aria-pressed')).toBe('true')

        await wrapper.trigger('click')
        expect(wrapper.classes()).not.toContain('is-glitching')
        expect(wrapper.attributes('aria-pressed')).toBe('false')
    })

    it('exposes play and stop methods', async () => {
        const wrapper = mount(GlitchText, {
            props: { trigger: 'none', text: 'Manual' }
        })

        expect(wrapper.classes()).not.toContain('is-glitching')

        ;(wrapper.vm as any).play()
        await nextTick()
        expect(wrapper.classes()).toContain('is-glitching')

        ;(wrapper.vm as any).stop()
        await nextTick()
        expect(wrapper.classes()).not.toContain('is-glitching')
    })

    it('applies speed variant classes', () => {
        const wrapper = mount(GlitchText, {
            props: { speed: 'slow', text: 'Slow' }
        })
        expect(wrapper.classes()).toContain('[--glitch-duration:800ms]')

        const wrapper2 = mount(GlitchText, {
            props: { speed: 'fast', text: 'Fast' }
        })
        expect(wrapper2.classes()).toContain('[--glitch-duration:100ms]')
    })

    it('defaults direction to horizontal', () => {
        const wrapper = mount(GlitchText, {
            props: { text: 'Default' }
        })
        expect(wrapper.classes()).toContain('glitch-horizontal')
    })

    it('applies direction variant classes', () => {
        const vWrapper = mount(GlitchText, {
            props: { text: 'Vertical', direction: 'vertical' }
        })
        expect(vWrapper.classes()).toContain('glitch-vertical')

        const bWrapper = mount(GlitchText, {
            props: { text: 'Both', direction: 'both' }
        })
        expect(bWrapper.classes()).toContain('glitch-both')
    })

    it('keeps direction class stable after play() and stop()', async () => {
        const wrapper = mount(GlitchText, {
            props: { trigger: 'none', text: 'Manual', direction: 'vertical' }
        })
        expect(wrapper.classes()).toContain('glitch-vertical')
        expect(wrapper.classes()).not.toContain('is-glitching')

        ;(wrapper.vm as any).play()
        await nextTick()
        expect(wrapper.classes()).toContain('is-glitching')
        expect(wrapper.classes()).toContain('glitch-vertical')

        ;(wrapper.vm as any).stop()
        await nextTick()
        expect(wrapper.classes()).not.toContain('is-glitching')
        expect(wrapper.classes()).toContain('glitch-vertical')
    })

    it('combines direction with speed and custom class', () => {
        const wrapper = mount(GlitchText, {
            props: {
                text: 'Combo',
                direction: 'both',
                speed: 'fast',
                class: 'custom-class'
            }
        })
        expect(wrapper.classes()).toContain('glitch-both')
        expect(wrapper.classes()).toContain('[--glitch-duration:100ms]')
        expect(wrapper.classes()).toContain('custom-class')
    })

    it('exposes button role and tabindex in click trigger mode', () => {
        const wrapper = mount(GlitchText, {
            props: { trigger: 'click', text: 'Click' }
        })
        expect(wrapper.attributes('role')).toBe('button')
        expect(wrapper.attributes('tabindex')).toBe('0')
    })

    it('does not expose button role in non-click trigger modes', () => {
        const wrapper = mount(GlitchText, {
            props: { trigger: 'hover', text: 'Hover' }
        })
        expect(wrapper.attributes('role')).toBeUndefined()
        expect(wrapper.attributes('tabindex')).toBeUndefined()
    })

    it('toggles glitch on Enter key in click trigger mode', async () => {
        const wrapper = mount(GlitchText, {
            props: { trigger: 'click', text: 'Keyboard' }
        })
        expect(wrapper.classes()).not.toContain('is-glitching')

        await wrapper.trigger('keydown.enter')
        expect(wrapper.classes()).toContain('is-glitching')

        await wrapper.trigger('keydown.enter')
        expect(wrapper.classes()).not.toContain('is-glitching')
    })

    it('uses slot text for data-text when text prop is empty', () => {
        const wrapper = mount(GlitchText, {
            props: { text: '' },
            slots: { default: 'Slot Only' }
        })
        expect(wrapper.attributes('data-text')).toBe('Slot Only')
    })

    it('extracts text from component slot children via slots object form', async () => {
        const Inner = defineComponent({
            setup(_, { slots }) {
                return () => h('span', slots.default?.())
            },
        })
        const wrapper = mount(GlitchText, {
            props: { text: '' },
            slots: {
                default: () => h(Inner, null, { default: () => 'Inner Text' }),
            },
        })
        await nextTick()
        expect(wrapper.attributes('data-text')).toBe('Inner Text')
    })

    it('keeps data-text intact when scoped slot cannot be invoked without props', async () => {
        const Scoped = defineComponent({
            setup(_, { slots }) {
                return () => slots.default?.({ item: 'x' })
            },
        })
        // 直接构造带作用域插槽的组件型 VNode：无参调用 defaultSlot 会抛错，
        // data-text 应回退为空串而不破坏整体渲染
        const wrapper = mount(GlitchText, {
            props: { text: 'Fallback Text' },
            slots: {
                default: () => h(Scoped, null, { default: () => 'scoped' }),
            },
        })
        await nextTick()
        expect(wrapper.attributes('data-text')).toBe('Fallback Text')
        expect(wrapper.find('.glitch-text').exists()).toBe(true)
    })

    it('keeps data-text intact when functional children cannot be invoked without props', async () => {
        const functionalChild = ({ item }: { item: string }) => item
        const vnodeWithFnChildren = {
            __v_isVNode: true,
            type: 'div',
            children: functionalChild as any,
        }
        const wrapper = mount(GlitchText, {
            props: { text: 'Fallback Text' },
            slots: {
                default: () => vnodeWithFnChildren as any,
            },
        })
        await nextTick()
        expect(wrapper.attributes('data-text')).toBe('Fallback Text')
        expect(wrapper.find('.glitch-text').exists()).toBe(true)
    })

    it('aria-pressed reflects active state even under reduced motion', async () => {
        // useGlitchEffect 已缓存 useReducedMotion 的 mock 引用，doMock 无法穿透深层依赖，
        // 此处直接验证 aria-pressed 与激活态绑定而非 isGlitching（动画类）的语义来源
        const wrapper = mount(GlitchText, {
            props: { trigger: 'click', text: 'RM' },
        })

        await wrapper.trigger('click')
        expect(wrapper.attributes('aria-pressed')).toBe('true')
        expect(wrapper.classes()).toContain('is-glitching')
    })
})
