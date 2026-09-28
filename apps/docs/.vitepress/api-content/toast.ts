import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        Toast: {
            props: describe({
                variant: ['设置提示的语义和视觉类型，如成功、警告、信息或错误。', 'Sets the semantic and visual toast type, such as success, warning, info, or error.'],
                size: ['设置提示容器的尺寸变体。', 'Sets the size variant of the toast container.'],
                title: ['提示标题文字；省略时不渲染标题区域。', 'The toast title text; the title area is omitted when not provided.'],
                description: ['提示正文说明文字；省略时不渲染描述区域。', 'The toast description text; the description area is omitted when not provided.'],
                duration: ['提示自动关闭前的显示时长，单位为毫秒；设为 0 时不自动关闭。', 'The display duration before the toast closes automatically, in milliseconds; 0 disables automatic closing.'],
                pauseOnHover: ['鼠标悬停时暂停自动关闭计时和进度动画，离开后继续剩余计时。', 'Pauses the close timer and progress animation on hover, then resumes with the remaining time when the pointer leaves.'],
                class: ['追加到提示根容器的 CSS 类。', 'CSS classes added to the toast root container.'],
                iconSize: ['设置类型图标的尺寸。', 'Sets the size of the type icon.'],
                count: ['显示同类提示聚合数量；大于 1 时呈现计数标记。', 'The aggregated count for similar toasts; values above 1 are shown in a count badge.'],
            }),
            events: describe({ close: ['提示离场动画完成后发出，用于通知调用方移除该提示。', 'Emitted after the toast exit animation finishes so the caller can remove it.'] }),
            slots: describe({ default: ['显示在标题和描述之后的自定义补充内容。', 'Custom supplemental content displayed after the title and description.'] }),
        },
        ToastContainer: {
            props: describe({
                position: ['设置提示容器在视口中的预设位置，或通过 x、y 和 anchor 指定偏移位置。', 'Sets a preset viewport position for the toast container or uses x, y, and anchor to specify an offset position.'],
                stack: ['设置可见提示数量上限、提示间距以及容器展开方向。', 'Configures the visible-toast limit, spacing between toasts, and the direction in which the stack expands.'],
                class: ['追加到固定定位提示容器的 CSS 类。', 'CSS classes added to the fixed-position toast container.'],
            }),
            slots: describe({ default: ['自定义容器内容；提供时由调用方渲染和管理提示列表，未提供时容器自动渲染 useToast 中的提示。', 'Custom container content; when provided, the caller renders and manages the toast list. Otherwise, the container automatically renders toasts from useToast.'] }),
        },
    },
} satisfies ApiContent

export default content
