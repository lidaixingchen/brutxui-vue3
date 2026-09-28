import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        MessageBox: {
            props: {
                open: { zh: '控制对话框的显示状态，可通过 v-model:open 双向绑定；未提供时默认为打开。', en: 'Controls dialog visibility and supports v-model:open. The dialog defaults to open when this prop is omitted.' },
                title: { zh: '设置对话框标题；未提供时使用当前语言的默认标题。', en: 'Sets the dialog title; the localized default title is used when omitted.' },
                message: { zh: '设置正文消息；为空时对话框描述区域使用标题作为备用文本。', en: 'Sets the body message. When empty, the dialog description uses the title as fallback text.' },
                type: { zh: '选择信息、成功、警告或错误状态，并同步决定标题旁显示的状态图标。', en: 'Selects the info, success, warning, or error state and the status icon shown beside the title.' },
                showCancelButton: { zh: '控制底部取消按钮是否显示。', en: 'Controls whether the cancel button is shown.' },
                showCloseButton: { zh: '控制标题栏右侧的关闭按钮是否显示。', en: 'Controls whether the close button is shown at the right of the title bar.' },
                confirmButtonText: { zh: '设置确认按钮文本；未提供时使用当前语言的默认确认文案。', en: 'Sets the confirm button label; the localized default label is used when omitted.' },
                cancelButtonText: { zh: '设置取消按钮文本；未提供时使用当前语言的默认取消文案。', en: 'Sets the cancel button label; the localized default label is used when omitted.' },
                confirmButtonClass: { zh: '追加到确认按钮的 CSS 类。', en: 'Additional CSS classes applied to the confirm button.' },
                cancelButtonClass: { zh: '追加到取消按钮的 CSS 类。', en: 'Additional CSS classes applied to the cancel button.' },
                showInput: { zh: '显示输入框以启用 Prompt 交互；开启后确认事件携带输入值。', en: 'Shows an input field for prompt-style interaction; when enabled, the confirm event includes its value.' },
                inputPlaceholder: { zh: '设置 Prompt 输入框为空时显示的占位文本。', en: 'Sets the placeholder shown while the prompt input is empty.' },
                inputValue: { zh: '设置 Prompt 输入框的初始值；输入过程保存在组件内部。', en: 'Sets the initial value of the prompt input; subsequent typing is held in component state.' },
                inputPattern: { zh: '确认时用于校验输入值的正则表达式；不匹配时显示错误文案且不会发出确认事件或关闭对话框。', en: 'A regular expression used to validate the prompt value on confirmation. A mismatch shows the error text and neither emits confirm nor closes the dialog.' },
                inputErrorMessage: { zh: '设置输入校验失败时显示的错误文本；未提供时使用当前语言的默认提示。', en: 'Sets the error text shown when input validation fails; the localized default message is used when omitted.' },
                zIndex: { zh: '同时设置遮罩层和对话框内容的 z-index。', en: 'Sets the z-index for both the backdrop and dialog content.' },
                class: { zh: '追加到对话框卡片容器的 CSS 类。', en: 'Additional CSS classes applied to the dialog card container.' },
            },
            events: {
                'update:open': { zh: '受控打开状态变化时发出布尔值，用于同步 v-model:open。', en: 'Emits the updated boolean visibility value so v-model:open can be synchronized.' },
                confirm: { zh: '确认操作通过输入校验后发出；showInput 开启时携带输入字符串，否则不带参数，并随后请求关闭对话框。', en: 'Emitted after confirmation passes validation. It carries the input string when showInput is enabled, otherwise no payload, and then requests the dialog to close.' },
                cancel: { zh: '用户取消、关闭按钮、遮罩外部交互或按 Escape 结束对话框时发出，不携带参数。', en: 'Emitted when the user cancels, activates the close button, interacts outside the dialog, or presses Escape. It carries no payload.' },
            },
        },
    },
} satisfies ApiContent

export default content
