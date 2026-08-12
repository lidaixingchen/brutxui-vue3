import { mount } from '@vue/test-utils'
import ChatBubble from './ChatBubble.vue'
import ChatContainer from './ChatContainer.vue'
import { CheckCheck } from '@lucide/vue'
import type { MessageStatus } from './types'

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

    it('system message uses text-xs regardless of size prop', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '3', content: 'User joined', variant: 'system' },
                size: 'lg',
            },
        })
        const bubble = wrapper.find('[class*="border-dashed"]')
        expect(bubble.classes()).toContain('text-xs')
        expect(bubble.classes()).not.toContain('text-base')
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

    it('applies primary color with shadow to sent bubble with color=primary', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '4', content: 'Hi', variant: 'sent' },
                color: 'primary',
            },
        })
        const bubble = wrapper.find('.px-4')
        expect(bubble.classes()).toContain('bg-brutal-primary')
        expect(bubble.classes()).toContain('text-brutal-primary-foreground')
        expect(bubble.classes()).toContain('shadow-brutal-primary')
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
        expect(bubble.classes()).not.toContain('shadow-brutal-primary')
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

describe('ChatBubble initials (Unicode code points)', () => {
    it('keeps emoji intact when truncating a single-word name', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: 'e1', content: 'Hi', name: '😀😀' },
            },
        })
        expect(wrapper.find('[title="😀😀"]').text()).toBe('😀😀')
    })

    it('takes the first code point of each word for multi-word names', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: 'e2', content: 'Hi', name: '😀 Bob' },
            },
        })
        expect(wrapper.find('[title="😀 Bob"]').text()).toBe('😀B')
    })
})

describe('ChatBubble avatar error recovery', () => {
    it('resets avatarError when the whole message object is replaced', async () => {
        const message = { id: '1', content: 'Hi', name: 'Alice', avatar: 'https://example.com/a.png' }
        const wrapper = mount(ChatBubble, { props: { message } })

        const img = wrapper.find('img')
        await img.trigger('error')
        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.find('[title="Alice"]').text()).toBe('AL')

        // 服务端重发同 URL：新 message 对象、avatar 字符串不变，也应重置错误态
        await wrapper.setProps({ message: { ...message, content: 'Hi (resend)' } })
        expect(wrapper.find('img').exists()).toBe(true)
    })
})

describe('ChatBubble status meta', () => {
    it('renders read status with primary color via STATUS_META', () => {
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: '1', content: 'Hi', variant: 'sent', status: 'read' },
            },
        })
        const check = wrapper.findComponent(CheckCheck)
        expect(check.exists()).toBe(true)
        expect(check.classes()).toContain('text-brutal-primary')
    })

    it('does not crash on unknown runtime status values', () => {
        // 消息数据通常来自后端 API，status 可能在运行时拿到联合类型之外的未知值
        const wrapper = mount(ChatBubble, {
            props: {
                message: { id: 'u1', content: 'Hi', variant: 'sent', status: 'queued' as MessageStatus },
            },
        })
        // 未知状态被兜底忽略：不渲染状态图标，组件正常渲染
        expect(wrapper.find('svg').exists()).toBe(false)
        expect(wrapper.find('.px-4').text()).toBe('Hi')
    })
})

