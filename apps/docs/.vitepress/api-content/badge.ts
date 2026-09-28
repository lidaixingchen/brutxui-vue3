import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Badge: {
            props: {
                variant: { zh: '徽标的配色及边框变体。', en: 'The badge color and border variant.' },
                size: { zh: '设置徽标尺寸，同时调整圆点、图标间距和关闭图标大小。', en: 'Sets the badge size, including its dot, icon spacing, and close icon.' },
                closable: { zh: '显示关闭按钮；关闭后是否移除徽标由使用方处理。', en: 'Shows the close button. The consumer decides whether to remove the badge after closing.' },
                dot: { zh: '在徽标内容前显示装饰性圆点。', en: 'Shows a decorative dot before the badge content.' },
                pulse: { zh: '显示圆点并启用圆点脉冲动画，即使 dot 未开启也会显示。', en: 'Shows the dot with a pulse animation, even when dot is disabled.' },
                class: { zh: '合并到徽标根 span 元素的自定义 CSS 类。', en: 'Custom CSS classes merged onto the badge root span.' },
            },
            events: {
                close: { zh: '点击关闭按钮时发出；组件会先阻止该点击事件冒泡。', en: 'Emitted when the close button is clicked, after stopping the click from bubbling.' },
            },
            slots: {
                default: { zh: '徽标的文字或主体内容。', en: 'The badge text or main content.' },
                icon: { zh: '显示在主体内容前的图标；存在插槽时才创建图标容器。', en: 'An icon before the main content. Its container is rendered only when the slot is provided.' },
            },
        },
    },
} satisfies ApiContent

export default content
