import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Textarea: {
            props: {
                modelValue: { zh: '文本域的字符串值，通过 v-model 同步。', en: 'The textarea string value, synchronized through v-model.' },
                variant: { zh: '文本域的边框和状态样式；error 配合非空 errorMessage 显示错误提示。', en: 'The textarea border and state style. The error variant displays an error message when errorMessage is non-empty.' },
                size: { zh: '文本域的尺寸变体，控制高度、内边距和文字大小。', en: 'The textarea size variant, controlling its height, padding, and text size.' },
                resize: { zh: '浏览器允许用户拖动调整文本域尺寸的方向。', en: 'The directions in which the browser allows the user to resize the textarea.' },
                disabled: { zh: '禁用原生文本域，阻止聚焦和编辑。', en: 'Disables the native textarea, preventing focus and editing.' },
                readonly: { zh: '保留聚焦、文本选择与复制能力，同时阻止用户编辑。', en: 'Prevents editing while retaining focus, text selection, and copying.' },
                placeholder: {
                    zh: '文本域为空时显示的提示文本。', en: 'Hint text displayed when the textarea is empty.',
                    fallback: { 'zh-CN': '未提供时使用 textarea.placeholder 语言文案。', en: 'Uses the localized textarea.placeholder message when omitted.' },
                },
                errorMessage: { zh: 'variant 为 error 且文本非空时，在文本域下方通过 role="alert" 显示的错误消息。', en: 'The error message displayed below the textarea with role="alert" when variant is error and the text is non-empty.' },
                ariaLabel: { zh: '传给原生文本域的无障碍名称。', en: 'The accessible name passed to the native textarea.' },
                ariaLabelledby: { zh: '为原生文本域提供标签的元素 ID。', en: 'The ID of the element labeling the native textarea.' },
                ariaDescribedby: { zh: '描述元素的 ID；未提供且显示错误提示时自动关联错误消息。', en: 'The description element ID; when omitted and an error is shown, automatically references the error message.' },
                ariaInvalid: { zh: '显式设置无效状态；未提供且显示错误提示时为真。', en: 'Explicitly sets the invalid state. When omitted, it is true while an error message is displayed.' },
                ariaErrormessage: { zh: '错误消息元素的 ID，同时用作内置错误消息的 ID；未提供时内置消息使用自动生成的 ID。', en: 'The error message element ID, also used for the built-in error message. When omitted, the built-in message uses an automatically generated ID.' },
                ariaRequired: { zh: '向辅助技术声明文本域的必填状态。', en: 'Declares the required state of the textarea to assistive technology.' },
                class: { zh: '合并到原生 textarea 元素的自定义 CSS 类。', en: 'Custom CSS classes merged onto the native textarea element.' },
            },
            events: {
                'update:modelValue': { zh: '用户输入时发出新的字符串值；输入法组合期间不发出中间值，组合结束时提交最终值。', en: 'Emits the new string value on user input. Intermediate IME composition values are suppressed, and the final value is committed when composition ends.' },
            },
            exposes: {
                ref: { zh: '内部原生文本域引用；Vue 会在公开组件实例上解包顶层 Ref，可通过实例的 ref 读取 HTMLTextAreaElement。', en: 'The internal native textarea reference. Vue unwraps top-level refs on public component instances, so the instance ref property provides the HTMLTextAreaElement.' },
                focus: { zh: '将焦点移到原生文本域。', en: 'Moves focus to the native textarea.' },
                blur: { zh: '从原生文本域移除焦点。', en: 'Removes focus from the native textarea.' },
                select: { zh: '选中原生文本域中的文本。', en: 'Selects the text in the native textarea.' },
            },
        },
    },
} satisfies ApiContent

export default content
