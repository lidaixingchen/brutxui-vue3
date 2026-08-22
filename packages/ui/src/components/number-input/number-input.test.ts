import { mount } from '@vue/test-utils'
import { vi, beforeEach } from 'vitest'
import NumberInput from './NumberInput.vue'

const hapticsMocks = vi.hoisted(() => {
    const snap = vi.fn()
    const click = vi.fn()
    const beep = vi.fn()
    const useBrutalHaptics = vi.fn(() => ({ snap, click, beep }))
    return { snap, click, beep, useBrutalHaptics }
})

vi.mock('@/composables/useBrutalHaptics', () => ({
    useBrutalHaptics: hapticsMocks.useBrutalHaptics,
}))

const reducedMotionMocks = vi.hoisted(() => ({
    useReducedMotion: vi.fn(() => ({ value: false })),
}))

vi.mock('@/composables/useReducedMotion', () => ({
    useReducedMotion: reducedMotionMocks.useReducedMotion,
}))

describe('NumberInput', () => {
    beforeEach(() => {
        hapticsMocks.click.mockClear()
        hapticsMocks.useBrutalHaptics.mockClear()
        hapticsMocks.useBrutalHaptics.mockImplementation(() => ({
            snap: hapticsMocks.snap,
            click: hapticsMocks.click,
            beep: hapticsMocks.beep,
        }))
        reducedMotionMocks.useReducedMotion.mockReturnValue({ value: false })
    })

    it('renders with split layout by default', () => {
        const wrapper = mount(NumberInput)
        const root = wrapper.find('[role="group"]')
        expect(root.exists()).toBe(true)
        expect(root.classes()).toContain('flex')
        expect(root.classes()).toContain('border-3')
        expect(root.classes()).toContain('border-brutal')
        expect(root.classes()).toContain('shadow-brutal')
        expect(root.classes()).toContain('rounded-brutal')
    })

    it('renders with stacked layout', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'stacked' },
        })
        const root = wrapper.find('[role="group"]')
        expect(root.exists()).toBe(true)
        expect(root.classes()).toContain('flex')
        const input = wrapper.find('[role="spinbutton"]')
        expect(input.exists()).toBe(true)
    })

    it('applies custom class', () => {
        const wrapper = mount(NumberInput, {
            props: { class: 'custom-class' },
        })
        const root = wrapper.find('[role="group"]')
        expect(root.classes()).toContain('custom-class')
    })

    it('passes placeholder prop to input', () => {
        const wrapper = mount(NumberInput, {
            props: { placeholder: 'Enter number' },
        })
        const input = wrapper.find('input')
        expect(input.attributes('placeholder')).toBe('Enter number')
    })

    it('renders split layout with decrement and increment buttons', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'split' },
        })
        const decrement = wrapper.find('[aria-label="Decrease"]')
        const increment = wrapper.find('[aria-label="Increase"]')
        expect(decrement.exists()).toBe(true)
        expect(increment.exists()).toBe(true)
    })

    it('renders stacked layout with increment and decrement buttons', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'stacked' },
        })
        const decrement = wrapper.find('[aria-label="Decrease"]')
        const increment = wrapper.find('[aria-label="Increase"]')
        expect(decrement.exists()).toBe(true)
        expect(increment.exists()).toBe(true)
        expect(decrement.classes()).toContain('border-t-3')
        expect(decrement.classes()).not.toContain('border-b-3')
    })

    it('applies root variant classes', () => {
        const wrapper = mount(NumberInput)
        const root = wrapper.find('[role="group"]')
        expect(root.classes()).toContain('bg-brutal-bg')
        expect(root.classes()).toContain('overflow-hidden')
        expect(root.classes()).toContain('transition-all')
    })

    it('has input with spinbutton role', () => {
        const wrapper = mount(NumberInput, {
            attachTo: document.body,
        })
        const input = wrapper.find('[role="spinbutton"]')
        expect(input.exists()).toBe(true)
    })

    it('displays initial modelValue', () => {
        const wrapper = mount(NumberInput, {
            props: { modelValue: 42 },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        expect((input.element as HTMLInputElement).value).toBe('42')
    })

    it('increment button has correct aria-label', () => {
        const wrapper = mount(NumberInput, {
            attachTo: document.body,
        })
        expect(wrapper.find('[aria-label="Increase"]').exists()).toBe(true)
    })

    it('decrement button has correct aria-label', () => {
        const wrapper = mount(NumberInput, {
            attachTo: document.body,
        })
        expect(wrapper.find('[aria-label="Decrease"]').exists()).toBe(true)
    })

    it('applies default icon size to increment/decrement icons', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'split' },
        })
        const icons = wrapper.findAll('[role="group"] svg')
        expect(icons.length).toBeGreaterThan(0)
        for (const icon of icons) {
            expect(icon.classes()).toContain('h-4')
            expect(icon.classes()).toContain('w-4')
        }
    })

    it('links icon size to lg via iconSize prop', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'split', iconSize: 'lg' },
        })
        const icons = wrapper.findAll('[role="group"] svg')
        expect(icons.length).toBeGreaterThan(0)
        for (const icon of icons) {
            expect(icon.classes()).toContain('h-5')
            expect(icon.classes()).toContain('w-5')
            expect(icon.classes()).not.toContain('h-4')
        }
    })

    it('does not leak iconSize as an unknown attribute onto the root element', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'split', iconSize: 'lg' },
        })
        const root = wrapper.find('[role="group"]')
        expect(root.attributes('iconsize')).toBeUndefined()
        expect(root.attributes('iconSize')).toBeUndefined()
    })
})

