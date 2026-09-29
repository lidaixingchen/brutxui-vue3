import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "ScrollArea": {
            "props": {
                "variant": {
                    "zh": "选择滚动条与滑块的 default、primary 或 accent 颜色变体，并传递给内部 ScrollBar。",
                    "en": "Selects the default, primary, or accent color variant for the scrollbar and thumb, passed to the internal ScrollBar."
                },
                "size": {
                    "zh": "选择内部滚动条的粗细尺寸，并传递给 ScrollBar。",
                    "en": "Selects the thickness of the internal scrollbar and passes it to ScrollBar."
                },
                "class": {
                    "zh": "追加到 Reka UI 滚动区域根元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the Reka UI scroll-area root element."
                },
                "viewportClass": {
                    "zh": "追加到可滚动 Viewport 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the scrollable viewport element."
                }
            },
            "slots": {
                "default": {
                    "zh": "放置要在可滚动 viewport 中呈现的内容。",
                    "en": "Contains the content rendered in the scrollable viewport."
                }
            }
        },
        "ScrollBar": {
            "props": {
                "orientation": {
                    "zh": "选择竖直或水平滚动条方向。",
                    "en": "Selects a vertical or horizontal scrollbar orientation."
                },
                "variant": {
                    "zh": "选择滚动条与滑块的 default、primary 或 accent 颜色变体。",
                    "en": "Selects the default, primary, or accent color variant for the scrollbar and thumb."
                },
                "size": {
                    "zh": "选择滚动条粗细尺寸。",
                    "en": "Selects the scrollbar thickness."
                },
                "class": {
                    "zh": "追加到 Reka UI scrollbar 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the Reka UI scrollbar element."
                }
            }
        }
    }
} satisfies ApiContent

export default content
