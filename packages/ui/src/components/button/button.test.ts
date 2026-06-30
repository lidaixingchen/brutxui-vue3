import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button', () => {
    it('renders with default variant and size', () => {
        const wrapper = mount(Button)
        expect(wrapper.find('button').exists()).toBe(true)
        expect(wrapper.classes()).toContain('bg-brutal-bg')
        expect(wrapper.classes()).toContain('h-11')
    })

    it('applies variant classes', async () => {
        const variants = [
            { variant: 'default' as const, expectedClass: 'bg-brutal-bg' },
            { variant: 'primary' as const, expectedClass: 'bg-brutal-primary' },
            { variant: 'secondary' as const, expectedClass: 'bg-brutal-secondary' },
            { variant: 'accent' as const, expectedClass: 'bg-brutal-accent' },
            { variant: 'danger' as const, expectedClass: 'bg-brutal-destructive' },
            { variant: 'success' as const, expectedClass: 'bg-brutal-success' },
            { variant: 'outline' as const, expectedClass: 'bg-transparent' },
            { variant: 'ghost' as const, expectedClass: 'border-transparent' },
            { variant: 'link' as const, expectedClass: 'underline-offset-4' },
        ]

        const wrapper = mount(Button)
        for (const { variant, expectedClass } of variants) {
            await wrapper.setProps({ variant } as any)
            expect(wrapper.classes()).toContain(expectedClass)
        }
    })

    it('applies size classes', async () => {
        const sizes = [
            { size: 'sm' as const, expectedClass: 'h-9' },
            { size: 'default' as const, expectedClass: 'h-11' },
            { size: 'lg' as const, expectedClass: 'h-14' },
            { size: 'xl' as const, expectedClass: 'h-16' },
            { size: 'icon' as const, expectedClass: 'w-11' },
        ]

        const wrapper = mount(Button)
        for (const { size, expectedClass } of sizes) {
            await wrapper.setProps({ size } as any)
            expect(wrapper.classes()).toContain(expectedClass)
        }
    })

    it('renders slot content', () => {
        const wrapper = mount(Button, {
            slots: { default: 'Click me' },
        })
        expect(wrapper.text()).toBe('Click me')
    })

    it('shows loading spinner when loading=true', () => {
        const wrapper = mount(Button, {
            props: { loading: true },
        })
        const svg = wrapper.find('svg')
        expect(svg.exists()).toBe(true)
        expect(svg.classes()).toContain('animate-spin')
    })

    it('links loader icon size to button size via shared iconSizeVariants', async () => {
        const cases = [
            { size: 'sm' as const, expected: ['h-3', 'w-3'] },
            { size: 'default' as const, expected: ['h-4', 'w-4'] },
            { size: 'lg' as const, expected: ['h-5', 'w-5'] },
            { size: 'xl' as const, expected: ['h-6', 'w-6'] },
        ]
        const wrapper = mount(Button, {
            props: { loading: true },
        })
        for (const { size, expected } of cases) {
            await wrapper.setProps({ size } as any)
            const svg = wrapper.find('svg')
            for (const cls of expected) {
                expect(svg.classes()).toContain(cls)
            }
        }
    })

    it('falls back to default icon size for icon button', () => {
        const wrapper = mount(Button, {
            props: { loading: true, size: 'icon' },
        })
        const svg = wrapper.find('svg')
        expect(svg.classes()).toContain('h-4')
        expect(svg.classes()).toContain('w-4')
    })

    it('is disabled when disabled=true', () => {
        const wrapper = mount(Button, {
            props: { disabled: true },
        })
        expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })

    it('is disabled when loading=true', () => {
        const wrapper = mount(Button, {
            props: { loading: true },
        })
        expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })

    it('merges custom class prop', () => {
        const wrapper = mount(Button, {
            props: { class: 'custom-class' },
        })
        expect(wrapper.classes()).toContain('custom-class')
    })

    it('emits click event when clicked', async () => {
        const onClick = vi.fn()
        const wrapper = mount(Button, {
            attrs: { onClick },
        })
        await wrapper.trigger('click')
        expect(onClick).toHaveBeenCalled()
    })
})
