import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Pagination: {
            props: {
                modelValue: { zh: '当前页码，从 1 开始并通过 v-model 同步；显示时会约束在可用页码范围内。', en: 'The current page number, starting at 1 and synchronized through v-model. Displayed values are clamped to the available page range.' },
                totalPages: { zh: '显式总页数；提供时优先于 total 与 pageSize 的计算结果。', en: 'The explicit total page count, taking precedence over the total and pageSize calculation.' },
                total: { zh: '数据总条数，用于计算总页数及显示 total 区域。', en: 'The total item count, used to calculate pages and display the total section.' },
                pageSize: { zh: '每页条数，用于页数计算和页大小选择器，支持 v-model:pageSize。', en: 'The item count per page, used for page calculation and the size selector. Supports v-model:pageSize.' },
                pageSizes: { zh: '每页条数选择器中的可选值列表。', en: 'The available values in the page-size selector.' },
                layout: { zh: '逗号分隔的显示区域名称：total、sizes、prev、pager、next、jumper。用于选择显示区域，渲染顺序按组件布局固定。', en: 'Comma-separated section names: total, sizes, prev, pager, next, and jumper. Selects visible sections; their rendering order follows the fixed component layout.' },
                disabled: { zh: '禁用页码导航、页大小选择及跳转输入。', en: 'Disables page navigation, page-size selection, and the jump input.' },
                background: { zh: '为未激活的页码按钮及前后导航按钮添加背景色。', en: 'Adds a background to inactive page buttons and previous/next navigation controls.' },
                hideOnSinglePage: { zh: '计算出的总页数不超过一页时隐藏整个分页导航。', en: 'Hides the entire pagination navigation when the calculated page count is at most one.' },
                siblingCount: { zh: '在当前页两侧显示的相邻页码数量，用于计算省略号区域。', en: 'The number of neighboring pages around the current page, used to determine ellipsis regions.' },
                showFirstLast: { zh: '显示首页与末页按钮；还需分别在 layout 中启用 prev 和 next 区域。', en: 'Shows first and last page buttons, also requiring the prev and next sections respectively in layout.' },
                showPageNumbers: { zh: 'pager 区域显示页码按钮；关闭时改为当前页与总页数的计数文本。', en: 'Displays page buttons in the pager section. When disabled, shows the current page and total page count instead.' },
                variant: { zh: '分页导航容器的视觉变体。', en: 'The visual variant of the pagination navigation container.' },
                size: { zh: '分页导航及页码按钮的尺寸变体。', en: 'The size variant of the pagination navigation and page buttons.' },
                class: { zh: '合并到根 nav 元素的自定义 CSS 类。', en: 'Custom CSS classes merged onto the root nav element.' },
            },
            events: {
                'update:modelValue': { zh: '点击页码或导航按钮、提交有效跳页值时发出目标页码；改变每页条数导致当前页超出范围时也会发出调整后的页码。', en: 'Emits the target page when a page or navigation button is used or a valid jump is submitted. Also emits an adjusted page when a page-size change places the current page out of range.' },
                'update:pageSize': { zh: '页大小选择器改变时发出新的每页条数。', en: 'Emits the new item count per page when the page-size selector changes.' },
                jump: { zh: '点击省略号按钮时发出，供使用方打开自定义跳页交互；该事件本身不改变页码。', en: 'Emitted when an ellipsis button is clicked so the consumer can open custom page-jump controls. The event itself does not change the page.' },
            },
        },
    },
} satisfies ApiContent

export default content
