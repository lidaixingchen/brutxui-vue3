import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "ToggleGroup": {
            "props": {
                "type": {
                    "zh": "选择单选或多选模式；单选值为字符串，多选值为字符串数组。",
                    "en": "Selects single- or multiple-selection mode. A single value is a string; multiple values are a string array."
                },
                "modelValue": {
                    "zh": "当前选中值，支持 v-model；值的形状由 type 决定。",
                    "en": "The current selected value, available through v-model. Its shape is determined by type."
                },
                "variant": {
                    "zh": "选择传递给未单独覆盖子项的默认视觉变体。",
                    "en": "Selects the default visual variant passed to items that do not override it."
                },
                "size": {
                    "zh": "选择传递给未单独覆盖子项的默认尺寸。",
                    "en": "Selects the default size passed to items that do not override it."
                },
                "orientation": {
                    "zh": "选择水平或垂直排列；垂直模式使用纵向 flex 容器并传递给 Reka UI 原语。",
                    "en": "Selects horizontal or vertical layout. Vertical mode uses a column flex container and is passed to the Reka UI primitive."
                },
                "disabled": {
                    "zh": "禁用整个切换组并向子项提供禁用状态。",
                    "en": "Disables the entire toggle group and provides the disabled state to its items."
                },
                "class": {
                    "zh": "追加到 ToggleGroup 根容器的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the ToggleGroup root container."
                }
            },
            "events": {
                "update:modelValue": {
                    "zh": "底层切换组更新值时发出；单选未选中时归一化为空字符串，多选未选中时归一化为空数组。",
                    "en": "Emitted when the underlying toggle group updates its value. An empty single selection is normalized to an empty string and an empty multiple selection to an empty array."
                }
            },
            "slots": {
                "default": {
                    "zh": "放置 ToggleGroupItem 子项。",
                    "en": "Contains ToggleGroupItem children."
                }
            }
        },
        "ToggleGroupItem": {
            "props": {
                "value": {
                    "zh": "该切换项对应的唯一字符串值。",
                    "en": "The unique string value represented by this toggle item."
                },
                "variant": {
                    "zh": "覆盖父级 ToggleGroup 的变体；未设置时继承父级值，再回退到 default。",
                    "en": "Overrides the parent ToggleGroup variant. When omitted, it inherits the parent value and then falls back to default."
                },
                "size": {
                    "zh": "覆盖父级 ToggleGroup 的尺寸；未设置时继承父级值，再回退到 default。",
                    "en": "Overrides the parent ToggleGroup size. When omitted, it inherits the parent value and then falls back to default."
                },
                "disabled": {
                    "zh": "禁用当前项；最终禁用状态为自身与父级 ToggleGroup disabled 的逻辑或。",
                    "en": "Disables this item. The final disabled state is the logical OR of this value and the parent ToggleGroup disabled state."
                },
                "class": {
                    "zh": "追加到 ToggleGroupItem 按钮元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the ToggleGroupItem button element."
                }
            },
            "slots": {
                "default": {
                    "zh": "呈现按钮项的图标、文本或其他内容。",
                    "en": "Renders the toggle button item’s icon, text, or other content."
                }
            }
        }
    }
} satisfies ApiContent

export default content
