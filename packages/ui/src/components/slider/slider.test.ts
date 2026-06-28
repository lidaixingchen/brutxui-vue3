import { mount } from '@vue/test-utils'
import Slider from './Slider.vue'

describe('Slider', () => {
    it('renders with slider role', () => {
        const wrapper = mount(Slider, {
            attachTo: document.body,
        })
        expect(wrapper.find('[role="slider"]').exists()).toBe(true)
    })

    it('emits update:modelValue on ArrowRight', async () => {
        const wrapper = mount(Slider, {
            props: {
                modelValue: [50],
                min: 0,
                max: 100,
                step: 1,
            },
            attachTo: document.body,
        })
        const sliderImpl = wrapper.find('[data-slider-impl]')
        await sliderImpl.trigger('keydown', { key: 'ArrowRight' })
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('emits update:modelValue on ArrowLeft', async () => {
        const wrapper = mount(Slider, {
            props: {
                modelValue: [50],
                min: 0,
                max: 100,
                step: 1,
            },
            attachTo: document.body,
        })
        const sliderImpl = wrapper.find('[data-slider-impl]')
        await sliderImpl.trigger('keydown', { key: 'ArrowLeft' })
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('applies custom class', () => {
        const wrapper = mount(Slider, {
            props: { class: 'custom-class' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('custom-class')
    })

    it('respects disabled prop', () => {
        const wrapper = mount(Slider, {
            props: { disabled: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="slider"]')
        expect(el.attributes('data-disabled') !== undefined || el.attributes('aria-disabled') === 'true').toBe(true)
    })

    describe('orientation', () => {
        it('defaults to horizontal', () => {
            const wrapper = mount(Slider, { attachTo: document.body })
            const classes = wrapper.classes()
            expect(classes).toContain('items-center')
            expect(classes).toContain('w-full')
            expect(classes).not.toContain('flex-col')
        })

        it('applies flex-col h-full justify-center classes when vertical', () => {
            const wrapper = mount(Slider, {
                props: { orientation: 'vertical' },
                attachTo: document.body,
            })
            const classes = wrapper.classes()
            expect(classes).toContain('flex-col')
            expect(classes).toContain('h-full')
            expect(classes).toContain('justify-center')
        })

        it('passes orientation to SliderRootPrimitive (data-orientation on slider impl)', () => {
            const wrapper = mount(Slider, {
                props: { orientation: 'vertical' },
                attachTo: document.body,
            })
            const sliderImpl = wrapper.find('[data-slider-impl]')
            expect(sliderImpl.attributes('data-orientation')).toBe('vertical')
        })

        it('sets data-orientation horizontal by default on slider impl', () => {
            const wrapper = mount(Slider, { attachTo: document.body })
            const sliderImpl = wrapper.find('[data-slider-impl]')
            expect(sliderImpl.attributes('data-orientation')).toBe('horizontal')
        })

        it('sets aria-orientation on thumb', () => {
            const wrapper = mount(Slider, {
                props: { orientation: 'vertical' },
                attachTo: document.body,
            })
            const thumb = wrapper.find('[role="slider"]')
            expect(thumb.attributes('aria-orientation')).toBe('vertical')
        })

        it('track has w-full h-[var] for horizontal', () => {
            const wrapper = mount(Slider, { attachTo: document.body })
            const track = wrapper.find('[data-slider-impl] > span')
            expect(track.exists()).toBe(true)
        })
    })

    describe('marks', () => {
        it('does not render marks when marks prop is undefined', () => {
            const wrapper = mount(Slider, { attachTo: document.body })
            const marks = wrapper.findAll('[aria-hidden="true"]')
            expect(marks.length).toBe(0)
        })

        it('renders marks for each value in marks prop', () => {
            const wrapper = mount(Slider, {
                props: { marks: [0, 25, 50, 75, 100] },
                attachTo: document.body,
            })
            const marks = wrapper.findAll('[aria-hidden="true"]')
            expect(marks.length).toBe(5)
        })

        it('positions marks with left percentage for horizontal', () => {
            const wrapper = mount(Slider, {
                props: { marks: [25, 75], min: 0, max: 100 },
                attachTo: document.body,
            })
            const marks = wrapper.findAll('[aria-hidden="true"]')
            expect(marks[0].attributes('style')).toContain('left: 25%')
            expect(marks[1].attributes('style')).toContain('left: 75%')
        })

        it('positions marks with bottom percentage for vertical', () => {
            const wrapper = mount(Slider, {
                props: { marks: [25, 75], min: 0, max: 100, orientation: 'vertical' },
                attachTo: document.body,
            })
            const marks = wrapper.findAll('[aria-hidden="true"]')
            expect(marks[0].attributes('style')).toContain('bottom: 25%')
            expect(marks[1].attributes('style')).toContain('bottom: 75%')
        })

        it('computes mark position relative to min and max', () => {
            const wrapper = mount(Slider, {
                props: { marks: [1, 3], min: 0, max: 4 },
                attachTo: document.body,
            })
            const marks = wrapper.findAll('[aria-hidden="true"]')
            expect(marks[0].attributes('style')).toContain('left: 25%')
            expect(marks[1].attributes('style')).toContain('left: 75%')
        })
    })

    describe('tooltip', () => {
        it('does not render tooltip when showTooltip is false', () => {
            const wrapper = mount(Slider, {
                props: { showTooltip: false, modelValue: [50] },
                attachTo: document.body,
            })
            expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
        })

        it('does not render tooltip initially when showTooltip is true', () => {
            const wrapper = mount(Slider, {
                props: { showTooltip: true, modelValue: [50] },
                attachTo: document.body,
            })
            expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
        })

        it('renders tooltip on thumb focus', async () => {
            const wrapper = mount(Slider, {
                props: { showTooltip: true, modelValue: [50] },
                attachTo: document.body,
            })
            const thumb = wrapper.find('[role="slider"]')
            await thumb.trigger('focus')
            expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
        })

        it('tooltip displays current thumb value', async () => {
            const wrapper = mount(Slider, {
                props: { showTooltip: true, modelValue: [42] },
                attachTo: document.body,
            })
            const thumb = wrapper.find('[role="slider"]')
            await thumb.trigger('focus')
            const tooltip = wrapper.find('[role="tooltip"]')
            expect(tooltip.text()).toBe('42')
        })

        it('hides tooltip on thumb blur', async () => {
            const wrapper = mount(Slider, {
                props: { showTooltip: true, modelValue: [50] },
                attachTo: document.body,
            })
            const thumb = wrapper.find('[role="slider"]')
            await thumb.trigger('focus')
            expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
            await thumb.trigger('blur')
            expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
        })

        it('renders tooltip on pointerenter', async () => {
            const wrapper = mount(Slider, {
                props: { showTooltip: true, modelValue: [50] },
                attachTo: document.body,
            })
            const thumb = wrapper.find('[role="slider"]')
            await thumb.trigger('pointerenter')
            expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
        })

        it('hides tooltip on pointerleave', async () => {
            const wrapper = mount(Slider, {
                props: { showTooltip: true, modelValue: [50] },
                attachTo: document.body,
            })
            const thumb = wrapper.find('[role="slider"]')
            await thumb.trigger('pointerenter')
            expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
            await thumb.trigger('pointerleave')
            expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
        })

        it('tooltip has pointer-events-none class', async () => {
            const wrapper = mount(Slider, {
                props: { showTooltip: true, modelValue: [50] },
                attachTo: document.body,
            })
            const thumb = wrapper.find('[role="slider"]')
            await thumb.trigger('focus')
            const tooltip = wrapper.find('[role="tooltip"]')
            expect(tooltip.classes()).toContain('pointer-events-none')
        })
    })
})
