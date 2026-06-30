import { mount } from '@vue/test-utils'
import Progress from './Progress.vue'

describe('Progress', () => {
    it('renders with default modelValue and max', () => {
        const wrapper = mount(Progress, { attachTo: document.body })
        const classes = wrapper.classes()
        expect(classes).toContain('relative')
        expect(classes).toContain('h-6')
        expect(classes).toContain('w-full')
        expect(classes).toContain('overflow-hidden')
        expect(classes).toContain('rounded-brutal')
        expect(classes).toContain('border-3')
        expect(classes).toContain('border-brutal')
        expect(classes).toContain('bg-brutal-bg')
        expect(classes).toContain('shadow-brutal-sm')
    })

    it('has progress role and aria attributes', () => {
        const wrapper = mount(Progress, { attachTo: document.body })
        expect(wrapper.attributes('role')).toBe('progressbar')
    })

    it('updates progress indicator style based on modelValue', async () => {
        const wrapper = mount(Progress, {
            props: { modelValue: 50, max: 100 },
            attachTo: document.body,
        })
        const indicator = wrapper.find('.bg-brutal-primary')
        expect(indicator.exists()).toBe(true)
        const style = indicator.attributes('style')
        expect(style).toContain('translateX(-50%)')

        await wrapper.setProps({ modelValue: 75 } as any)
        const updatedStyle = indicator.attributes('style')
        expect(updatedStyle).toContain('translateX(-25%)')
    })

    it('shows full progress at 100%', () => {
        const wrapper = mount(Progress, {
            props: { modelValue: 100, max: 100 },
            attachTo: document.body,
        })
        const indicator = wrapper.find('.bg-brutal-primary')
        const style = indicator.attributes('style')
        expect(style).toContain('translateX(-0%)')
    })

    it('shows zero progress at 0', () => {
        const wrapper = mount(Progress, {
            props: { modelValue: 0, max: 100 },
            attachTo: document.body,
        })
        const indicator = wrapper.find('.bg-brutal-primary')
        const style = indicator.attributes('style')
        expect(style).toContain('translateX(-100%)')
    })

    it('applies custom class', () => {
        const wrapper = mount(Progress, {
            props: { class: 'my-progress' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('my-progress')
    })

    it('has aria-valuemin and aria-valuemax attributes', () => {
        const wrapper = mount(Progress, {
            props: { modelValue: 30, max: 100 },
            attachTo: document.body,
        })
        expect(wrapper.attributes('aria-valuemin')).toBe('0')
        expect(wrapper.attributes('aria-valuemax')).toBe('100')
        expect(wrapper.attributes('aria-valuenow')).toBe('30')
    })

    describe('indeterminate', () => {
        it('applies animate-indeterminate and w-1/2 classes to indicator when indeterminate=true', () => {
            const wrapper = mount(Progress, {
                props: { indeterminate: true },
                attachTo: document.body,
            })
            const indicator = wrapper.find('.bg-brutal-primary')
            expect(indicator.exists()).toBe(true)
            expect(indicator.classes()).toContain('animate-indeterminate')
            expect(indicator.classes()).toContain('w-1/2')
        })

        it('does not apply transform style to indicator when indeterminate=true', () => {
            const wrapper = mount(Progress, {
                props: { indeterminate: true, modelValue: 50 },
                attachTo: document.body,
            })
            const indicator = wrapper.find('.bg-brutal-primary')
            const style = indicator.attributes('style')
            expect(style).toBeUndefined()
        })

        it('sets data-state to indeterminate on root when indeterminate=true', () => {
            const wrapper = mount(Progress, {
                props: { indeterminate: true },
                attachTo: document.body,
            })
            expect(wrapper.attributes('data-state')).toBe('indeterminate')
        })

        it('does not set aria-valuenow when indeterminate=true', () => {
            const wrapper = mount(Progress, {
                props: { indeterminate: true, modelValue: 50 },
                attachTo: document.body,
            })
            expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
        })

        it('sets data-state to loading when indeterminate=false and value < max', () => {
            const wrapper = mount(Progress, {
                props: { indeterminate: false, modelValue: 50, max: 100 },
                attachTo: document.body,
            })
            expect(wrapper.attributes('data-state')).toBe('loading')
        })

        it('defaults indeterminate to false', () => {
            const wrapper = mount(Progress, {
                props: { modelValue: 50 },
                attachTo: document.body,
            })
            const indicator = wrapper.find('.bg-brutal-primary')
            expect(indicator.classes()).not.toContain('animate-indeterminate')
            expect(wrapper.attributes('data-state')).toBe('loading')
        })
    })

    describe('showLabel', () => {
        it('renders percentage label when showLabel=true', () => {
            const wrapper = mount(Progress, {
                props: { showLabel: true, modelValue: 42, max: 100 },
                attachTo: document.body,
            })
            const label = wrapper.find('span.absolute.inset-0')
            expect(label.exists()).toBe(true)
            expect(label.text()).toBe('42%')
        })

        it('rounds percentage label to integer', () => {
            const wrapper = mount(Progress, {
                props: { showLabel: true, modelValue: 42.7, max: 100 },
                attachTo: document.body,
            })
            const label = wrapper.find('span.absolute.inset-0')
            expect(label.text()).toBe('43%')
        })

        it('does not render label when showLabel=false', () => {
            const wrapper = mount(Progress, {
                props: { showLabel: false, modelValue: 50 },
                attachTo: document.body,
            })
            const label = wrapper.find('span.absolute.inset-0')
            expect(label.exists()).toBe(false)
        })

        it('does not render label when indeterminate=true even if showLabel=true', () => {
            const wrapper = mount(Progress, {
                props: { showLabel: true, indeterminate: true },
                attachTo: document.body,
            })
            const label = wrapper.find('span.absolute.inset-0')
            expect(label.exists()).toBe(false)
        })

        it('computes percentage relative to max', () => {
            const wrapper = mount(Progress, {
                props: { showLabel: true, modelValue: 1, max: 4 },
                attachTo: document.body,
            })
            const label = wrapper.find('span.absolute.inset-0')
            expect(label.text()).toBe('25%')
        })

        it('label has pointer-events-none class', () => {
            const wrapper = mount(Progress, {
                props: { showLabel: true, modelValue: 50 },
                attachTo: document.body,
            })
            const label = wrapper.find('span.absolute.inset-0')
            expect(label.classes()).toContain('pointer-events-none')
        })
    })
})
