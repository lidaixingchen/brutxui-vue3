import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "Result": {
            "props": {
                "status": {
                    "zh": "选择结果图标和配色状态；支持 success、warning、info、error、empty，运行时未知值回退为 info。",
                    "en": "Selects the result icon and color state: success, warning, info, error, or empty. An unknown runtime value falls back to info."
                },
                "title": {
                    "zh": "结果标题文本；可由 title 插槽替换。",
                    "en": "The result title text; it can be replaced by the title slot."
                },
                "subTitle": {
                    "zh": "结果副标题或补充说明；可由 subTitle 插槽替换。",
                    "en": "The result subtitle or supporting description; it can be replaced by the subTitle slot."
                },
                "variant": {
                    "zh": "选择带边框和硬投影的 card 布局，或无卡片外观的 plain 布局。",
                    "en": "Selects the card layout with border and hard shadow, or the plain layout without card chrome."
                },
                "iconSize": {
                    "zh": "设置状态图标尺寸；未指定时使用组件内置的 40px 图标尺寸。",
                    "en": "Sets the status icon size. When omitted, the component uses its built-in 40px icon size."
                },
                "titleAs": {
                    "zh": "选择标题使用 h2 或 h3 语义元素。",
                    "en": "Selects h2 or h3 as the semantic heading element for the title."
                },
                "class": {
                    "zh": "追加到结果根容器的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the result root container."
                }
            },
            "slots": {
                "icon": {
                    "zh": "替换默认状态图标及其图标盒；该图标装饰区域对辅助技术隐藏。",
                    "en": "Replaces the default status icon and its icon box. This decorative icon area is hidden from assistive technology."
                },
                "title": {
                    "zh": "替换结果标题内容结构。",
                    "en": "Replaces the result title content structure."
                },
                "subTitle": {
                    "zh": "替换结果副标题内容结构。",
                    "en": "Replaces the result subtitle content structure."
                },
                "extra": {
                    "zh": "在标题和副标题下方呈现额外操作或补充内容。",
                    "en": "Renders additional actions or supporting content below the title and subtitle."
                }
            }
        }
    }
} satisfies ApiContent

export default content
