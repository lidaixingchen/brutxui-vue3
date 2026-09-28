import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Timeline: {
            props: {
                orientation: { zh: '设置时间线为垂直或水平排列；水平布局可横向滚动。', en: 'Sets the timeline to vertical or horizontal layout; horizontal timelines can scroll horizontally.' },
                alternate: { zh: '垂直方向下将相邻节点内容交替排列在轴线两侧。', en: 'Alternates adjacent item content on opposite sides of the axis in vertical orientation.' },
                class: { zh: '追加到时间线外层列表容器的自定义 CSS 类。', en: 'Custom CSS classes added to the outer timeline list container.' },
            },
        },
        TimelineConnector: {
            props: { class: { zh: '追加到时间线连接线元素的自定义 CSS 类。', en: 'Custom CSS classes added to the timeline connector element.' } },
        },
        TimelineContent: {
            props: { class: { zh: '追加到时间线节点内容区域的自定义 CSS 类。', en: 'Custom CSS classes added to the timeline item content area.' } },
            slots: { default: { zh: '渲染当前时间线节点的主要内容。', en: 'Renders the main content for the current timeline item.' } },
        },
        TimelineDot: {
            props: {
                variant: { zh: '设置节点标记的配色变体。', en: 'Sets the color variant of the timeline marker.' },
                shape: { zh: '设置节点标记为圆形、方形或菱形。', en: 'Sets the timeline marker to a circle, square, or diamond.' },
                led: { zh: '启用装饰性 LED 脉冲光晕；动画遵循减少动态效果偏好。', en: 'Enables a decorative LED pulse glow; the animation respects reduced-motion preferences.' },
                class: { zh: '追加到节点标记元素的自定义 CSS 类。', en: 'Custom CSS classes added to the timeline marker element.' },
            },
            slots: { default: { zh: '在节点标记内部展示数字、图标等内容。', en: 'Displays content such as a number or icon inside the timeline marker.' } },
        },
        TimelineItem: {
            props: {
                index: { zh: '时间线中的节点索引；作为 Timeline 直接子项时会自动按顺序注入，可显式传入覆盖。', en: 'The item index. Timeline injects it in order for direct children, and an explicit value overrides the injected index.' },
                class: { zh: '追加到单个时间线节点容器的自定义 CSS 类。', en: 'Custom CSS classes added to the individual timeline item container.' },
            },
            slots: { default: { zh: '组合放置 TimelineSeparator 与 TimelineContent。', en: 'Composes the TimelineSeparator and TimelineContent for this item.' } },
        },
        TimelineSeparator: {
            props: { class: { zh: '追加到时间线轴线和标记所在分隔区域的自定义 CSS 类。', en: 'Custom CSS classes added to the separator area containing the axis and marker.' } },
            slots: { default: { zh: '放置 TimelineDot 与 TimelineConnector。', en: 'Contains the TimelineDot and TimelineConnector.' } },
        },
    },
} satisfies ApiContent

export default content
