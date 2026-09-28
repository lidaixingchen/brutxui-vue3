import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "HardcoreInput": {
            "props": {
                "modelValue": {
                    "zh": "当前输入字符串，可通过 v-model 受控绑定。",
                    "en": "The current input string, available through v-model for controlled binding."
                },
                "sound": {
                    "zh": "启用或关闭输入音效及校验状态切换时的成功/失败音效。",
                    "en": "Enables or disables typing sounds and success/failure sounds on validation-state transitions."
                },
                "rules": {
                    "zh": "按顺序执行的字符串校验函数；返回 true 表示通过，返回字符串表示失败及错误文案，返回 false 使用本地化通用错误文案。空数组不产生校验错误。",
                    "en": "String validation functions evaluated in order. Return true to pass, a string to fail with that message, or false to use the localized generic error. An empty array produces no validation error."
                },
                "shakeOnError": {
                    "zh": "校验失败时启用输入框抖动反馈。",
                    "en": "Enables the input shake feedback after validation fails."
                },
                "type": {
                    "zh": "传给原生 input 元素的 HTML 输入类型。",
                    "en": "The HTML input type passed to the native input element."
                },
                "placeholder": {
                    "zh": "输入框为空时显示的原生 placeholder 文本。",
                    "en": "The native placeholder text shown when the input is empty."
                },
                "disabled": {
                    "zh": "设置原生输入框为禁用状态。",
                    "en": "Disables the native input element."
                },
                "readonly": {
                    "zh": "设置原生输入框为只读状态。",
                    "en": "Makes the native input element read-only."
                },
                "validateOn": {
                    "zh": "选择组件自动触发校验的时机；submit 不会监听表单提交，需通过公开 validate() 主动调用。",
                    "en": "Selects when the component automatically validates. For submit, the component does not listen for form submission; call the exposed validate() method explicitly."
                },
                "class": {
                    "zh": "追加到输入框及校验提示外层容器的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the outer container around the input and validation message."
                }
            },
            "events": {
                "update:modelValue": {
                    "zh": "用户输入或 IME 组合完成时发出输入字符串；IME 组合过程中的中间值不会发出。",
                    "en": "Emits the input string on user input or when IME composition completes. Intermediate composition values are not emitted."
                },
                "validation-change": {
                    "zh": "校验状态改变或错误状态下错误文案改变时发出；重复的相同状态和文案不会重复通知。rules 为空时复位到 default 也会通知。",
                    "en": "Emitted when the validation state changes or the error message changes while in the error state. Unchanged state/message pairs are not repeated; returning to default with empty rules is also reported.",
                    "notes": {
                        "zh-CN": [
                            "规则返回 false 时，message 使用 hardcoreInput.invalidInput 文案“输入内容无效”。"
                        ],
                        "en": [
                            "When a rule returns false, message uses the hardcoreInput.invalidInput text “Invalid input”."
                        ]
                    }
                }
            },
            "slots": {
                "default": {
                    "zh": "替换输入框右侧的默认校验表情区域；插槽不接收参数。",
                    "en": "Replaces the default validation-face area to the right of the input; the slot has no parameters."
                }
            },
            "exposes": {
                "validate": {
                    "zh": "使用当前 modelValue 主动校验，返回是否通过；若位于 Form 上下文中，会先同步表单值。",
                    "en": "Validates the current modelValue and returns whether it passes. Within a Form context, the form value is synchronized first."
                },
                "validationState": {
                    "zh": "组件实例上暴露的校验状态；Vue 会自动解包内部 Ref，可通过 `hardcoreInputRef.value.validationState` 读取 default、success 或 error。",
                    "en": "The validation state exposed on the component instance. Vue automatically unwraps its internal Ref, so read default, success, or error through `hardcoreInputRef.value.validationState`."
                },
                "errorMessage": {
                    "zh": "组件实例上暴露的当前校验错误文案；Vue 会自动解包内部 Ref，无错误时为空字符串。",
                    "en": "The current validation error exposed on the component instance. Vue automatically unwraps its internal Ref; the value is an empty string when there is no error."
                }
            }
        }
    }
} satisfies ApiContent

export default content
