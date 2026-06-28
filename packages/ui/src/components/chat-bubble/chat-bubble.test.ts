import { mount } from '@vue/test-utils'
import ChatBubble from './ChatBubble.vue'

describe('ChatBubble', () => {
    it('renders received message by default', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '1', content: 'Hello there' },
            },
        })
        expect(wrapper.text()).toContain('Hello there')
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('bg-brutal-bg')
    })

    it('renders sent message with primary bg', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '2', content: 'Hi back', variant: 'sent' },
            },
        })
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('bg-brutal-primary')
    })

    it('renders system message', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '3', content: 'User joined', variant: 'system' },
            },
        })
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('bg-brutal-muted')
        expect(bubble.classes()).toContain('border-dashed')
        expect(bubble.classes()).toContain('shadow-none')
    })

    it('shows avatar when showAvatar is true', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '4', content: 'Hey', name: 'Alice' },
                showAvatar: true,
            },
        })
        const avatar = wrapper.find('[title="Alice"]')
        expect(avatar.exists()).toBe(true)
    })

    it('hides avatar when showAvatar is false', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '5', content: 'Hey', name: 'Alice' },
                showAvatar: false,
            },
        })
        const avatar = wrapper.find('[title="Alice"]')
        expect(avatar.exists()).toBe(false)
    })

    it('shows name when provided', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '6', content: 'Hello', name: 'Bob' },
            },
        })
        expect(wrapper.text()).toContain('Bob')
    })

    it('shows timestamp when provided', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '7', content: 'Hello', timestamp: '10:30 AM' },
            },
        })
        expect(wrapper.text()).toContain('10:30 AM')
    })

    it('applies custom class', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '8', content: 'Hello' },
                class: 'my-bubble',
            },
        })
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('my-bubble')
    })

    it('avatar shows initials when no image', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '9', content: 'Hello', name: 'Alice' },
            },
        })
        const avatar = wrapper.find('[title="Alice"]')
        expect(avatar.text()).toBe('AL')
    })
})

describe('ChatBubble color', () => {
    it('applies accent color to sent bubble', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '1', content: 'Hi', variant: 'sent' },
                color: 'accent',
            },
        })
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('bg-brutal-accent')
        expect(bubble.classes()).toContain('text-brutal-accent-foreground')
        expect(bubble.classes()).not.toContain('bg-brutal-primary')
    })

    it('does not apply accent color to received bubble', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '2', content: 'Hi', variant: 'received' },
                color: 'accent',
            },
        })
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('bg-brutal-bg')
        expect(bubble.classes()).not.toContain('bg-brutal-accent')
    })

    it('does not apply accent color to system bubble', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '3', content: 'Joined', variant: 'system' },
                color: 'accent',
            },
        })
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('bg-brutal-muted')
        expect(bubble.classes()).not.toContain('bg-brutal-accent')
    })

    it('keeps primary color on sent bubble with color=primary', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '4', content: 'Hi', variant: 'sent' },
                color: 'primary',
            },
        })
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('bg-brutal-primary')
    })

    it('defaults to primary color on sent bubble with color=default', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '5', content: 'Hi', variant: 'sent' },
                color: 'default',
            },
        })
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('bg-brutal-primary')
    })
})

describe('ChatBubble size', () => {
    it('applies sm size classes to bubble', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '1', content: 'Hi' },
                size: 'sm',
            },
        })
        const bubble = wrapper.find('.px-3')
        expect(bubble.classes()).toContain('text-xs')
        expect(bubble.classes()).toContain('py-1.5')
    })

    it('applies lg size classes to bubble', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '2', content: 'Hi' },
                size: 'lg',
            },
        })
        const bubble = wrapper.find('.px-5')
        expect(bubble.classes()).toContain('text-base')
        expect(bubble.classes()).toContain('py-3.5')
    })

    it('applies default size classes to bubble', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '3', content: 'Hi' },
                size: 'default',
            },
        })
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('text-sm')
        expect(bubble.classes()).toContain('py-2.5')
    })

    it('applies sm size to avatar', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '4', content: 'Hi', name: 'Alice' },
                size: 'sm',
            },
        })
        const avatar = wrapper.find('[title="Alice"]')
        expect(avatar.classes()).toContain('w-6')
        expect(avatar.classes()).toContain('h-6')
    })

    it('applies lg size to avatar', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '5', content: 'Hi', name: 'Alice' },
                size: 'lg',
            },
        })
        const avatar = wrapper.find('[title="Alice"]')
        expect(avatar.classes()).toContain('w-10')
        expect(avatar.classes()).toContain('h-10')
    })

    it('applies default size to avatar', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '6', content: 'Hi', name: 'Alice' },
                size: 'default',
            },
        })
        const avatar = wrapper.find('[title="Alice"]')
        expect(avatar.classes()).toContain('w-8')
        expect(avatar.classes()).toContain('h-8')
    })
})

describe('ChatBubble variant and color combination', () => {
    it('combines sent variant with accent color and lg size', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '1', content: 'Hi', variant: 'sent' },
                color: 'accent',
                size: 'lg',
            },
        })
        const bubble = wrapper.find('.px-5')
        expect(bubble.classes()).toContain('bg-brutal-accent')
        expect(bubble.classes()).toContain('text-brutal-accent-foreground')
        expect(bubble.classes()).toContain('text-base')
        expect(bubble.classes()).toContain('ml-auto')
    })
})
