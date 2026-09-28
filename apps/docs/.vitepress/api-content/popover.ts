import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Popover: {
            props: {
                defaultOpen: { zh: '非受控模式下首次渲染时的打开状态；省略时由 Reka UI 原语使用其默认关闭状态。', en: 'The initial open state in uncontrolled mode; when omitted, the Reka UI primitive starts closed.' },
                open: { zh: '受控的打开状态；监听 `update:open` 并回写该属性以保持同步。', en: 'The controlled open state. Listen for `update:open` and update this prop to keep it in sync.' },
                modal: { zh: '启用模态行为时禁用外部元素交互，并将屏幕阅读器关注限制在弹出内容中。', en: 'Enables modal behavior, disabling interaction with outside elements and limiting screen-reader focus to the popover content.' },
            },
            events: {
                'update:open': { zh: '打开状态变化时发出新布尔值，用于受控模式更新。', en: 'Emits the new boolean open state for controlled usage.' },
            },
            slots: { default: { zh: 'Popover 内部的触发器、内容面板及其他 Reka UI 子原语。', en: 'The trigger, content panel, and other Reka UI primitives inside the popover.' } },
        },
        PopoverContent: {
            props: {
                align: { zh: '内容面板相对于触发器的对齐位置。', en: 'The content panel alignment relative to its trigger.' },
                sideOffset: { zh: '内容面板与触发器之间的间距，单位为像素。', en: 'The pixel gap between the content panel and its trigger.' },
                collisionPadding: { zh: '浮层避让边界的内缩量；可传统一数值或按上、右、下、左分别设置。', en: 'The inset used for floating-content collision handling; accepts one number or per-side top/right/bottom/left values.' },
                class: { zh: '追加到 Reka UI 浮层内容元素的 CSS 类。', en: 'CSS classes added to the Reka UI floating content element.' },
            },
            slots: { default: { zh: '弹出面板中的内容。', en: 'The content rendered inside the popover panel.' } },
        },
        PopoverTrigger: {
            props: {
                asChild: { zh: '将触发器的属性和交互行为合并到唯一子元素上。', en: 'Merges the trigger props and interaction behavior into its single child element.' },
                as: { zh: '选择触发器渲染的 HTML 标签或组件；`asChild` 启用时由子元素决定渲染目标。', en: 'Selects the HTML tag or component rendered as the trigger; the child determines the target when `asChild` is enabled.' },
            },
            slots: { default: { zh: '触发器的子内容，通常是按钮或链接。', en: 'The trigger content, usually a button or link.' } },
        },
    },
} satisfies ApiContent

export default content
