import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Input: {
            props: {
                type: { zh: '原生 input 控件的输入类型，决定浏览器提供的输入行为。', en: 'The native input type, which selects the browser-provided input behavior.' },
                modelValue: { zh: '当前输入值，可通过 v-model 受控绑定。', en: 'The current input value, available for controlled binding with v-model.' },
                variant: { zh: '输入框的视觉状态变体；error 会启用错误态样式和错误状态语义。', en: 'The visual input variant. The error variant enables error styling and error-state semantics.' },
                size: { zh: '输入框的尺寸变体。', en: 'The input size variant.' },
                disabled: { zh: '禁用原生输入控件及其交互。', en: 'Disables the native input and its interaction.' },
                readonly: { zh: '阻止修改输入值，但仍允许聚焦和选择文本。', en: 'Prevents editing while still allowing focus and text selection.' },
                placeholder: { zh: '输入值为空时显示的占位文本。', en: 'Placeholder text shown when the input value is empty.' },
                maxlength: { zh: '传递给原生输入控件的最大字符数；与 showWordLimit 配合时用于显示计数上限。', en: 'The maximum character count passed to the native input; it also supplies the limit shown by showWordLimit.' },
                autocomplete: { zh: '传递给浏览器的自动填充提示，例如 email 或 current-password。', en: 'The autofill hint passed to the browser, such as email or current-password.' },
                clearable: { zh: '启用清除按钮；仅当输入有值且控件既未禁用也非只读时显示。', en: 'Enables the clear button, shown only when the input has a value and is neither disabled nor read-only.' },
                showPassword: { zh: '为 password 类型显示密码显隐切换按钮；切换只改变实际 input 类型。', en: 'Shows a password visibility toggle for password inputs; toggling changes the native input type.' },
                showWordLimit: { zh: '配合 maxlength 显示当前字符数和最大长度。', en: 'Shows the current character count and maximum length when maxlength is provided.' },
                prefixIcon: { zh: '在输入控件前方渲染的图标组件。', en: 'An icon component rendered before the input control.' },
                suffixIcon: { zh: '在输入控件后方渲染的图标组件。', en: 'An icon component rendered after the input control.' },
                errorMessage: { zh: '错误态下显示的错误文本，并作为错误提示内容提供给辅助技术。', en: 'Error text shown in the error state and exposed as the error description for assistive technology.' },
                id: { zh: '原生输入控件的 ID；未提供时由 useId 为实例生成唯一 ID。', en: 'The native input ID. When omitted, useId generates a unique ID for the instance.' },
                ariaLabel: { zh: '传递给原生输入控件的无障碍名称。', en: 'The accessible name passed to the native input.' },
                ariaLabelledby: { zh: '传递给原生输入控件的标签元素 ID。', en: 'The ID of the label element passed to the native input.' },
                ariaDescribedby: { zh: '传递给原生输入控件的描述元素 ID。', en: 'The ID of a descriptive element passed to the native input.' },
                ariaInvalid: { zh: '显式设置输入控件的无效状态；未设置时根据 variant 是否为 error 推导。', en: 'Explicitly sets the input invalid state; when omitted, it is derived from whether variant is error.' },
                ariaErrormessage: { zh: '传递给原生输入控件的错误消息元素 ID。', en: 'The ID of the error message element passed to the native input.' },
                ariaRequired: { zh: '传递给原生输入控件的必填状态。', en: 'The required state passed to the native input.' },
                class: { zh: '追加到输入框外层容器的自定义 CSS 类。', en: 'Custom CSS classes added to the input container.' },
            },
            events: {
                'update:modelValue': { zh: '用户输入值变化时发出新的字符串值以更新 v-model；输入法组合过程中不发出中间值。', en: 'Emits the new string value for v-model when user input changes; intermediate values are suppressed during IME composition.' },
                clear: { zh: '清除操作将输入值更新为空字符串后发出。', en: 'Emitted after a clear action updates the input value to an empty string.' },
            },
            slots: {
                prepend: { zh: '在输入控件前渲染前置内容；仅在提供插槽内容时创建前置区域。', en: 'Renders content before the input control. The prepend region is created only when this slot has content.' },
                append: { zh: '在输入控件后渲染后置内容；仅在提供插槽内容时创建后置区域。', en: 'Renders content after the input control. The append region is created only when this slot has content.' },
            },
            exposes: {
                focus: { zh: '将焦点移到原生输入控件。', en: 'Moves focus to the native input.' },
                blur: { zh: '从原生输入控件移除焦点。', en: 'Removes focus from the native input.' },
                select: { zh: '选中原生输入控件中的文本。', en: 'Selects the text in the native input.' },
                ref: { zh: '暴露内部输入元素引用；Vue 在公开组件实例上解包顶层 Ref，因此读取实例的 ref 可取得原生 HTMLInputElement。', en: 'Exposes the internal input reference. Vue unwraps top-level refs on the public component instance, so reading its ref property returns the native HTMLInputElement.' },
            },
        },
    },
} satisfies ApiContent

export default content
