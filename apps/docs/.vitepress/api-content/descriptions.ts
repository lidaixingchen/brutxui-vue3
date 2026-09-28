import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "Descriptions": {
            "props": {
                "column": {
                    "zh": "描述项网格的逻辑列数；边框横向布局会为标签和值使用双倍网格轨道，非法值归一化为至少一列。",
                    "en": "The logical number of description columns. Horizontal bordered layout uses twice as many grid tracks for labels and values; invalid values are normalized to at least one column."
                },
                "border": {
                    "zh": "显示带边框的描述项布局，并将配置提供给子项。",
                    "en": "Enables the bordered description layout and provides the setting to child items."
                },
                "direction": {
                    "zh": "选择横向或纵向标签/值排列，并提供给子项。",
                    "en": "Selects horizontal or vertical label/value arrangement and provides it to child items."
                },
                "size": {
                    "zh": "选择 small、default 或 large 尺寸对应的文字大小。",
                    "en": "Selects the text size associated with small, default, or large."
                },
                "title": {
                    "zh": "描述列表标题文本；非空时显示标题区，可由 title 插槽替换。",
                    "en": "The description-list title. A non-empty value displays the title area and can be replaced by the title slot."
                },
                "class": {
                    "zh": "追加到描述列表最外层容器的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the outer descriptions container."
                }
            },
            "slots": {
                "title": {
                    "zh": "替换标题文本及默认 h3 结构；仅当标题文本非空或此插槽渲染了非注释内容时创建标题区。",
                    "en": "Replaces the title text and default h3 structure. The title area is created only for non-empty title text or when this slot renders non-comment content."
                },
                "stamp": {
                    "zh": "在边框布局右上方渲染印章内容；仅 border 为 true 且提供该插槽时显示。",
                    "en": "Renders stamp content at the upper-right of the bordered layout; shown only when border is true and this slot is provided."
                },
                "default": {
                    "zh": "放置 DescriptionsItem 描述项。",
                    "en": "Contains DescriptionsItem entries."
                }
            }
        },
        "DescriptionsItem": {
            "props": {
                "label": {
                    "zh": "描述项标签文本；可由 label 插槽替换。",
                    "en": "The description item label text; it can be replaced by the label slot."
                },
                "span": {
                    "zh": "描述项跨越的逻辑列数，按正整数归一化；横向边框布局中每个逻辑列占两条网格轨道。",
                    "en": "The logical columns spanned by the item, normalized to a positive integer. In horizontal bordered layout, each logical column spans two grid tracks."
                },
                "labelWidth": {
                    "zh": "设置标签单元格宽度；数字按像素处理，空字符串不应用宽度。横向边框布局中该值不会改变父级网格轨道宽度。",
                    "en": "Sets the label cell width; numbers are treated as pixels and an empty string applies no width. In horizontal bordered layout it does not change the parent grid-track width."
                },
                "class": {
                    "zh": "追加到描述项布局容器的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the description item layout container."
                }
            },
            "slots": {
                "label": {
                    "zh": "替换 label prop 文本，提供自定义标签内容。",
                    "en": "Replaces the label prop text with custom label content."
                },
                "default": {
                    "zh": "呈现该描述项的值或说明内容。",
                    "en": "Renders the value or descriptive content for this item."
                }
            }
        }
    }
} satisfies ApiContent

export default content
