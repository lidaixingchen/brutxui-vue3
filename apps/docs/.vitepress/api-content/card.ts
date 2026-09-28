import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Card: {
            props: {
                variant: { zh: '控制卡片的配色、阴影或交互外观；`interactive` 变体也会启用可交互语义。', en: 'Controls the card color, shadow, or interactive appearance; the `interactive` variant also enables interactive semantics.' },
                padding: { zh: '卡片内容区域的内边距预设。', en: 'The preset padding for the card content area.' },
                texture: { zh: '叠加到卡片底色上的背景纹理，可选蓝图网格或半色调点阵。', en: 'A background texture layered over the card color: blueprint grid or halftone dots.' },
                deco: { zh: '可选的 HUD 四角准星装饰层，仅用于视觉展示。', en: 'An optional HUD-style four-corner crosshair decoration, for visual presentation only.' },
                interactive: { zh: '让卡片响应点击和 Enter/Space，并添加 button 角色及键盘焦点。', en: 'Makes the card respond to clicks and Enter/Space, adding button semantics and keyboard focus.' },
                disabled: { zh: '禁用可交互卡片的焦点和激活行为，并设置 `aria-disabled`。', en: 'Disables focus and activation for an interactive card and sets `aria-disabled`.' },
                class: { zh: '追加到卡片根容器的 CSS 类。', en: 'CSS classes added to the card root container.' },
            },
            events: {
                activate: { zh: '可交互卡片被主键点击、Enter 或 Space 激活时发出原生事件；禁用时以及事件来自内部交互元素时不发出。', en: 'Emits the native event when an interactive card is activated by the primary click, Enter, or Space. It is suppressed when disabled or when the event originates from a nested interactive element.' },
            },
            slots: { default: { zh: '卡片主体内容，通常组合 `CardHeader`、`CardContent` 和 `CardFooter`。', en: 'Card body content, commonly composed with `CardHeader`, `CardContent`, and `CardFooter`.' } },
        },
        CardContent: {
            props: { class: { zh: '追加到卡片主内容区域的 CSS 类。', en: 'CSS classes added to the card main-content region.' } },
            slots: { default: { zh: '渲染在主内容区域中的卡片正文。', en: 'Card body content rendered in the main-content region.' } },
        },
        CardDescription: {
            props: { class: { zh: '追加到描述文本元素的 CSS 类。', en: 'CSS classes added to the description text element.' } },
            slots: { default: { zh: '卡片的补充说明文本。', en: 'Supplementary descriptive text for the card.' } },
        },
        CardFooter: {
            props: { class: { zh: '追加到底部操作区域的 CSS 类。', en: 'CSS classes added to the card footer action region.' } },
            slots: { default: { zh: '卡片底部内容，通常放置操作或状态信息。', en: 'Card footer content, commonly actions or status information.' } },
        },
        CardHeader: {
            props: { class: { zh: '追加到卡片头部区域的 CSS 类。', en: 'CSS classes added to the card header region.' } },
            slots: { default: { zh: '卡片头部内容，通常包含标题和描述。', en: 'Card header content, commonly a title and description.' } },
        },
        CardTitle: {
            props: {
                as: { zh: '选择标题渲染为 `h1` 至 `h6` 中的哪个 HTML 标题元素。', en: 'Selects which HTML heading element from `h1` through `h6` renders the title.' },
                class: { zh: '追加到标题元素的 CSS 类。', en: 'CSS classes added to the heading element.' },
            },
            slots: { default: { zh: '卡片标题文本或内联标题内容。', en: 'Card title text or inline heading content.' } },
        },
    },
} satisfies ApiContent

export default content
