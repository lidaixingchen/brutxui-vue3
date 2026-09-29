import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "Command": {
            "props": {
                "class": {
                    "zh": "追加到命令列表根容器的 class 值。",
                    "en": "Class values appended to the command root container."
                },
                "disableFilter": {
                    "zh": "关闭组件内部的条目文本过滤；适用于外部自行过滤列表的场景。",
                    "en": "Disables internal filtering of item text, for cases where the list is filtered externally."
                }
            },
            "slots": {
                "default": {
                    "zh": "放置命令输入框、列表、分组和条目等子组件。",
                    "en": "Contains child components such as the command input, list, groups, and items."
                }
            },
            "exposes": {
                "filterSearch": {
                    "zh": "当前共享搜索关键词。写入新字符串会更新内部匹配状态；disableFilter 为 true 时不隐藏不匹配条目。",
                    "en": "The current shared search query. Assigning a new string updates internal matching; when disableFilter is true, unmatched items are not hidden."
                }
            }
        },
        "CommandDialog": {
            "props": {
                "open": {
                    "zh": "对话框当前开合状态。组件完全受控，需通过 v-model:open 或监听 update:open 更新该值。",
                    "en": "The current dialog open state. The component is fully controlled, so update it through v-model:open or by handling update:open."
                },
                "title": {
                    "zh": "命令对话框的无障碍标题；空白或仅空格时回退到本地化标题。",
                    "en": "The accessible title for the command dialog. Blank or whitespace-only values fall back to the localized title.",
                    "fallback": {
                        "zh-CN": "命令面板",
                        "en": "Command Palette"
                    }
                },
                "description": {
                    "zh": "命令对话框的无障碍描述；空白或仅空格时回退到本地化描述。",
                    "en": "The accessible description for the command dialog. Blank or whitespace-only values fall back to the localized description.",
                    "fallback": {
                        "zh-CN": "搜索要运行的命令...",
                        "en": "Search for a command to run..."
                    }
                },
                "class": {
                    "zh": "追加到对话框内容的 class 值；内部布局类在该值之后合并。",
                    "en": "Class values appended to the dialog content; structural layout classes are merged after this value."
                }
            },
            "events": {
                "update:open": {
                    "zh": "根对话框请求开合状态变化时发出新布尔值；父级仍需更新 open。",
                    "en": "Emits the new boolean when the dialog root requests an open-state change; the parent must still update open."
                }
            },
            "slots": {
                "default": {
                    "zh": "放置命令输入框、列表、分组和条目等对话框内容。",
                    "en": "Contains dialog content such as the command input, list, groups, and items."
                }
            }
        },
        "CommandEmpty": {
            "props": {
                "class": {
                    "zh": "追加到无匹配结果提示段落的 class 值。",
                    "en": "Class values appended to the no-results paragraph."
                }
            },
            "slots": {
                "default": {
                    "zh": "自定义搜索结果为空时的提示内容；仅当内部过滤结果数量为零时渲染。未提供内容时使用本地化文本。",
                    "en": "Custom content for the empty search state; rendered only when the internal result count is zero. Localized text is used when no slot content is provided.",
                    "notes": {
                        "zh-CN": [
                            "默认文案来自 command.emptyText：“未找到结果。”。"
                        ],
                        "en": [
                            "The fallback text comes from command.emptyText: “No results found.”."
                        ]
                    }
                }
            }
        },
        "CommandGroup": {
            "props": {
                "title": {
                    "zh": "分组标题；提供非空文本时在分组条目之前呈现标题。",
                    "en": "The group heading, rendered before the group items when a non-empty value is provided."
                },
                "class": {
                    "zh": "追加到命令分组根元素的 class 值。",
                    "en": "Class values appended to the command group root element."
                }
            },
            "slots": {
                "default": {
                    "zh": "放置属于当前命令分组的 CommandItem 子项。",
                    "en": "Contains the CommandItem children belonging to this group."
                }
            }
        },
        "CommandInput": {
            "props": {
                "modelValue": {
                    "zh": "命令搜索输入的受控值；未提供时初始读取根 Command 的共享搜索词。",
                    "en": "The controlled command search value. When omitted, the input initially reads the shared search query from the root Command."
                },
                "placeholder": {
                    "zh": "输入框占位文本；仅 undefined 或 null 时使用本地化默认值，空字符串会按显式值保留。",
                    "en": "The input placeholder. The localized default is used only for undefined or null; an empty string is kept as an explicit value.",
                    "fallback": {
                        "zh-CN": "输入命令或搜索...",
                        "en": "Type a command or search..."
                    }
                },
                "class": {
                    "zh": "追加到原生搜索输入框的 class 值。",
                    "en": "Class values appended to the native search input."
                }
            },
            "events": {
                "update:modelValue": {
                    "zh": "用户输入变化时发出新字符串；根 Command 的共享搜索词由外部更改时，也会同步并发出对应值。",
                    "en": "Emits the new string when the user types. It also emits the synchronized value when the shared query in the root Command changes externally."
                }
            }
        },
        "CommandItem": {
            "props": {
                "value": {
                    "zh": "命令项的唯一值；初始用于搜索索引，默认插槽渲染后索引会同步为可见文本。",
                    "en": "The unique command item value. It seeds the search index, which is updated to the visible text after the default slot renders."
                },
                "disabled": {
                    "zh": "将条目禁用并传递给 Reka UI 列表框条目。",
                    "en": "Disables the item and passes the disabled state to the Reka UI listbox item."
                },
                "class": {
                    "zh": "追加到命令条目根元素的 class 值。",
                    "en": "Class values appended to the command item root element."
                }
            },
            "events": {
                "select": {
                    "zh": "条目被选中时发出其 value 字符串。",
                    "en": "Emitted with the item’s value string when the item is selected."
                }
            },
            "slots": {
                "default": {
                    "zh": "呈现命令项内容；渲染后的可见文本可作为搜索匹配文本。",
                    "en": "Renders the command item content. Its rendered visible text can be used for search matching."
                }
            }
        },
        "CommandList": {
            "props": {
                "class": {
                    "zh": "追加到 Reka UI 列表框内容元素的 class 值。",
                    "en": "Class values appended to the Reka UI listbox content element."
                },
                "asChild": {
                    "zh": "让列表框内容与唯一子元素合并，由子元素作为最终渲染节点。",
                    "en": "Merges the listbox content props and behavior into its single child, which becomes the rendered node."
                },
                "as": {
                    "zh": "指定列表框内容渲染为的元素或组件；asChild 可覆盖该选择。",
                    "en": "Specifies the element or component used to render the listbox content; asChild can override it."
                }
            },
            "slots": {
                "default": {
                    "zh": "放置 CommandEmpty、CommandGroup 等列表内容。",
                    "en": "Contains list content such as CommandEmpty and CommandGroup."
                }
            }
        },
        "CommandSeparator": {
            "props": {
                "class": {
                    "zh": "追加到命令分隔线根元素的 class 值。",
                    "en": "Class values appended to the command separator root element."
                }
            }
        },
        "CommandShortcut": {
            "props": {
                "class": {
                    "zh": "追加到快捷键提示元素的 class 值。",
                    "en": "Class values appended to the shortcut hint element."
                }
            },
            "slots": {
                "default": {
                    "zh": "呈现与命令项关联的快捷键提示文本。",
                    "en": "Renders the keyboard shortcut hint associated with a command item."
                }
            }
        }
    }
} satisfies ApiContent

export default content
