import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        TreeView: {
            props: {
                nodes: { zh: '树形节点数据源；每个节点由 id、label 及可选的 children、disabled 等字段描述。', en: 'The tree data source. Each node is described by an id, label, and optional fields such as children and disabled.' },
                modelValue: { zh: '当前选中节点的 id，通过 v-model 受控；无选中项时为 null。', en: 'The id of the selected node, controlled with v-model; null means no node is selected.' },
                checkedIds: { zh: '复选模式下已勾选节点的 id 列表，通过 v-model:checkedIds 受控。', en: 'The ids of checked nodes in checkbox mode, controlled with v-model:checkedIds.' },
                selectionMode: { zh: '选择模式；single 选择一个节点，checkbox 允许勾选多个节点。', en: 'The selection mode: single selects one node, while checkbox allows multiple checked nodes.' },
                defaultExpanded: { zh: '首次渲染时默认展开的节点 id；后续展开状态由组件内部维护。', en: 'Node ids expanded on initial render; subsequent expansion state is maintained internally.' },
                class: { zh: '追加到树形列表根容器的自定义 CSS 类。', en: 'Custom CSS classes added to the tree root container.' },
                draggable: { zh: '启用节点拖拽排序，并在放置后更新节点数据。', en: 'Enables node drag-and-drop sorting and updates the node data after a drop.' },
                allowDrag: { zh: '按节点判断是否允许开始拖拽；未提供时所有节点均可拖动。', en: 'Decides whether dragging may start for a node; all nodes are draggable when omitted.' },
                allowDrop: { zh: '按拖动节点、目标节点和 before、after 或 inner 位置判断是否允许放置。', en: 'Decides whether a dragged node may be placed before, after, or inside a target node.' },
                lazy: { zh: '启用按需加载节点；展开尚未加载的节点时调用 load。', en: 'Enables lazy node loading and calls load when an unloaded node is expanded.' },
                load: { zh: '异步加载指定节点的子节点；返回的节点数组会写回树数据。', en: 'Asynchronously loads children for a node; the returned nodes are written into the tree data.' },
                retryOnError: { zh: '加载失败时显示重试操作；启用后重试会重新请求该节点。', en: 'Shows a retry action after a load failure and requests that node again when activated.' },
                filterable: { zh: '启用节点过滤能力；通过暴露的 filter 方法提交查询文本。', en: 'Enables node filtering; provide a query through the exposed filter method.' },
                filterMethod: { zh: '自定义节点匹配规则；返回 true 的节点保留，未提供时按节点 label 匹配查询文本。', en: 'Custom node matching rule. Return true to keep a node; when omitted, the query is matched against its label.' },
            },
            events: {
                'update:modelValue': { zh: '选中节点变化时发出新的节点 id；清空选择时发出 null。', en: 'Emits the new selected node id when selection changes, or null when selection is cleared.' },
                select: { zh: '用户选择节点时发出对应的完整 TreeNode 数据。', en: 'Emits the selected node as a TreeNode when the user selects it.' },
                expand: { zh: '节点展开状态切换时发出节点 id 与切换后的布尔状态。', en: 'Emits a node id and its new expanded state when the node is expanded or collapsed.' },
                'update:checkedIds': { zh: '复选集合变化时发出最新的已勾选节点 id 列表。', en: 'Emits the updated list of checked node ids when the checked set changes.' },
                'update:expanded': { zh: '展开集合变化时发出最新的展开节点 id 列表。', en: 'Emits the updated list of expanded node ids when the expanded set changes.' },
                'update:nodes': { zh: '拖拽排序改变树结构后发出更新后的完整节点数据。', en: 'Emits the updated tree data after drag-and-drop changes the node order or parent.' },
                check: { zh: '复选状态切换时发出节点数据及切换后的勾选状态。', en: 'Emits the node and its new checked state when its checkbox changes.' },
                'node-drag-start': { zh: '节点拖拽开始时发出原生 DragEvent 和被拖动节点。', en: 'Emits the native DragEvent and dragged node when dragging starts.' },
                'node-drag-enter': { zh: '拖动指针进入节点区域时发出 DragEvent 和该节点。', en: 'Emits the DragEvent and node when the pointer enters that node during a drag.' },
                'node-drag-leave': { zh: '拖动指针离开节点区域时发出 DragEvent 和该节点。', en: 'Emits the DragEvent and node when the pointer leaves that node during a drag.' },
                'node-drag-over': { zh: '拖动指针在节点上移动时发出 DragEvent 和该节点。', en: 'Emits the DragEvent and node while the pointer moves over that node during a drag.' },
                'node-drag-end': { zh: '节点拖拽结束时发出 DragEvent 和被拖动节点。', en: 'Emits the DragEvent and dragged node when dragging ends.' },
                'node-drop': { zh: '节点成功放置时发出 DragEvent、目标节点以及 before、after 或 inner 放置位置。', en: 'Emits the DragEvent, target node, and before, after, or inner drop position after a successful drop.' },
            },
            exposes: {
                filter: { zh: '按查询文本过滤节点；清空查询字符串可恢复全部节点。', en: 'Filters nodes by query text; pass an empty string to restore all nodes.' },
                reloadNode: { zh: '重新加载指定节点的子节点；用于刷新懒加载数据。', en: 'Reloads the children of the specified node to refresh its lazy-loaded data.' },
            },
        },
        TreeViewNode: {
            props: {
                node: { zh: '此行对应的树节点数据。', en: 'The tree node represented by this row.' },
                selectedId: { zh: '当前选中节点的 id，用于标记此行是否处于选中状态。', en: 'The currently selected node id, used to determine whether this row is selected.' },
                expandedIds: { zh: '当前已展开节点 id 集合，用于显示此节点的展开状态。', en: 'The set of expanded node ids, used to determine this node’s expanded state.' },
                depth: { zh: '节点的树层级深度，用于计算行缩进。', en: 'The node’s depth in the tree, used to calculate row indentation.' },
                isFirstRoot: { zh: '标记此节点是否为根级首项，用于根节点布局。', en: 'Marks whether this is the first root node for root-row layout.' },
                selectionMode: { zh: '此行使用的选择模式，决定交互是单选还是复选。', en: 'The selection mode for this row, determining single selection or checkbox interaction.' },
                checkedIds: { zh: '当前已勾选节点 id 集合，用于显示复选状态。', en: 'The set of checked node ids, used to render checkbox state.' },
                disabled: { zh: '禁用此节点的选择、勾选和键盘激活交互。', en: 'Disables selection, checking, and keyboard activation for this node.' },
            },
            events: {
                select: { zh: '此节点被激活或选中时发出完整节点数据。', en: 'Emits the full node data when this node is activated or selected.' },
                toggle: { zh: '请求切换展开状态时发出此节点 id。', en: 'Emits this node id when its expanded state should toggle.' },
                check: { zh: '请求切换复选状态时发出此节点数据。', en: 'Emits this node when its checkbox state should toggle.' },
                'focus-prev': { zh: '请求将焦点移动到上一个可见树节点。', en: 'Requests moving focus to the previous visible tree node.' },
                'focus-next': { zh: '请求将焦点移动到下一个可见树节点。', en: 'Requests moving focus to the next visible tree node.' },
                'focus-parent': { zh: '请求将焦点移动到父节点。', en: 'Requests moving focus to the parent node.' },
                'focus-first-child': { zh: '请求将焦点移动到展开后可见的第一个子节点。', en: 'Requests moving focus to the first child when the node is expanded.' },
                'focus-first': { zh: '请求将焦点移动到树中的第一个可见节点。', en: 'Requests moving focus to the first visible node in the tree.' },
                'focus-last': { zh: '请求将焦点移动到树中的最后一个可见节点。', en: 'Requests moving focus to the last visible node in the tree.' },
            },
            exposes: {
                focus: { zh: '将焦点移动到此节点对应的树项元素。', en: 'Moves focus to the tree item element for this node.' },
                nodeId: { zh: '此行对应的节点 id。', en: 'The id of the node represented by this row.' },
            },
        },
    },
} satisfies ApiContent

export default content
