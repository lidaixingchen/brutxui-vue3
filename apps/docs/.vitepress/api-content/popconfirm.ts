import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Popconfirm: {
            props: {
                title: { zh: '确认弹层中显示的标题文本。', en: 'The title text displayed in the confirmation popover.' },
                confirmButtonText: { zh: '确认操作按钮的文字；未提供时使用当前语言的默认文案。', en: 'The confirm button label; localized default text is used when omitted.' },
                cancelButtonText: { zh: '取消操作按钮的文字；未提供时使用当前语言的默认文案。', en: 'The cancel button label; localized default text is used when omitted.' },
                confirmButtonType: { zh: '设置确认按钮使用常规主色或危险操作样式。', en: 'Sets the confirm button to the primary or destructive action style.' },
                icon: { zh: '替换默认警告图标的 Vue 图标组件；未提供时显示 TriangleAlert。', en: 'The Vue icon component replacing the default warning icon; TriangleAlert is shown when omitted.' },
                cancelable: { zh: '控制是否渲染取消按钮。', en: 'Controls whether the cancel button is rendered.' },
                class: { zh: '追加到弹层内容容器的自定义 CSS 类。', en: 'Custom CSS classes added to the popover content container.' },
                open: { zh: '确认弹层的展开状态，支持 v-model:open 双向绑定。', en: 'The confirmation popover open state, available through v-model:open.' },
            },
            events: {
                'update:open': { zh: '弹层展开状态变化时发出新的布尔值。', en: 'Emits the new boolean value when the popover open state changes.' },
                confirm: { zh: '用户点击确认按钮后关闭弹层并发出确认事件。', en: 'Closes the popover and emits after the user activates the confirm button.' },
                cancel: { zh: '用户点击取消按钮后关闭弹层并发出取消事件。', en: 'Closes the popover and emits after the user activates the cancel button.' },
            },
            slots: {
                default: { zh: '提供打开确认弹层的触发元素。', en: 'Provides the element that triggers the confirmation popover.' },
                icon: { zh: '替换默认警告图标区域的内容。', en: 'Replaces the content of the default warning icon area.' },
                description: { zh: '渲染标题下方的说明内容，并关联为提示框的描述。', en: 'Renders explanatory content below the title and associates it as the alert dialog description.' },
            },
        },
    },
} satisfies ApiContent

export default content
