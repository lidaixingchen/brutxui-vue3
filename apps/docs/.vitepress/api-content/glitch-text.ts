import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "GlitchText": {
            "props": {
                "text": {
                    "zh": "用于毛刺伪元素的数据文本；非空时优先于插槽文本用于动画图层。",
                    "en": "Text data for the glitch pseudo-elements. A non-empty value takes precedence over slot text for the animation layers."
                },
                "trigger": {
                    "zh": "选择 hover、click、autoplay 或 none 动画触发方式。",
                    "en": "Selects the hover, click, autoplay, or none animation trigger."
                },
                "interval": {
                    "zh": "autoplay 模式的播放间隔，单位为毫秒；组件会按动画时长和最小间隔限制实际周期。",
                    "en": "The autoplay interval in milliseconds. The actual interval is clamped to the animation duration and minimum interval."
                },
                "speed": {
                    "zh": "选择毛刺动画的慢速、中速或快速视觉节奏。",
                    "en": "Selects the slow, medium, or fast visual pace of the glitch animation."
                },
                "direction": {
                    "zh": "选择水平、垂直或双向毛刺位移。",
                    "en": "Selects horizontal, vertical, or bidirectional glitch displacement."
                },
                "class": {
                    "zh": "追加到文本根 span 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the root text span."
                }
            },
            "slots": {
                "default": {
                    "zh": "呈现文本内容并支持内联样式。实际渲染文本优先采用插槽；未提供插槽时显示 text。毛刺伪元素则优先采用非空 text，否则从插槽节点提取文本。",
                    "en": "Renders text content and supports inline styling. The visible content prefers this slot and falls back to text; the glitch pseudo-elements prefer non-empty text and otherwise extract text from the slot."
                }
            },
            "exposes": {
                "play": {
                    "zh": "手动开启毛刺激活状态，不受 trigger 方式或禁用状态限制；减少动态效果偏好仍会隐藏实际动画。autoplay 定时器继续独立运行。",
                    "en": "Manually activates the glitch state regardless of trigger mode; reduced-motion preference still hides the visual animation. The autoplay timer continues independently."
                },
                "stop": {
                    "zh": "手动关闭毛刺激活状态；autoplay 定时器仍会按自身周期运行。",
                    "en": "Manually clears the active glitch state; the autoplay timer continues on its own schedule."
                }
            }
        }
    },
    "supplements": {
        "GlitchText": [
            {
                "name": "mouseenter",
                "kind": "events",
                "type": "MouseEvent",
                "origin": "fallthrough",
                "source": {
                    "file": "packages/ui/src/components/glitch-text/GlitchText.vue"
                },
                "description": {
                    "zh-CN": "根 span 的原生鼠标进入事件通过 Vue 属性透传给使用方监听；组件不声明同名自定义事件。",
                    "en": "The root span’s native mouseenter event is available to consumers through Vue attribute fallthrough; the component does not declare a custom event with this name."
                },
                "notes": {
                    "zh-CN": [
                        "hover 模式激活毛刺效果；autoplay 模式暂停定时播放；其他模式不改变内部状态。"
                    ],
                    "en": [
                        "In hover mode, activates the glitch effect; in autoplay mode, pauses the timer. Other modes do not change internal state."
                    ]
                }
            },
            {
                "name": "mouseleave",
                "kind": "events",
                "type": "MouseEvent",
                "origin": "fallthrough",
                "source": {
                    "file": "packages/ui/src/components/glitch-text/GlitchText.vue"
                },
                "description": {
                    "zh-CN": "根 span 的原生鼠标离开事件通过 Vue 属性透传给使用方监听；组件不声明同名自定义事件。",
                    "en": "The root span’s native mouseleave event is available to consumers through Vue attribute fallthrough; the component does not declare a custom event with this name."
                },
                "notes": {
                    "zh-CN": [
                        "hover 模式关闭毛刺效果；autoplay 模式恢复定时播放；其他模式不改变内部状态。"
                    ],
                    "en": [
                        "In hover mode, clears the glitch effect; in autoplay mode, resumes the timer. Other modes do not change internal state."
                    ]
                }
            },
            {
                "name": "click",
                "kind": "events",
                "type": "MouseEvent",
                "origin": "fallthrough",
                "source": {
                    "file": "packages/ui/src/components/glitch-text/GlitchText.vue"
                },
                "description": {
                    "zh-CN": "根 span 的原生点击事件通过 Vue 属性透传给使用方监听；组件不声明同名自定义事件。",
                    "en": "The root span’s native click event is available to consumers through Vue attribute fallthrough; the component does not declare a custom event with this name."
                },
                "notes": {
                    "zh-CN": [
                        "仅 click 模式下点击会切换毛刺激活状态；其他触发模式不因点击改变内部状态。"
                    ],
                    "en": [
                        "A click toggles the glitch state only in click mode; clicks do not change internal state in other trigger modes."
                    ]
                }
            }
        ]
    }
} satisfies ApiContent

export default content
