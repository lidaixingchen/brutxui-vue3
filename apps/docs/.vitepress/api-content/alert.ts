import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Alert: {
            props: {
                class: {
                    zh: '合并到提示框根元素上的补充 CSS 类名。',
                    en: 'Additional CSS classes merged into the alert root element.',
                },
                variant: {
                    en: 'Controls the alert’s visual variant, including its border, foreground, and background colors.',
                },
                closable: {
                    en: 'Shows a close button in the top-right corner. Clicking it emits `close`.',
                },
            },
            events: {
                close: {
                    zh: '点击可关闭提示框的关闭按钮时触发，不携带参数。',
                    en: 'Emitted without a payload when the close button of a closable alert is clicked.',
                },
            },
            slots: {
                default: {
                    zh: '提示框的主体内容，通常包含标题、描述或其他自定义内容。',
                    en: 'The main alert content, typically a title, description, or other custom content.',
                },
                actions: {
                    zh: '可选操作区域；提供此插槽时，操作内容会显示在主体内容下方。',
                    en: 'An optional action area. When provided, its content appears below the main alert content.',
                },
            },
        },
        AlertDescription: {
            props: {
                class: {
                    zh: '合并到描述元素上的补充 CSS 类名。',
                    en: 'Additional CSS classes merged into the description element.',
                },
                id: {
                    en: 'Sets the description element’s DOM id. If omitted, the component generates an id; when nested in `Alert`, that id is registered for `aria-describedby`.',
                },
            },
            slots: {
                default: {
                    zh: '提示框的描述内容；嵌套在 `Alert` 中时，其 DOM id 会参与根节点的 `aria-describedby` 关联。',
                    en: 'The alert description. When nested in `Alert`, its DOM id is included in the root’s `aria-describedby` relationship.',
                },
            },
        },
        AlertTitle: {
            props: {
                class: {
                    zh: '合并到标题元素上的补充 CSS 类名。',
                    en: 'Additional CSS classes merged into the title element.',
                },
                as: {
                    zh: '指定标题渲染为哪个 HTML 元素或 Vue 组件；默认使用 `h5`。',
                    en: 'Selects the HTML element or Vue component used to render the title. The default is `h5`.',
                },
                asChild: {
                    zh: '将标题属性、样式和插槽内容合并到唯一子元素上；启用后由子元素决定实际渲染元素。',
                    en: 'Merges the title props, styles, and slot content into its single child; the child determines the rendered element when enabled.',
                },
            },
            slots: {
                default: {
                    zh: '标题文本或其他标题内容。',
                    en: 'The title text or other title content.',
                },
            },
        },
    },
} satisfies ApiContent

export default content
