import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "VirtualScroll": {
            "props": {
                "class": {
                    "zh": "追加到虚拟滚动根容器的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the virtual scroll root container."
                },
                "items": {
                    "zh": "参与虚拟化的数据数组；其长度决定虚拟器中的条目总数。",
                    "en": "The data array to virtualize. Its length determines the item count in the virtualizer."
                },
                "itemHeight": {
                    "zh": "固定高度模式下的每项估算高度，单位为像素；动态高度模式也使用它作为初始估算值。",
                    "en": "The estimated item height in pixels for fixed-height mode; dynamic-height mode also uses it as the initial estimate."
                },
                "dynamicHeight": {
                    "zh": "启用已挂载条目的实际高度测量；关闭时每项使用 itemHeight 固定高度。",
                    "en": "Enables measurement of mounted items’ actual heights. When false, each item uses the fixed itemHeight."
                },
                "size": {
                    "zh": "容器尺寸变体；full 需要父容器提供确定高度。",
                    "en": "The container size variant. The full variant requires a parent with a definite height."
                },
                "variant": {
                    "zh": "选择列表项样式；striped 为索引奇数项添加交替背景，bordered 添加边框。",
                    "en": "Selects the item style. Striped adds an alternating background to odd zero-based indices; bordered adds borders."
                },
                "overscan": {
                    "zh": "可视区域之外额外预渲染的条目数，传给虚拟器。",
                    "en": "The number of extra items rendered beyond the visible region, passed to the virtualizer."
                },
                "scrollEndThreshold": {
                    "zh": "距离滚动底部小于此像素数时触发 scroll-end。",
                    "en": "The pixel distance from the bottom at which scroll-end is emitted."
                },
                "role": {
                    "zh": "设置虚拟列表滚动容器的 ARIA role，默认 list。",
                    "en": "Sets the ARIA role on the virtual list scroll container; defaults to list."
                },
                "itemRole": {
                    "zh": "设置每个虚拟列表项的 ARIA role，默认 listitem。",
                    "en": "Sets the ARIA role on each virtual list item; defaults to listitem."
                }
            },
            "events": {
                "scroll-end": {
                    "zh": "滚动位置进入 scrollEndThreshold 指定的底部范围时发出；离开该范围后再次进入可重新触发。",
                    "en": "Emitted when scrolling enters the bottom range set by scrollEndThreshold. It can fire again after leaving and re-entering that range."
                },
                "scroll": {
                    "zh": "滚动容器发生滚动时发出当前 scrollTop，单位为像素。",
                    "en": "Emitted with the current scrollTop in pixels when the scroll container scrolls."
                }
            },
            "slots": {
                "loading": {
                    "zh": "提供加载状态内容；虚拟器动态导入加载时和非空列表就绪后的底部都会渲染该插槽。",
                    "en": "Provides loading content. It renders while the virtualizer dependency loads and at the bottom of a ready, non-empty list."
                },
                "empty": {
                    "zh": "items 为空时替换空状态文案；仅空列表分支渲染。",
                    "en": "Replaces the empty-state message and is rendered only in the empty-list branch.",
                    "notes": {
                        "zh-CN": [
                            "未提供插槽内容时显示 virtualScroll.empty：“暂无数据”。"
                        ],
                        "en": [
                            "Without slot content, the component displays virtualScroll.empty: “No data available”."
                        ]
                    }
                },
                "default": {
                    "zh": "渲染每个可见虚拟条目；作用域提供原始 item 和其零基 index。",
                    "en": "Renders each visible virtual item. Its scope provides the original item and its zero-based index."
                }
            },
            "exposes": {
                "scrollToIndex": {
                    "zh": "滚动到指定条目索引；索引会限制在现有范围内，空列表或虚拟器尚不可用时不执行。",
                    "en": "Scrolls to an item index. The index is clamped to the available range; it does nothing for an empty list or before the virtualizer is available."
                },
                "measureElement": {
                    "zh": "将指定 DOM 元素交给虚拟器测量；元素为 null 或虚拟器未就绪时不执行。",
                    "en": "Passes the specified DOM element to the virtualizer for measurement. It does nothing for null or before the virtualizer is ready."
                },
                "measure": {
                    "zh": "重新测量所有已挂载条目的尺寸，适用于内容高度变化后。",
                    "en": "Re-measures all mounted item sizes, for use after content heights change."
                },
                "virtualizer": {
                    "zh": "底层 TanStack Virtualizer 的浅层响应式引用；依赖加载完成前或加载失败时引用值为 null。",
                    "en": "The shallow reactive reference to the underlying TanStack Virtualizer. Its value is null until the dependency loads, and remains null if loading fails."
                }
            }
        }
    }
} satisfies ApiContent

export default content
