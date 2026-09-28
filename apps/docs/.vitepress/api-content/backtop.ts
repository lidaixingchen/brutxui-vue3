import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Backtop: {
            props: {
                visibilityHeight: { zh: '滚动容器的垂直滚动距离达到此像素值时显示按钮。', en: 'Shows the button when the scroll container reaches this vertical scroll distance in pixels.' },
                target: {
                    zh: '监听并滚动到顶部的容器，可传入 CSS 选择器或元素。设置后按钮使用 absolute 定位，需放在已定位的祖先容器内。',
                    en: 'The container to observe and scroll to the top, supplied as a CSS selector or element. Setting it uses absolute button positioning and requires a positioned ancestor.',
                    fallback: { 'zh-CN': '未设置或为空字符串时监听 window，按钮相对视口固定定位。', en: 'When omitted or an empty string, observes window and fixes the button to the viewport.' },
                },
                right: { zh: '按钮到定位参照区域右侧的距离，单位为像素。', en: 'The distance from the right edge of the positioning area, in pixels.' },
                bottom: { zh: '按钮到定位参照区域底部的距离，单位为像素。', en: 'The distance from the bottom edge of the positioning area, in pixels.' },
                variant: { zh: '传给内部 Button 的视觉变体；primary 额外应用黄色背景和黑色文字。', en: 'The visual variant passed to the inner Button. The primary variant also applies a yellow background and black text.' },
                class: { zh: '追加到回到顶部按钮的自定义 CSS 类。', en: 'Custom CSS classes added to the back-to-top button.' },
            },
            events: {
                click: { zh: '按钮被点击时发出原始鼠标事件，随后对目标容器调用平滑滚动到顶部。', en: 'Emits the original mouse event when clicked, then requests a smooth scroll to the top of the target container.' },
            },
            slots: {
                default: { zh: '替换按钮内的向上箭头图标。', en: 'Replaces the upward arrow inside the button.' },
            },
        },
    },
} satisfies ApiContent

export default content
