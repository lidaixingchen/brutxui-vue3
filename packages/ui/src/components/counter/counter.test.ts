import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Counter from './Counter.vue'

interface CounterExposed {
    play: () => void
    stop: () => void
}

function assertCounterExposed(vm: unknown): asserts vm is CounterExposed {
    expect(vm).toHaveProperty('play')
    expect(vm).toHaveProperty('stop')
}

function getDisplaySpan(wrapper: ReturnType<typeof mount>) {
    return wrapper.find('[aria-live="polite"]')
}

describe('Counter', () => {
    let rafCallCount: number

    beforeEach(() => {
        rafCallCount = 0
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            rafCallCount++
            cb(rafCallCount === 1 ? 0 : 3000)
            return rafCallCount
        })
        vi.stubGlobal('cancelAnimationFrame', () => {})
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('renders with default size classes', () => {
        const wrapper = mount(Counter, {
            props: { to: 100 },
        })
        const display = getDisplaySpan(wrapper)
        const classes = display.classes()
        expect(classes).toContain('inline-flex')
        expect(classes).toContain('items-baseline')
        expect(classes).toContain('tabular-nums')
        expect(classes).toContain('font-black')
        expect(classes).toContain('text-brutal-fg')
        expect(classes).toContain('text-4xl')
    })

    it('applies sm size variant classes', () => {
        const wrapper = mount(Counter, {
            props: { to: 50, size: 'sm' },
        })
        expect(getDisplaySpan(wrapper).classes()).toContain('text-2xl')
    })

    it('applies lg size variant classes', () => {
        const wrapper = mount(Counter, {
            props: { to: 50, size: 'lg' },
        })
        expect(getDisplaySpan(wrapper).classes()).toContain('text-6xl')
    })

    it('applies xl size variant classes', () => {
        const wrapper = mount(Counter, {
            props: { to: 50, size: 'xl' },
        })
        expect(getDisplaySpan(wrapper).classes()).toContain('text-8xl')
    })

    it('applies custom class', () => {
        const wrapper = mount(Counter, {
            props: { to: 100, class: 'my-counter' },
        })
        expect(getDisplaySpan(wrapper).classes()).toContain('my-counter')
    })

    it('renders title in container mode', () => {
        const wrapper = mount(Counter, {
            props: { to: 100, title: 'Active Users' },
        })
        expect(wrapper.element.tagName).toBe('DIV')
        expect(wrapper.text()).toContain('Active Users')
    })

    it('renders title slot in container mode', () => {
        const wrapper = mount(Counter, {
            props: { to: 100 },
            slots: { title: '<span>Custom Title</span>' },
        })
        expect(wrapper.element.tagName).toBe('DIV')
        expect(wrapper.text()).toContain('Custom Title')
    })

    it('applies card container styling when card prop is true', () => {
        const wrapper = mount(Counter, {
            props: { to: 100, card: true },
        })
        expect(wrapper.classes()).toContain('border-2')
        expect(wrapper.classes()).toContain('border-brutal-black')
        expect(wrapper.classes()).toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]')
    })

    it('formats decimals with custom decimal separator', () => {
        const wrapper = mount(Counter, {
            props: { to: 1234.56, decimals: 2, decimalSeparator: ',', separator: '.' },
        })
        expect(wrapper.text()).toContain('1.234,56')
    })

    it('shows prefix in display', () => {
        const wrapper = mount(Counter, {
            props: { to: 100, prefix: '$' },
        })
        expect(wrapper.text()).toContain('$')
    })

    it('shows suffix in display', () => {
        const wrapper = mount(Counter, {
            props: { to: 100, suffix: '%' },
        })
        expect(wrapper.text()).toContain('%')
    })

    it('has aria-live="polite"', () => {
        const wrapper = mount(Counter, {
            props: { to: 100 },
        })
        expect(getDisplaySpan(wrapper).attributes('aria-live')).toBe('polite')
    })

    it('has aria-label attribute', () => {
        const wrapper = mount(Counter, {
            props: { to: 100 },
        })
        expect(getDisplaySpan(wrapper).attributes('aria-label')).toBeTruthy()
    })

    it('renders as span element', () => {
        const wrapper = mount(Counter, {
            props: { to: 100 },
        })
        expect(wrapper.element.tagName).toBe('SPAN')
    })

    it('mounts when ResizeObserver is unavailable', async () => {
        vi.stubGlobal('ResizeObserver', undefined)
        expect(() => {
            mount(Counter, {
                props: { to: 100 },
            })
        }).not.toThrow()
        await nextTick()
    })

    it('exposes play and stop methods', () => {
        const wrapper = mount(Counter, {
            props: { to: 100 },
        })
        assertCounterExposed(wrapper.vm)
        const vm = wrapper.vm
        expect(typeof vm.play).toBe('function')
        expect(typeof vm.stop).toBe('function')
    })

    it('applies default variant classes', () => {
        const wrapper = mount(Counter, {
            props: { to: 100 },
        })
        expect(getDisplaySpan(wrapper).classes()).toContain('text-brutal-fg')
    })

    it('applies primary variant classes', () => {
        const wrapper = mount(Counter, {
            props: { to: 100, variant: 'primary' },
        })
        expect(getDisplaySpan(wrapper).classes()).toContain('text-brutal-primary')
    })

    it('applies accent variant classes', () => {
        const wrapper = mount(Counter, {
            props: { to: 100, variant: 'accent' },
        })
        expect(getDisplaySpan(wrapper).classes()).toContain('text-brutal-accent')
    })

    it('applies success variant classes', () => {
        const wrapper = mount(Counter, {
            props: { to: 100, variant: 'success' },
        })
        expect(getDisplaySpan(wrapper).classes()).toContain('text-brutal-success')
    })

    it('applies danger variant classes', () => {
        const wrapper = mount(Counter, {
            props: { to: 100, variant: 'danger' },
        })
        expect(getDisplaySpan(wrapper).classes()).toContain('text-brutal-destructive')
    })
})