describe('NumberInput 机械键帽与 Drum Ticker', () => {
    it('步进按钮带 3D 键帽侧面厚度（border-b-4）与按压消除侧面', () => {
        const wrapper = mount(NumberInput)
        for (const btn of wrapper.findAll('button')) {
            expect(btn.classes()).toContain('border-b-4')
            expect(btn.classes()).toContain('active:border-b-0')
            expect(btn.classes()).toContain('active:translate-y-1')
        }
    })

    it('sound=true 时点击步进触发 click 音效，sound 选项随 prop 传递', async () => {
        const wrapper = mount(NumberInput, { props: { sound: true } })
        expect(hapticsMocks.useBrutalHaptics).toHaveBeenCalledWith({ sound: true })
        await wrapper.findAll('button')[0]!.trigger('click')
        expect(hapticsMocks.click).toHaveBeenCalledTimes(1)
        wrapper.unmount()
    })

    it('默认静音：sound 缺省时以 false 传递给门面', () => {
        mount(NumberInput)
        expect(hapticsMocks.useBrutalHaptics).toHaveBeenCalledWith({ sound: false })
    })

    it('modelValue 变化触发 Drum Ticker 翻页动效类并在动画结束后清除', async () => {
        vi.useFakeTimers()
        const wrapper = mount(NumberInput, {
            props: { modelValue: 1 },
            attachTo: document.body,
        })
        await vi.advanceTimersByTimeAsync(0)
        await wrapper.setProps({ modelValue: 2 })
        expect(wrapper.html()).toContain('animate-brutal-drum')

        const input = wrapper.find('input')
        await input.trigger('animationend')
        expect(wrapper.html()).not.toContain('animate-brutal-drum')
        vi.useRealTimers()
        wrapper.unmount()
    })

    it('prefers-reduced-motion 下数值变化不播 Drum Ticker 动画', async () => {
        reducedMotionMocks.useReducedMotion.mockReturnValue({ value: true })
        const wrapper = mount(NumberInput, {
            props: { modelValue: 1 },
            attachTo: document.body,
        })
        await wrapper.setProps({ modelValue: 2 })
        expect(wrapper.html()).not.toContain('animate-brutal-drum')
        wrapper.unmount()
    })
})
