import { mount } from '@vue/test-utils'
import Card from './Card.vue'
import CardHeader from './CardHeader.vue'
import CardTitle from './CardTitle.vue'
import CardDescription from './CardDescription.vue'
import CardContent from './CardContent.vue'
import CardFooter from './CardFooter.vue'

describe('Card', () => {
    it('renders with default variant and padding', () => {
        const wrapper = mount(Card)
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('shadow-brutal')
        expect(wrapper.classes()).toContain('p-5')
    })

    it('applies variant classes', async () => {
        const variants = ['default', 'elevated', 'flat', 'interactive', 'primary', 'secondary'] as const

        for (const variant of variants) {
            const wrapper = mount(Card, { props: { variant } })

            if (variant === 'default') {
                expect(wrapper.classes()).toContain('shadow-brutal')
            }
            if (variant === 'elevated') {
                expect(wrapper.classes()).toContain('shadow-brutal-lg')
            }
            if (variant === 'flat') {
                expect(wrapper.classes()).toContain('shadow-none')
            }
            if (variant === 'interactive') {
                expect(wrapper.classes()).toContain('shadow-brutal')
                expect(wrapper.classes()).toContain('cursor-pointer')
            }
            if (variant === 'primary') {
                expect(wrapper.classes()).toContain('shadow-brutal-primary')
                expect(wrapper.classes()).toContain('border-brutal-primary')
            }
            if (variant === 'secondary') {
                expect(wrapper.classes()).toContain('shadow-brutal-secondary')
                expect(wrapper.classes()).toContain('border-brutal-secondary')
            }
        }
    })

    it('applies padding classes', () => {
        const paddings = ['none', 'sm', 'default', 'lg'] as const
        const expected = ['p-0', 'p-3', 'p-5', 'p-8']

        paddings.forEach((padding, i) => {
            const wrapper = mount(Card, { props: { padding } })
            expect(wrapper.classes()).toContain(expected[i])
        })
    })

    it('renders slot content', () => {
        const wrapper = mount(Card, {
            slots: { default: '<p>Card content</p>' },
        })
        expect(wrapper.text()).toBe('Card content')
    })

    it('applies custom class', () => {
        const wrapper = mount(Card, { props: { class: 'my-custom' } })
        expect(wrapper.classes()).toContain('my-custom')
    })

    it('applies accessibility attributes when interactive', () => {
        const wrapper = mount(Card, { props: { interactive: true } })
        expect(wrapper.attributes('role')).toBe('button')
        expect(wrapper.attributes('tabindex')).toBe('0')
    })

    it('applies accessibility attributes when variant is interactive', () => {
        const wrapper = mount(Card, { props: { variant: 'interactive' } })
        expect(wrapper.attributes('role')).toBe('button')
        expect(wrapper.attributes('tabindex')).toBe('0')
    })

    it('does not apply accessibility attributes when not interactive', () => {
        const wrapper = mount(Card)
        expect(wrapper.attributes('role')).toBeUndefined()
        expect(wrapper.attributes('tabindex')).toBeUndefined()
    })

    it('emits activate event with MouseEvent on click', async () => {
        const wrapper = mount(Card, { props: { interactive: true } })
        await wrapper.trigger('click')
        expect(wrapper.emitted('activate')).toBeTruthy()
        expect(wrapper.emitted('activate')![0][0]).toBeInstanceOf(MouseEvent)
    })

    it('emits activate on Enter keydown and Space keyup (WAI-ARIA button pattern)', async () => {
        const wrapper = mount(Card, { props: { interactive: true } })

        await wrapper.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('activate')).toBeTruthy()
        expect(wrapper.emitted('activate')![0][0]).toBeInstanceOf(KeyboardEvent)

        // 空格激活移到 keyup：keydown 阶段仅阻止滚动
        await wrapper.trigger('keydown', { key: ' ' })
        expect(wrapper.emitted('activate')).toHaveLength(1)

        await wrapper.trigger('keyup', { key: ' ' })
        expect(wrapper.emitted('activate')).toHaveLength(2)
        expect(wrapper.emitted('activate')![1][0]).toBeInstanceOf(KeyboardEvent)
    })

    it('ignores repeated keydown events (long-press)', async () => {
        const wrapper = mount(Card, { props: { interactive: true } })
        await wrapper.trigger('keydown', { key: 'Enter', repeat: true })
        expect(wrapper.emitted('activate')).toBeUndefined()
    })

    it('does not emit activate on click/keydown when not interactive', async () => {
        const wrapper = mount(Card)
        await wrapper.trigger('click')
        await wrapper.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('activate')).toBeFalsy()
    })

    it('does not emit activate when clicking a nested interactive element', async () => {
        const wrapper = mount(Card, {
            props: { interactive: true },
            slots: { default: '<button class="inner-btn">Action</button>' },
        })
        await wrapper.find('button.inner-btn').trigger('click')
        expect(wrapper.emitted('activate')).toBeUndefined()
    })

    it('emits activate when clicking the card background (not a nested interactive element)', async () => {
        const wrapper = mount(Card, {
            props: { interactive: true },
            slots: { default: '<button class="inner-btn">Action</button>' },
        })
        await wrapper.trigger('click')
        expect(wrapper.emitted('activate')).toHaveLength(1)
    })

    it('emits activate when clicking non-interactive content inside the card', async () => {
        // 卡片内部普通文本不是嵌套交互元素：即使其祖先是 role="button" 的卡片根，也应触发 activate
        const wrapper = mount(Card, {
            props: { interactive: true },
            slots: { default: '<span class="inner-text">Body</span>' },
        })
        await wrapper.find('span.inner-text').trigger('click')
        expect(wrapper.emitted('activate')).toHaveLength(1)
    })

    it('does not emit activate on middle/right mouse button', async () => {
        const wrapper = mount(Card, { props: { interactive: true } })
        await wrapper.trigger('click', { button: 1 })
        expect(wrapper.emitted('activate')).toBeUndefined()
        await wrapper.trigger('click', { button: 2 })
        expect(wrapper.emitted('activate')).toBeUndefined()
    })

    it('marks aria-disabled and removes focusability when disabled', async () => {
        const wrapper = mount(Card, { props: { interactive: true, disabled: true } })
        expect(wrapper.attributes('role')).toBe('button')
        expect(wrapper.attributes('tabindex')).toBe('-1')
        expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('does not emit activate when disabled', async () => {
        const wrapper = mount(Card, { props: { interactive: true, disabled: true } })
        await wrapper.trigger('click')
        await wrapper.trigger('keydown', { key: 'Enter' })
        await wrapper.trigger('keyup', { key: ' ' })
        expect(wrapper.emitted('activate')).toBeUndefined()
    })
})

