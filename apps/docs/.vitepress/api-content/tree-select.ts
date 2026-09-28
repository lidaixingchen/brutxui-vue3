import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        TreeSelect: {
            props: describe({
                nodes: ['树形选项数据；节点通过 id、label 与可选 children 描述，并可携带 disabled 等状态。', 'Hierarchical options. Each node uses an id and label, may contain children, and can carry states such as disabled.'],
                modelValue: ['当前选中的节点 ID；单选为字符串，多选为字符串数组，通过 v-model 受控。', 'The selected node IDs, controlled with v-model. A single selection is a string; multiple selections use a string array.'],
                open: ['受控的下拉面板展开状态；与 update:open 事件配合使用 v-model:open。', 'The controlled open state of the dropdown panel; pair it with update:open for v-model:open.'],
                multiple: ['启用后允许同时选择多个节点，modelValue 与 select 事件返回数组。', 'Allows selecting multiple nodes; modelValue and the select event then use arrays.'],
                searchable: ['控制面板中是否显示用于过滤节点的搜索框。', 'Controls whether the panel shows a search box for filtering nodes.'],
                placeholder: ['未选择节点时触发器显示的文字；未设置时使用当前语言的默认文案。', 'Text shown by the trigger when no node is selected; the current locale’s default text is used when omitted.'],
                searchPlaceholder: ['搜索框的占位文字；未设置时使用当前语言的默认文案。', 'Placeholder for the search field; the current locale’s default text is used when omitted.'],
                emptyText: ['过滤结果为空时显示的提示；未设置时使用当前语言的默认文案。', 'Message shown when filtering returns no nodes; the current locale’s default text is used when omitted.'],
                clearable: ['允许通过触发器中的清除操作移除当前选择。', 'Allows the current selection to be cleared from the trigger.'],
                disabled: ['禁用触发器和面板交互，并阻止打开下拉面板。', 'Disables trigger and panel interaction and prevents the dropdown from opening.'],
                size: ['设置触发器的尺寸变体。', 'Sets the trigger size variant.'],
                ariaLabel: ['设置触发器的无障碍标签。', 'Sets the trigger’s accessible label.'],
                maxDisplay: ['多选时触发器最多直接显示的已选标签数；其余选择合并为计数。', 'In multiple mode, the maximum number of selected tags shown directly in the trigger; remaining selections are summarized as a count.'],
                maxHeight: ['设置树形下拉列表的 CSS 最大高度。', 'Sets the CSS max-height of the tree dropdown.'],
                dropdownClass: ['追加到下拉面板的 CSS 类。', 'CSS classes added to the dropdown panel.'],
                class: ['追加到选择器触发器根元素的 CSS 类。', 'CSS classes added to the select trigger root.'],
                iconSize: ['设置触发器主图标尺寸。', 'Sets the size of the trigger’s main icon.'],
                itemVariant: ['设置树节点选中高亮使用的视觉变体。', 'Sets the visual variant used to highlight selected tree nodes.'],
            }),
            events: describe({
                'update:modelValue': ['选择变化时发出新的节点 ID；清除或无有效选择时可发出 undefined。', 'Emits the updated node ID or IDs when the selection changes; clearing or having no valid selection may emit undefined.'],
                'update:open': ['下拉展开状态变化时发出新布尔值，可用于 v-model:open。', 'Emits the new boolean when the dropdown open state changes and can be used with v-model:open.'],
                'open-change': ['下拉面板打开或关闭后发出当前展开状态。', 'Emits the current open state when the dropdown panel opens or closes.'],
                select: ['用户选择或清除节点时发出节点对象；多选模式返回节点数组。', 'Emits the selected node when the user selects or clears a node; multiple mode returns an array of nodes.'],
            }),
            exposes: describe({
                searchQuery: ['当前搜索关键词的响应式状态。', 'The reactive state containing the current search query.'],
                selectedNodes: ['根据 modelValue 解析出的已选节点列表；该计算状态只读。', 'The selected node objects resolved from modelValue; this computed state is read-only.'],
                expandedIds: ['当前展开节点的 ID 集合；可通过组件实例读取或替换。', 'The set of IDs for currently expanded nodes; it can be read or replaced through the component instance.'],
                focus: ['将键盘焦点移至选择器触发器。', 'Moves keyboard focus to the select trigger.'],
                open: ['下拉面板的可写展开状态；写入会更新内部或受控状态并发出 update:open。', 'The writable open state of the dropdown; setting it updates internal or controlled state and emits update:open.'],
            }),
        },
        TreeSelectNode: {
            props: describe({
                node: ['当前渲染的树节点及其数据、层级关系和禁用状态。', 'The tree node currently rendered, including its data, hierarchy, and disabled state.'],
                selectedIds: ['已选节点 ID 集合，用于确定当前节点是否选中。', 'The set of selected node IDs used to determine whether this node is selected.'],
                expandedIds: ['已展开节点 ID 集合，用于确定当前节点的展开状态。', 'The set of expanded node IDs used to determine this node’s expanded state.'],
                depth: ['当前节点在树中的层级深度，用于计算缩进。', 'The node’s depth in the tree, used to calculate indentation.'],
                multiple: ['指示父选择器是否处于多选模式。', 'Indicates whether the parent select is in multiple-selection mode.'],
                focusedId: ['当前键盘焦点节点的 ID，用于呈现焦点状态。', 'The ID of the node currently holding keyboard focus, used to render its focus state.'],
                variant: ['设置节点选中状态的视觉变体。', 'Sets the visual variant for the node’s selected state.'],
            }),
            events: describe({
                select: ['叶子节点被选择时发出该节点对象。', 'Emits the node object when a leaf node is selected.'],
                focus: ['当前节点获得焦点时发出节点 ID。', 'Emits the node ID when this node receives focus.'],
                toggle: ['非叶子节点被展开或折叠时发出节点 ID。', 'Emits the node ID when a non-leaf node is expanded or collapsed.'],
            }),
        },
    },
} satisfies ApiContent

export default content
