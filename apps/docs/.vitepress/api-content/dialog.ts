import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        DialogContent: {
            props: {
                showCloseButton: { zh: '控制内容面板右上角的内置关闭按钮是否渲染。', en: 'Controls whether the built-in close button is rendered in the top-right corner of the content panel.' },
                size: { zh: '设置对话框内容面板的宽度变体。', en: 'Sets the width variant of the dialog content panel.' },
                entrance: { zh: '选择内容面板的入场动效变体。', en: 'Selects the entrance animation variant for the content panel.' },
                forceMount: { zh: '将挂载保持策略传递给遮罩层和内容原语，以便在关闭状态下仍保持挂载。', en: 'Passes the mount-preservation setting to the overlay and content primitives so they can remain mounted while closed.' },
                class: { zh: '追加到对话框内容面板的自定义 CSS 类。', en: 'Custom CSS classes added to the dialog content panel.' },
            },
            slots: { default: { zh: '渲染对话框的主体内容；内置关闭按钮会放在插槽内容之后。', en: 'Renders the dialog body; the built-in close button is placed after the slot content.' } },
        },
        DialogDescription: {
            props: { class: { zh: '追加到描述元素的自定义 CSS 类；其余属性（例如 id）通过属性透传交给 Reka UI 原语。', en: 'Custom CSS classes added to the description element; other attributes such as id fall through to the Reka UI primitive.' } },
            slots: { default: { zh: '对话框的辅助说明内容。', en: 'The supporting description content for the dialog.' } },
        },
        DialogEnhanced: {
            props: {
                draggable: { zh: '启用内容面板的指针拖拽移动；全屏模式下不应用拖拽移动样式。', en: 'Enables pointer dragging of the content panel; dragging styles are not applied in fullscreen mode.' },
                dragHandle: { zh: '将拖拽起点限制为 CSS 选择器匹配的后代元素或指定 HTMLElement。', en: 'Restricts drag start to a descendant matched by the CSS selector or to the specified HTMLElement.' },
                bounds: { zh: '限制拖拽位置到父容器、视口，或给定的 top、left、right、bottom 边界。', en: 'Constrains dragging to the parent, viewport, or the supplied top, left, right, and bottom boundaries.' },
                initialPosition: { zh: '为几何状态控制器提供初始 x、y 坐标。', en: 'Provides the initial x and y coordinates to the geometry controller.' },
                resizable: { zh: '启用对话框边缘的指针缩放交互。', en: 'Enables pointer resizing from the dialog edges.' },
                minWidth: { zh: '设置缩放时允许的最小宽度，单位为像素。', en: 'Sets the minimum width allowed during resizing, in pixels.' },
                minHeight: { zh: '设置缩放时允许的最小高度，单位为像素。', en: 'Sets the minimum height allowed during resizing, in pixels.' },
                maxWidth: { zh: '设置缩放时可选的最大宽度，单位为像素。', en: 'Sets an optional maximum width during resizing, in pixels.' },
                maxHeight: { zh: '设置缩放时可选的最大高度，单位为像素。', en: 'Sets an optional maximum height during resizing, in pixels.' },
                aspectRatio: { zh: '提供锁定的宽高比，由几何状态控制器用于调整尺寸。', en: 'Provides a locked width-to-height ratio for resizing through the geometry controller.' },
                showCloseButton: { zh: '控制增强对话框内容面板中的内置关闭按钮是否渲染。', en: 'Controls whether the built-in close button is rendered in the enhanced dialog content panel.' },
                forceMount: { zh: '要求遮罩层及内容在关闭状态仍保持挂载；此策略优先于 destroyOnClose。', en: 'Keeps the overlay and content mounted while closed; this takes precedence over destroyOnClose.' },
                fullscreen: { zh: '将内容面板固定为占满视口的全屏布局，并忽略拖动几何样式。', en: 'Places the content panel in a viewport-filling fullscreen layout and bypasses drag geometry styling.' },
                beforeClose: { zh: '关闭请求前执行的同步或异步校验；返回 false 或抛出/reject 时不会发出关闭事件。', en: 'A synchronous or asynchronous check run before closing; returning false or throwing/rejecting prevents close events.' },
                destroyOnClose: { zh: '关闭后延迟卸载默认插槽内容；forceMount 为真时不会卸载。', en: 'Unloads default-slot content after closing and the configured delay; content is retained when forceMount is true.' },
                destroyDelay: { zh: 'destroyOnClose 启用时，关闭后等待卸载插槽内容的毫秒数。', en: 'The number of milliseconds to wait after closing before unloading slot content when destroyOnClose is enabled.' },
                zIndex: { zh: '显式设置对话框内容面板的 CSS z-index。', en: 'Explicitly sets the CSS z-index of the dialog content panel.' },
                class: { zh: '追加到对话框内容面板的自定义 CSS 类。', en: 'Custom CSS classes added to the dialog content panel.' },
            },
            events: {
                open: { zh: '组件挂载时发出，表示 DialogEnhanced 实例已挂载，不表示受控打开状态每次变化。', en: 'Emitted when the component mounts, indicating that the DialogEnhanced instance mounted rather than tracking each controlled open-state change.' },
                close: { zh: '关闭请求未被 beforeClose 拒绝时发出；未提供钩子时关闭请求直接通过。', en: 'Emitted when a close request is not rejected by beforeClose; without a hook, the request is accepted directly.' },
                'update:open': { zh: '已接受的关闭请求以 false 发出，用于将 DialogRoot 的受控打开状态设为关闭。', en: 'Emits false for an accepted close request so the controlled DialogRoot open state can be set to closed.' },
            },
            slots: { default: { zh: '对话框内容；启用 destroyOnClose 后可在关闭延迟结束时卸载。', en: 'The dialog content; it may be unloaded after the close delay when destroyOnClose is enabled.' } },
        },
        DialogFooter: {
            props: { class: { zh: '追加到底部操作区域的自定义 CSS 类。', en: 'Custom CSS classes added to the footer action area.' } },
            slots: { default: { zh: '底部操作内容；没有默认插槽内容时 Footer 容器不渲染。', en: 'Footer actions; the footer container is not rendered when the default slot is empty.' } },
        },
        DialogHeader: {
            props: { class: { zh: '追加到标题区域容器的自定义 CSS 类。', en: 'Custom CSS classes added to the title-area container.' } },
            slots: { default: { zh: '标题、描述或其他头部内容。', en: 'The title, description, or other header content.' } },
        },
        DialogOverlay: {
            props: {
                class: { zh: '追加到背景遮罩原语的自定义 CSS 类。', en: 'Custom CSS classes added to the backdrop primitive.' },
                forceMount: { zh: '将 force-mount 策略传递给 Reka UI 遮罩原语。', en: 'Passes the force-mount setting to the Reka UI overlay primitive.' },
                asChild: { zh: '将遮罩原语的元素渲染委托给默认插槽中的子元素。', en: 'Delegates the overlay primitive element rendering to the child in the default slot.' },
                pattern: { zh: '为遮罩层添加点阵半色调背景纹理。', en: 'Adds a dotted halftone background pattern to the overlay.' },
            },
            slots: { default: { zh: '为 asChild 模式提供要渲染的遮罩子元素。', en: 'Provides the overlay child element when using asChild.' } },
        },
        DialogTitle: {
            props: { class: { zh: '追加到对话框标题原语的自定义 CSS 类。', en: 'Custom CSS classes added to the dialog title primitive.' } },
            slots: { default: { zh: '对话框的标题文本或内容。', en: 'The dialog title text or content.' } },
        },
    },
} satisfies ApiContent

export default content