describe('ChatContainer time grouping', () => {
    // 相对「今天」构造确定时间，避免依赖具体运行日期
    function dateAt(dayOffset: number, hours: number, minutes = 0, seconds = 0): Date {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hours, minutes, seconds)
    }

    it('groups unordered messages chronologically', () => {
        const wrapper = mount(ChatContainer, {
            props: {
                messages: [
                    { id: 'a', content: 'today', timestamp: dateAt(0, 10) },
                    { id: 'b', content: 'yesterday', timestamp: dateAt(-1, 9) },
                    { id: 'c', content: 'today2', timestamp: dateAt(0, 11) },
                ],
                groupByTime: true,
                // 间隔放大到一天，避免默认 5 分钟把今天 10:00/11:00 拆成两个组
                groupInterval: 1440,
            },
        })
        const labels = wrapper.findAll('span.px-2').map(w => w.text())
        expect(labels).toEqual(['昨天', '今天'])
        // 渲染顺序跟随排序结果：昨天组在前
        const bubbles = wrapper.findAll('.px-4')
        expect(bubbles[0].text()).toContain('yesterday')
        expect(bubbles[1].text()).toContain('today')
    })

    it('clamps groupInterval to a minimum of 1 minute', () => {
        const wrapper = mount(ChatContainer, {
            props: {
                messages: [
                    { id: 'a', content: 'first', timestamp: dateAt(0, 10, 0) },
                    { id: 'b', content: 'second', timestamp: dateAt(0, 10, 0, 30) },
                ],
                groupByTime: true,
                groupInterval: 0,
            },
        })
        // 30s < 1min：即便 groupInterval=0 被钳制到 1 分钟，两条消息仍归同一组
        const labels = wrapper.findAll('span.px-2').map(w => w.text())
        expect(labels).toEqual(['今天'])
        expect(wrapper.findAll('.px-4')).toHaveLength(2)
    })

    it('uses dateFormat for non today/yesterday group date labels', () => {
        const dateFormat = (d: Date) => `自定义:${d.getDate()}`
        const wrapper = mount(ChatContainer, {
            props: {
                messages: [
                    { id: 'a', content: 'old', timestamp: dateAt(-3, 9) },
                    { id: 'b', content: 'old2', timestamp: dateAt(-3, 10) },
                ],
                groupByTime: true,
                groupInterval: 1440,
                dateFormat,
            },
        })
        const labels = wrapper.findAll('span.px-2').map(w => w.text())
        expect(labels).toEqual([`自定义:${dateAt(-3, 9).getDate()}`])
    })

    it('shows a time label for interval-split groups', () => {
        const dateFormat = (d: Date) => `T${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
        const wrapper = mount(ChatContainer, {
            props: {
                messages: [
                    { id: 'a', content: 'm1', timestamp: dateAt(0, 10, 0) },
                    { id: 'b', content: 'm2', timestamp: dateAt(0, 10, 3) },
                ],
                groupByTime: true,
                groupInterval: 1,
                dateFormat,
            },
        })
        const labels = wrapper.findAll('span.px-2').map(w => w.text())
        // 第一组为日期标签「今天」，间隔切分的第二组展示具体时刻（经 dateFormat）
        expect(labels).toEqual(['今天', 'T10:03'])
    })

    it('groups by real calendar date, not display string', () => {
        // dateFormat 传时间维度格式：不同日期即使格式化结果相同也不合并，
        // 同一日期的不同时刻不因展示字符串不同被拆成多个「新日期」组
        const timeFormat = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
        const wrapper = mount(ChatContainer, {
            props: {
                messages: [
                    { id: 'a', content: 'day1-a', timestamp: dateAt(-2, 10) },
                    { id: 'b', content: 'day1-b', timestamp: dateAt(-2, 11) },
                    { id: 'c', content: 'day2', timestamp: dateAt(-1, 10) },
                ],
                groupByTime: true,
                groupInterval: 1440,
                dateFormat: timeFormat,
            },
        })
        const labels = wrapper.findAll('span.px-2').map(w => w.text())
        // 前天（-2）同一天的两条消息归一组并展示具体时刻；昨天（-1）单独成组
        expect(labels).toEqual([timeFormat(dateAt(-2, 10)), '昨天'])
        expect(wrapper.findAll('.px-4')).toHaveLength(3)
    })

    it('keeps messages with unparseable display timestamps in their original position', () => {
        const wrapper = mount(ChatContainer, {
            props: {
                messages: [
                    { id: 'a', content: 'first', timestamp: dateAt(0, 10) },
                    { id: 'b', content: 'display-time', timestamp: '14:30' },
                    { id: 'c', content: 'third', timestamp: dateAt(0, 11) },
                ],
                groupByTime: true,
                groupInterval: 1440,
            },
        })
        // '14:30' 无法被 new Date 解析：不沉底，按原索引保留原位（first, display-time, third）
        const bubbles = wrapper.findAll('.px-4').map(w => w.text())
        expect(bubbles).toEqual(['first', 'display-time', 'third'])
        // 无时间戳消息夹在同日消息之间不触发日期边界：仍是单一「今天」组，不重复渲染日期标签
        const labels = wrapper.findAll('span.px-2').map(w => w.text())
        expect(labels).toEqual(['今天'])
    })
})
