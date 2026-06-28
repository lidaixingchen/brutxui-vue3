import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { AvatarRoot } from 'reka-ui'
import Avatar from './Avatar.vue'
import AvatarImage from './AvatarImage.vue'
import AvatarFallback from './AvatarFallback.vue'

const AvatarWithImage = defineComponent({
    components: { Avatar, AvatarImage },
    props: { src: { type: String, default: '' }, alt: { type: String, default: '' }, imageClass: { type: String, default: '' } },
    template: `
        <Avatar>
            <AvatarImage :src="src" :alt="alt" :class="imageClass" />
        </Avatar>
    `,
})

const AvatarWithFallback = defineComponent({
    components: { Avatar, AvatarFallback },
    props: {
        fallbackClass: { type: String, default: '' },
        variant: { type: String, default: 'default' },
    },
    template: `
        <Avatar :variant="variant">
            <AvatarFallback :class="fallbackClass">JD</AvatarFallback>
        </Avatar>
    `,
})

describe('Avatar', () => {
    it('renders with default size and shape', () => {
        const wrapper = mount(Avatar)
        const root = wrapper.findComponent(AvatarRoot)
        expect(root.classes()).toContain('h-10')
        expect(root.classes()).toContain('w-10')
    })

    it('applies size classes', () => {
        const sizes = ['sm', 'default', 'lg', 'xl'] as const
        const expected = ['h-8 w-8', 'h-10 w-10', 'h-14 w-14', 'h-20 w-20']

        sizes.forEach((size, i) => {
            const wrapper = mount(Avatar, { props: { size } })
            const root = wrapper.findComponent(AvatarRoot)
            const classes = root.classes()
            expected[i].split(' ').forEach((cls) => {
                expect(classes).toContain(cls)
            })
        })
    })

    it('applies shape classes', () => {
        const squareWrapper = mount(Avatar, { props: { shape: 'square' } })
        expect(squareWrapper.findComponent(AvatarRoot).classes()).not.toContain('rounded-brutal')

        const roundedWrapper = mount(Avatar, { props: { shape: 'rounded' } })
        expect(roundedWrapper.findComponent(AvatarRoot).classes()).toContain('rounded-brutal')
    })

    it('renders slot content', () => {
        const wrapper = mount(Avatar, {
            slots: { default: '<span>AB</span>' },
        })
        expect(wrapper.text()).toBe('AB')
    })

    it('applies custom class to AvatarRoot', () => {
        const wrapper = mount(Avatar, { props: { class: 'my-avatar' } })
        expect(wrapper.findComponent(AvatarRoot).classes()).toContain('my-avatar')
    })

    it('applies default variant background', () => {
        const wrapper = mount(Avatar)
        expect(wrapper.findComponent(AvatarRoot).classes()).toContain('bg-brutal-muted')
    })

    it('applies primary variant background', () => {
        const wrapper = mount(Avatar, { props: { variant: 'primary' } })
        expect(wrapper.findComponent(AvatarRoot).classes()).toContain('bg-brutal-primary/20')
    })

    it('applies secondary variant background', () => {
        const wrapper = mount(Avatar, { props: { variant: 'secondary' } })
        expect(wrapper.findComponent(AvatarRoot).classes()).toContain('bg-brutal-secondary/20')
    })

    it('applies accent variant background', () => {
        const wrapper = mount(Avatar, { props: { variant: 'accent' } })
        expect(wrapper.findComponent(AvatarRoot).classes()).toContain('bg-brutal-accent/20')
    })

    it('does not render status indicator by default', () => {
        const wrapper = mount(Avatar)
        const statusDot = wrapper.find('.absolute.rounded-full')
        expect(statusDot.exists()).toBe(false)
    })

    it('renders online status indicator', () => {
        const wrapper = mount(Avatar, { props: { status: 'online' } })
        const statusDot = wrapper.find('.absolute.rounded-full')
        expect(statusDot.exists()).toBe(true)
        expect(statusDot.classes()).toContain('bg-brutal-success')
    })

    it('renders offline status indicator', () => {
        const wrapper = mount(Avatar, { props: { status: 'offline' } })
        const statusDot = wrapper.find('.absolute.rounded-full')
        expect(statusDot.exists()).toBe(true)
        expect(statusDot.classes()).toContain('bg-brutal-muted')
    })

    it('renders busy status indicator', () => {
        const wrapper = mount(Avatar, { props: { status: 'busy' } })
        const statusDot = wrapper.find('.absolute.rounded-full')
        expect(statusDot.exists()).toBe(true)
        expect(statusDot.classes()).toContain('bg-brutal-destructive')
    })

    it('status indicator is outside AvatarRoot to avoid clipping', () => {
        const wrapper = mount(Avatar, { props: { status: 'online' } })
        const root = wrapper.findComponent(AvatarRoot)
        const statusDot = wrapper.find('.absolute.rounded-full')
        expect(root.element.contains(statusDot.element)).toBe(false)
    })

    it('status indicator has role and localized aria-label for accessibility', () => {
        const wrapper = mount(Avatar, { props: { status: 'busy' } })
        const statusDot = wrapper.find('.absolute.rounded-full')
        expect(statusDot.attributes('role')).toBe('status')
        expect(statusDot.attributes('aria-label')).toBe('忙碌')
    })

    it('status indicator aria-label is localized for online', () => {
        const wrapper = mount(Avatar, { props: { status: 'online' } })
        const statusDot = wrapper.find('.absolute.rounded-full')
        expect(statusDot.attributes('aria-label')).toBe('在线')
    })

    it('status indicator aria-label is localized for offline', () => {
        const wrapper = mount(Avatar, { props: { status: 'offline' } })
        const statusDot = wrapper.find('.absolute.rounded-full')
        expect(statusDot.attributes('aria-label')).toBe('离线')
    })
})