describe('CardHeader', () => {
    it('renders slot content', () => {
        const wrapper = mount(CardHeader, {
            slots: { default: '<span>Header</span>' },
        })
        expect(wrapper.text()).toBe('Header')
    })

    it('applies custom class', () => {
        const wrapper = mount(CardHeader, { props: { class: 'my-header' } })
        expect(wrapper.classes()).toContain('my-header')
    })

    it('overrides conflicting default class via twMerge', () => {
        const wrapper = mount(CardHeader, { props: { class: 'pb-8' } })
        expect(wrapper.classes()).toContain('pb-8')
        expect(wrapper.classes()).not.toContain('pb-4')
    })

    it('accepts object and array class bindings', () => {
        const wrapper = mount(CardHeader, {
            props: { class: ['my-array', { 'is-active': true }] } as any,
        })
        expect(wrapper.classes()).toContain('my-array')
        expect(wrapper.classes()).toContain('is-active')
    })
})

describe('CardTitle', () => {
    it('renders slot content', () => {
        const wrapper = mount(CardTitle, {
            slots: { default: 'Title' },
        })
        expect(wrapper.text()).toBe('Title')
    })

    it('renders h3 element', () => {
        const wrapper = mount(CardTitle, {
            slots: { default: 'Title' },
        })
        expect(wrapper.element.tagName).toBe('H3')
    })

    it('applies custom class', () => {
        const wrapper = mount(CardTitle, { props: { class: 'my-title' } })
        expect(wrapper.classes()).toContain('my-title')
    })

    it('renders custom heading tag via as prop', () => {
        const wrapper = mount(CardTitle, { props: { as: 'h1' } })
        expect(wrapper.element.tagName).toBe('H1')
    })

    it('falls back to h3 for invalid as values', () => {
        // JS 调用方可绕过 TS 联合类型传入任意字符串，运行时须校验并回退 h3
        const wrapper = mount(CardTitle, { props: { as: 'div' } as any })
        expect(wrapper.element.tagName).toBe('H3')
    })
})

describe('CardDescription', () => {
    it('renders slot content', () => {
        const wrapper = mount(CardDescription, {
            slots: { default: 'Description text' },
        })
        expect(wrapper.text()).toBe('Description text')
    })

    it('renders p element', () => {
        const wrapper = mount(CardDescription, {
            slots: { default: 'Desc' },
        })
        expect(wrapper.element.tagName).toBe('P')
    })

    it('applies custom class', () => {
        const wrapper = mount(CardDescription, { props: { class: 'my-desc' } })
        expect(wrapper.classes()).toContain('my-desc')
    })
})

describe('CardContent', () => {
    it('renders slot content', () => {
        const wrapper = mount(CardContent, {
            slots: { default: '<p>Body</p>' },
        })
        expect(wrapper.text()).toBe('Body')
    })

    it('applies custom class', () => {
        const wrapper = mount(CardContent, { props: { class: 'my-content' } })
        expect(wrapper.classes()).toContain('my-content')
    })
})

describe('CardFooter', () => {
    it('renders slot content', () => {
        const wrapper = mount(CardFooter, {
            slots: { default: '<button>Action</button>' },
        })
        expect(wrapper.text()).toBe('Action')
    })

    it('applies custom class', () => {
        const wrapper = mount(CardFooter, { props: { class: 'my-footer' } })
        expect(wrapper.classes()).toContain('my-footer')
    })
})
