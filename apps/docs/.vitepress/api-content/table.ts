import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "Table": {
            "props": {
                "class": {
                    "zh": "追加到原生 table 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the native table element."
                },
                "ariaLabel": {
                    "zh": "设置原生 table 的 aria-label，为表格提供可访问名称。",
                    "en": "Sets aria-label on the native table element to provide an accessible name."
                }
            },
            "slots": {
                "default": {
                    "zh": "组合 TableHeader、TableBody、TableFooter 等表格结构子组件。",
                    "en": "Composes table structure children such as TableHeader, TableBody, and TableFooter."
                }
            }
        },
        "TableBody": {
            "props": {
                "class": {
                    "zh": "追加到原生 tbody 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the native tbody element."
                }
            },
            "slots": {
                "default": {
                    "zh": "放置表格行 TableRow。",
                    "en": "Contains table rows rendered with TableRow."
                }
            }
        },
        "TableCaption": {
            "props": {
                "class": {
                    "zh": "追加到原生 caption 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the native caption element."
                }
            },
            "slots": {
                "default": {
                    "zh": "呈现表格标题或摘要内容。",
                    "en": "Renders a table caption or summary."
                }
            }
        },
        "TableCell": {
            "props": {
                "class": {
                    "zh": "追加到原生 td 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the native td element."
                }
            },
            "slots": {
                "default": {
                    "zh": "呈现表格数据单元格内容。",
                    "en": "Renders table data cell content."
                }
            }
        },
        "TableFooter": {
            "props": {
                "variant": {
                    "zh": "选择表格表尾的默认、主色或强调色样式。",
                    "en": "Selects the default, primary, or accent style for the table footer."
                },
                "class": {
                    "zh": "追加到原生 tfoot 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the native tfoot element."
                }
            },
            "slots": {
                "default": {
                    "zh": "放置表格汇总或其他表尾行内容。",
                    "en": "Contains summary or other footer row content."
                }
            }
        },
        "TableHead": {
            "props": {
                "variant": {
                    "zh": "选择表头单元格的默认、主色或次要色样式。",
                    "en": "Selects the default, primary, or secondary style for a header cell."
                },
                "class": {
                    "zh": "追加到原生 th 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the native th element."
                }
            },
            "slots": {
                "default": {
                    "zh": "呈现表头单元格内容；该元素设置 scope=\"col\"。",
                    "en": "Renders header cell content. The element sets scope=\"col\"."
                }
            }
        },
        "TableHeader": {
            "props": {
                "variant": {
                    "zh": "选择表格表头的默认、主色或次要色样式。",
                    "en": "Selects the default, primary, or secondary style for the table header."
                },
                "texture": {
                    "zh": "选择表头无底纹、斜线或点阵底纹；底纹叠加在所选配色上。",
                    "en": "Selects no texture, hatch lines, or dots for the table header. The texture is layered over the selected color variant."
                },
                "class": {
                    "zh": "追加到原生 thead 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the native thead element."
                }
            },
            "slots": {
                "default": {
                    "zh": "放置表头行 TableRow。",
                    "en": "Contains header rows rendered with TableRow."
                }
            }
        },
        "TableRow": {
            "props": {
                "class": {
                    "zh": "追加到原生 tr 元素的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the native tr element."
                }
            },
            "slots": {
                "default": {
                    "zh": "放置表头单元格或数据单元格。",
                    "en": "Contains header cells or data cells."
                }
            }
        }
    }
} satisfies ApiContent

export default content
