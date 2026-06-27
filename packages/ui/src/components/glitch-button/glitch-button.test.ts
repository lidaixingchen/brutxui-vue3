import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import GlitchButton from './GlitchButton.vue'

vi.mock('../../composables/useReducedMotion', () => ({
    useReducedMotion: () => ref(false)
}))

describe('GlitchButton', () => {
    it('renders with default class names', () => {
        const wrapper = mount(GlitchButton, {
            slots: { default: 'Click Me' }
        })
        expect(wrapper.text()).toBe('Click Me')
        expect(wrapper.classes()).toContain('glitch-button')
        expect(wrapper.classes()).toContain('relative')
    })

    it('renders as button by default', () => {
        const wrapper = mount(GlitchButton)
        expect(wrapper.element.tagName).toBe('BUTTON')
    })

    it('applies variant classes', () => {
        const wrapper = mount(GlitchButton, {
            props: { variant: 'primary' }
        })
        expect(wrapper.classes()).toContain('bg-brutal-primary')
    })

    it('applies size classes', () => {
        const wrapper = mount(GlitchButton, {
            props: { size: 'lg' }
        })
        expect(wrapper.classes()).toContain('h-14')
    })

    it('applies speed variant classes', () => {
        const wrapper = mount(GlitchButton, {
            props: { speed: 'slow' }
        })
        expect(wrapper.classes()).toContain('[--glitch-duration:800ms]')

        const wrapper2 = mount(GlitchButton, {
            props: { speed: 'fast' }
        })
        expect(wrapper2.classes()).toContain('[--glitch-duration:100ms]')
    })

    it('toggles animation on click when trigger is click', async () => {
        const wrapper = mount(GlitchButton, {
            props: { trigger: 'click' }
        })

        expect(wrapper.classes()).not.toContain('is-glitching')

        await wrapper.trigger('click')
        expect(wrapper.classes()).toContain('is-glitching')

        await wrapper.trigger('click')
        expect(wrapper.classes()).not.toContain('is-glitching')
    })

    it('does not toggle animation on click when disabled', async () => {
        const wrapper = mount(GlitchButton, {
            props: { trigger: 'click', disabled: true }
        })

        await wrapper.trigger('click')
        expect(wrapper.classes()).not.toContain('is-glitching')
    })

    it('exposes play and stop methods', async () => {
        const wrapper = mount(GlitchButton, {
            props: { trigger: 'none' }
        })

        expect(wrapper.classes()).not.toContain('is-glitching')

        wrapper.vm.play()
        await nextTick()
        expect(wrapper.classes()).toContain('is-glitching')

        wrapper.vm.stop()
        await nextTick()
        expect(wrapper.classes()).not.toContain('is-glitching')
    })

    it('applies disabled state', () => {
        const wrapper = mount(GlitchButton, {
            props: { disabled: true }
        })
        expect(wrapper.attributes('disabled')).toBeDefined()
        expect(wrapper.classes()).toContain('disabled:opacity-50')
    })

    it('shows loading spinner when loading', () => {
        const wrapper = mount(GlitchButton, {
            props: { loading: true }
        })
        expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('is disabled when loading', () => {
        const wrapper = mount(GlitchButton, {
            props: { loading: true }
        })
        expect(wrapper.attributes('disabled')).toBeDefined()
        expect(wrapper.attributes('aria-busy')).toBe('true')
    })
})