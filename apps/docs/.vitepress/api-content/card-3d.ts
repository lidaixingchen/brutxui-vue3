import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Card3D: {
            props: {
                maxRotation: { zh: '限制指针移动产生的最大 3D 偏转角度，单位为度。', en: 'Limits the maximum 3D tilt produced by pointer movement, in degrees.' },
                perspective: { zh: '设置 3D 透视深度，单位为像素；数值越小透视效果越强。', en: 'Sets the 3D perspective depth in pixels; smaller values produce stronger perspective.' },
                scale: { zh: '悬停时卡片的缩放比例。', en: 'The scale applied to the card while hovered.' },
                shadowOffset: { zh: '控制随指针移动的投影最大偏移距离，单位为像素。', en: 'Controls the maximum pointer-driven shadow offset in pixels.' },
                shadow: { zh: '设置默认、大或超大投影样式。', en: 'Sets the default, large, or extra-large shadow treatment.' },
                variant: { zh: '设置卡片背景的默认、主色、强调色或柔和色变体。', en: 'Sets the card background to the default, primary, accent, or muted variant.' },
                disabled: { zh: '禁用指针驱动的 3D 动效，使卡片保持静态。', en: 'Disables pointer-driven 3D effects and keeps the card static.' },
                clickable: { zh: '启用按钮式点击交互、键盘激活和 click 事件。', en: 'Enables button-like click interaction, keyboard activation, and the click event.' },
                ariaLabel: { zh: '为可点击卡片指定无障碍名称；省略时由卡片插槽内容提供名称。', en: 'Sets the accessible name of a clickable card; when omitted, its slot content supplies the name.' },
                class: { zh: '追加到卡片根元素的自定义 CSS 类。', en: 'Custom CSS classes added to the card root element.' },
            },
            events: {
                click: { zh: '可点击且未禁用时，在指针点击或 Enter、Space 键激活后发出对应事件对象。', en: 'Emits the corresponding event object after a pointer click or Enter/Space activation when clickable and enabled.' },
            },
            slots: {
                default: { zh: '渲染卡片主体内容，可组合任意自定义内容。', en: 'Renders the card body and can contain arbitrary custom content.' },
            },
        },
    },
} satisfies ApiContent

export default content
