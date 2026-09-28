import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Loading: {
            props: {
                loading: { zh: '控制加载状态；仅在为 true 时显示局部遮罩或页面级加载内容。', en: 'Controls the loading state. The local overlay or page-level loading content is shown only when true.' },
                text: { zh: '设置局部加载遮罩中的自定义短文案；为空时不渲染该文案区域。', en: 'Sets optional custom text in the local loading overlay. The text area is omitted when the value is empty.' },
                background: { zh: '设置局部加载遮罩的背景色；未提供时使用组件默认的半透明主题背景。', en: 'Sets the local loading overlay background color; the component’s translucent theme background is used when omitted.' },
                customClass: { zh: '追加到局部加载遮罩层的 CSS 类。', en: 'Additional CSS classes applied to the local loading overlay.' },
                page: { zh: '切换到页面级加载布局；加载时渲染至少占满视口高度的页面内容。', en: 'Switches to the page-level loading layout, which occupies at least the viewport height while loading.' },
                fullscreen: { zh: '显示固定定位的全屏加载视图，即使组件位于普通容器内也覆盖整个视口。', en: 'Shows a fixed full-viewport loading view, even when the component is nested inside a regular container.' },
                title: { zh: '设置页面级加载卡片的标题。', en: 'Sets the heading in the page-level loading card.' },
                description: { zh: '设置页面级加载卡片的说明文本。', en: 'Sets the description in the page-level loading card.' },
                progress: { zh: '提供 0 到 100 的加载进度；仅在有值时显示进度条，超出范围会钳制到边界。', en: 'Provides loading progress from 0 to 100. A progress bar appears when set, and out-of-range values are clamped.' },
                class: { zh: '追加到页面级根容器或局部加载容器的 CSS 类。', en: 'Additional CSS classes applied to the page-level root or local loading container.' },
            },
            slots: {
                header: { zh: '页面级加载布局中标题卡片之前的自定义头部内容。', en: 'Custom header content placed before the title card in the page-level loading layout.' },
                default: { zh: '页面级加载卡片的主体内容。', en: 'The main content of the page-level loading card.' },
                footer: { zh: '页面级加载卡片底部的自定义内容，进度条之后渲染。', en: 'Custom content at the bottom of the page-level loading card, rendered after the progress bar.' },
            },
        },
    },
} satisfies ApiContent

export default content
