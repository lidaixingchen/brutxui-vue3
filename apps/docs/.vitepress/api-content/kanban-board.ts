import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        KanbanBoard: {
            props: {
                modelValue: { zh: '看板的列及卡片数据，通过 v-model 接收移动后的新数据；列 id 和卡片 id 应保持唯一。', en: 'The board columns and cards. Bind with v-model to receive updated data after moves, and keep column and card IDs unique.' },
                class: { zh: '合并到横向排列各列的看板容器上的自定义 CSS 类。', en: 'Custom CSS classes merged onto the board container that arranges columns horizontally.' },
            },
            events: {
                'update:modelValue': { zh: '有效卡片移动或列排序后发出新的列数组，先于对应的移动事件发出。', en: 'Emits a new column array after a successful card move or column reorder, before the corresponding move event.' },
                'card-move': { zh: '卡片通过鼠标、键盘或实例方法成功移动后发出卡片 id、来源列 id 和目标列 id；同列排序时两列 id 相同。', en: 'Emits the card ID, source column ID, and target column ID after a successful mouse, keyboard, or instance-method move. Both column IDs are equal for reordering within one column.' },
                'card-click': { zh: '点击卡片或聚焦后按 Enter 时发出卡片与列 id；卡片拖拽期间不会发出。Space 用于抓取与放下卡片。', en: 'Emits the card and column ID on a click or Enter while focused. It is suppressed during card dragging; Space grabs or releases the card.' },
                'column-move': { zh: '拖拽列标题或调用 moveColumn 成功排序后发出列 id、原索引与新索引，索引从 0 开始。', en: 'Emits the column ID and old/new zero-based indices after a successful header drag reorder or moveColumn call.' },
                'add-card': { zh: '点击内置添加按钮或调用实例 addCard 时发出列 id；由使用方创建卡片并更新数据。', en: 'Emits the column ID when the built-in add button is clicked or instance addCard is called. The consumer creates the card and updates the data.' },
            },
            exposes: {
                moveCard: { zh: '按方向移动卡片并处理焦点与播报。mode 为 adjacent 时移到相邻列，为 in-column 时在当前列排序；direction 为 1 表示向右或向下，其他值按向左或向上处理。省略 mode 时使用 adjacent。', en: 'Moves a card by direction and handles focus and announcements. adjacent moves between columns; in-column reorders within the current column. A direction of 1 means right or down; other values mean left or up. The mode defaults to adjacent.' },
                moveColumn: { zh: '把 fromId 对应的列移到 toId 当前所在索引，其间各列顺移；成功后发出数据更新与列移动事件。', en: 'Moves the fromId column to the current index of toId, shifting intervening columns. A successful move emits data-update and column-move events.' },
                addCard: { zh: '为指定列发出 add-card 请求；此方法本身不创建卡片。', en: 'Emits an add-card request for the given column. The method itself does not create a card.' },
                getColumn: { zh: '按 id 返回当前 modelValue 中的列对象；找不到时返回 undefined，返回值保留原对象引用。', en: 'Returns the column object from the current modelValue by ID, or undefined when absent. It preserves the original object reference.' },
                getAllColumns: { zh: '返回当前 modelValue 列数组引用；需要编辑时由使用方构建新数据并更新绑定值。', en: 'Returns the current modelValue column-array reference. To edit it, construct new data and update the bound value.' },
            },
        },
    },
    supplements: {
        KanbanBoard: [{
            name: 'add-{columnId}',
            kind: 'slots',
            type: '{ columnId: string }',
            origin: 'supplement',
            source: { file: 'packages/ui/src/components/kanban/KanbanBoard.vue', line: 360 },
            description: {
                'zh-CN': '替换指定列底部的添加卡片入口，接收该列 id。未提供时渲染 outline、sm 的 Button，点击后发出 add-card。',
                en: 'Replaces the add-card entry at the bottom of the named column and receives its ID. By default, an outline, sm Button emits add-card when clicked.',
            },
        }],
    },
} satisfies ApiContent

export default content
