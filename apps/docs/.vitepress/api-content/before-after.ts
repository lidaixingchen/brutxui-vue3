import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "BeforeAfter": {
            "props": {
                "before": {
                    "zh": "对比底层的 before 图片 URL。",
                    "en": "The URL of the underlying before image."
                },
                "after": {
                    "zh": "对比上层的 after 图片 URL。",
                    "en": "The URL of the overlaid after image."
                },
                "beforeAlt": {
                    "zh": "底层 before 图片的替代文本；未设置时使用本地化默认值。",
                    "en": "Alternative text for the underlying before image. Uses a localized value when omitted.",
                    "fallback": {
                        "zh-CN": "之前",
                        "en": "Before"
                    }
                },
                "afterAlt": {
                    "zh": "上层 after 图片的替代文本；未设置时使用本地化默认值。",
                    "en": "Alternative text for the overlaid after image. Uses a localized value when omitted.",
                    "fallback": {
                        "zh-CN": "之后",
                        "en": "After"
                    }
                },
                "modelValue": {
                    "zh": "当前分割位置百分比，支持 v-model；写入和交互值都会限制在 0 到 100。",
                    "en": "The current divider position as a percentage, available through v-model. Assigned and interactive values are clamped to 0–100."
                },
                "defaultValue": {
                    "zh": "非受控模式的初始分割位置百分比；仅初始化时读取，默认 50。",
                    "en": "The initial divider percentage in uncontrolled mode. It is read only during initialization and defaults to 50."
                },
                "disabled": {
                    "zh": "禁用原生范围滑块的拖动交互。",
                    "en": "Disables dragging the native range slider."
                },
                "orientation": {
                    "zh": "选择分割线方向；horizontal 显示竖直分割线，vertical 显示水平分割线。",
                    "en": "Selects the divider orientation. Horizontal displays a vertical divider; vertical displays a horizontal divider."
                },
                "class": {
                    "zh": "追加到对比容器根元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the comparison container root."
                },
                "iconSize": {
                    "zh": "设置分割手柄图标尺寸。",
                    "en": "Sets the divider handle icon size."
                }
            },
            "events": {
                "update:modelValue": {
                    "zh": "拖动滑块导致位置改变时发出限制在 0 到 100 的新百分比。",
                    "en": "Emits the new percentage, clamped to 0–100, when slider interaction changes the position."
                }
            }
        }
    }
} satisfies ApiContent

export default content