describe('AvatarImage', () => {
    it('renders within Avatar context with src and alt props', () => {
        const wrapper = mount(AvatarWithImage, {
            props: { src: '/photo.jpg', alt: 'User photo' },
        })
        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('src')).toBe('/photo.jpg')
        expect(img.attributes('alt')).toBe('User photo')
    })

    it('applies custom class within Avatar context', () => {
        const wrapper = mount(AvatarWithImage, {
            props: { src: '/photo.jpg', imageClass: 'my-image' },
        })
        const img = wrapper.find('img')
        expect(img.classes()).toContain('my-image')
    })
})

describe('AvatarFallback', () => {
    it('renders slot content within Avatar context', () => {
        const wrapper = mount(AvatarWithFallback)
        expect(wrapper.text()).toBe('JD')
    })

    it('applies custom class within Avatar context', () => {
        const wrapper = mount(AvatarWithFallback, {
            props: { fallbackClass: 'my-fallback' },
        })
        const fallback = wrapper.find('.font-bold')
        expect(fallback.classes()).toContain('my-fallback')
    })

    it('applies default variant fallback background', () => {
        const wrapper = mount(AvatarWithFallback)
        const fallback = wrapper.find('.font-bold')
        expect(fallback.classes()).toContain('bg-brutal-muted')
        expect(fallback.classes()).toContain('text-brutal-muted-foreground')
    })

    it('applies secondary variant fallback background', () => {
        const wrapper = mount(AvatarWithFallback, {
            props: { variant: 'secondary' },
        })
        const fallback = wrapper.find('.font-bold')
        expect(fallback.classes()).toContain('bg-brutal-secondary')
        expect(fallback.classes()).toContain('text-brutal-secondary-foreground')
    })

    it('applies accent variant fallback background', () => {
        const wrapper = mount(AvatarWithFallback, {
            props: { variant: 'accent' },
        })
        const fallback = wrapper.find('.font-bold')
        expect(fallback.classes()).toContain('bg-brutal-accent')
        expect(fallback.classes()).toContain('text-brutal-accent-foreground')
    })
})
