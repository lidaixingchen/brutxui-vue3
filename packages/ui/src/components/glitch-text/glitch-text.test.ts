import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
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

    it('toggles animation on click when trigger is click', async () => {
        const wrapper = mount(GlitchText, {
            props: { trigger: 'click', text: 'Click Test' }
        })

        expect(wrapper.classes()).not.toContain('is-glitching')

        await wrapper.trigger('click')
        expect(wrapper.classes()).toContain('is-glitching')

        await wrapper.trigger('click')
        expect(wrapper.classes()).not.toContain('is-glitching')
    })

    it('exposes play and stop methods', async () => {
        const wrapper = mount(GlitchText, {
            props: { trigger: 'none', text: 'Manual' }
        })

        expect(wrapper.classes()).not.toContain('is-glitching')

        wrapper.vm.play()
        await nextTick()
        expect(wrapper.classes()).toContain('is-glitching')

        wrapper.vm.stop()
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

        wrapper.vm.play()
        await nextTick()
        expect(wrapper.classes()).toContain('is-glitching')
        expect(wrapper.classes()).toContain('glitch-vertical')

        wrapper.vm.stop()
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
})
