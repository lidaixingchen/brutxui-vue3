<script setup lang="ts">
import { ref, shallowRef, computed, watch, provide, type ComputedRef } from 'vue';
import { getDocument } from '@/lib/env';
import { cn } from '@/lib/utils';
import TreeViewNode from './TreeViewNode.vue';
import { getCheckStateMap, getCheckableDescendantIds, moveNode, cloneTree, TREE_CHECK_STATES_KEY } from './tree-view-utils';
import { useLocale } from '@/composables/useLocale';
import type { CheckState, SelectionMode, TreeNode, TreeViewContext } from './types';

export type { CheckState, SelectionMode, TreeNode, TreeViewContext };

interface TreeViewProps {
    nodes: TreeNode[];
    modelValue?: string | null;
    checkedIds?: string[];
    selectionMode?: SelectionMode;
    defaultExpanded?: string[];
    class?: string;
    
    // Drag & Drop
    draggable?: boolean;
    allowDrag?: (node: TreeNode) => boolean;
    allowDrop?: (dragNode: TreeNode, dropNode: TreeNode, dropType: 'before' | 'after' | 'inner') => boolean;
    
    // Lazy Loading
    lazy?: boolean;
    load?: (node: TreeNode) => Promise<TreeNode[]>;
    retryOnError?: boolean;
    
    // Filter
    filterable?: boolean;
    filterMethod?: (query: string, node: TreeNode) => boolean;
}

const props = withDefaults(defineProps<TreeViewProps>(), {
    modelValue: null,
    checkedIds: () => [],
    selectionMode: 'single',
    defaultExpanded: () => [],
    class: undefined,
    draggable: false,
    allowDrag: undefined,
    allowDrop: undefined,
    lazy: false,
    load: undefined,
    retryOnError: false,
    filterable: false,
    filterMethod: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [id: string | null];
    'update:checkedIds': [ids: string[]];
    'update:expanded': [ids: string[]];
    'update:nodes': [nodes: TreeNode[]];
    'select': [node: TreeNode];
    'expand': [id: string, expanded: boolean];
    'check': [node: TreeNode, checked: boolean];
    
    // Drag & Drop Events
    'node-drag-start': [event: DragEvent, node: TreeNode];
    'node-drag-enter': [event: DragEvent, node: TreeNode];
    'node-drag-leave': [event: DragEvent, node: TreeNode];
    'node-drag-over': [event: DragEvent, node: TreeNode];
    'node-drag-end': [event: DragEvent, node: TreeNode];
    'node-drop': [event: DragEvent, node: TreeNode, dropType: 'before' | 'after' | 'inner'];
}>();

const { t } = useLocale();

const treeRootRef = ref<HTMLDivElement | null>(null);

const localNodes = ref<TreeNode[]>([]);
// 父级原样回写时保留本地节点引用，使懒加载与拖拽流程共用同一份节点状态。
let lastEmittedNodes: TreeNode[] | null = null;

watch(
    () => props.nodes,
    (newVal) => {
        if (lastEmittedNodes !== null && newVal === lastEmittedNodes) {
            lastEmittedNodes = null;
            return;
        }
        lastEmittedNodes = null;
        // 父级持有 localNodes 同一引用时，深层变更已直接反映到本地树。
        if (newVal === localNodes.value) return;
        localNodes.value = cloneTree(newVal);
    },
    { immediate: true, deep: true }
);

function emitNodesUpdate() {
    emit('update:nodes', localNodes.value);
    lastEmittedNodes = localNodes.value;
}

// 使用 shallowRef 避免对 Set 进行深层响应式转换
// defaultExpanded 仅作为非受控初始值：初始化时生效，后续变化不覆盖用户手动展开状态。
// 若需受控同步展开状态，应通过 v-model:expanded（expanded prop + update:expanded event）实现。
const expandedIds = shallowRef<Set<string>>(new Set(props.defaultExpanded));

const checkedSet = computed(() => new Set(props.checkedIds));
const checkStates: ComputedRef<ReadonlyMap<string, CheckState>> = computed((): ReadonlyMap<string, CheckState> => {
    if (props.selectionMode !== 'checkbox') return new Map<string, CheckState>()
    return getCheckStateMap(localNodes.value, checkedSet.value)
})
const firstFocusableRootIndex = computed(() =>
    localNodes.value.findIndex((node) => !node.disabled && !node.hidden)
)
const pointerHighlightedId = ref<string | undefined>(undefined)

function handleNodePointerEnter(id: string) {
    pointerHighlightedId.value = id
}

function handleNodePointerLeave(id: string) {
    if (pointerHighlightedId.value === id) pointerHighlightedId.value = undefined
}

function clearPointerHighlight() {
    pointerHighlightedId.value = undefined
}

function toggleExpand(id: string) {
    const node = findNodeById(localNodes.value, id);
    if (node?.disabled) return;
    const nextSet = new Set(expandedIds.value)
    if (nextSet.has(id)) {
        nextSet.delete(id)
    } else {
        nextSet.add(id)
        
        if (node && props.lazy && props.load && !node.loaded && !node.isLeaf) {
            triggerLoad(node);
        }
    }
    expandedIds.value = nextSet
    emit('expand', id, nextSet.has(id))
    emit('update:expanded', Array.from(nextSet))
}

function selectNode(node: TreeNode) {
    if (node.disabled) return;
    emit('update:modelValue', node.id);
    emit('select', node);
}

function toggleCheck(node: TreeNode) {
    if (node.disabled) return
    const state = checkStates.value.get(node.id) ?? 'unchecked'
    const descendantIds = getCheckableDescendantIds(node)
    const currentSet = new Set(checkedSet.value)

    if (state === 'checked' || state === 'indeterminate') {
        descendantIds.forEach(id => currentSet.delete(id))
    } else {
        descendantIds.forEach(id => currentSet.add(id))
    }

    const newIds = Array.from(currentSet)
    emit('update:checkedIds', newIds)
    emit('check', node, state === 'unchecked')
}

function getVisibleTreeItems(): HTMLElement[] {
    const root = treeRootRef.value
    if (!root) return []
    return Array.from(root.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        .filter((item) => item.getAttribute('data-hidden') !== 'true' && !item.parentElement?.closest('[data-hidden="true"]'))
}

function getNavigableTreeItems(): HTMLElement[] {
    return getVisibleTreeItems().filter((item) => item.getAttribute('aria-disabled') !== 'true')
}

function focusAdjacent(direction: -1 | 1) {
    const doc = getDocument()
    if (!doc) return
    const items = getVisibleTreeItems()
    if (items.length === 0) return
    const activeEl = doc.activeElement
    const currentItem = activeEl instanceof HTMLElement
        ? activeEl.closest('[role="treeitem"]')
        : null
    const currentIndex = currentItem instanceof HTMLElement
        ? items.indexOf(currentItem)
        : -1
    let nextIndex = currentIndex + direction
    while (
        nextIndex >= 0 &&
        nextIndex < items.length &&
        items[nextIndex]?.getAttribute('aria-disabled') === 'true'
    ) {
        nextIndex += direction
    }
    if (nextIndex >= 0 && nextIndex < items.length) items[nextIndex]?.focus()
}

function handleFocusPrev() {
    focusAdjacent(-1)
}

function handleFocusNext() {
    focusAdjacent(1)
}

function handleFocusParent() {
    const doc = getDocument()
    if (!doc) return
    const items = getNavigableTreeItems()
    if (items.length === 0) return
    const activeEl = doc.activeElement
    if (!(activeEl instanceof HTMLElement)) return
    let currentItem = activeEl.closest('[role="treeitem"]')
    if (!(currentItem instanceof HTMLElement)) return
    let parentItem = currentItem.parentElement?.closest('[role="treeitem"]')
    while (parentItem instanceof HTMLElement && !items.includes(parentItem)) {
        currentItem = parentItem
        parentItem = currentItem.parentElement?.closest('[role="treeitem"]')
    }
    if (parentItem instanceof HTMLElement && items.includes(parentItem)) parentItem.focus()
}

function handleFocusFirstChild() {
    const doc = getDocument()
    if (!doc) return
    const activeEl = doc.activeElement
    if (!(activeEl instanceof HTMLElement)) return
    const currentItem = activeEl.closest('[role="treeitem"]')
    if (!(currentItem instanceof HTMLElement)) return
    const childGroup = currentItem.querySelector('[role="group"]')
    if (childGroup) {
        const firstChild = getNavigableTreeItems().find((item) => item.parentElement === childGroup)
        firstChild?.focus()
    }
}

function handleFocusFirst() {
    const items = getNavigableTreeItems()
    if (items.length === 0) return
    items[0].focus()
}

function handleFocusLast() {
    const items = getNavigableTreeItems()
    if (items.length === 0) return
    items[items.length - 1].focus()
}

const draggedNode = ref<TreeNode | null>(null);
const dragOverNode = ref<TreeNode | null>(null);
const dropType = ref<'before' | 'after' | 'inner' | null>(null);

const loadingKeys = ref<Set<string>>(new Set());
const failedKeys = ref<Set<string>>(new Set());

function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children && node.children.length > 0) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

async function triggerLoad(node: TreeNode) {
    const nodeId = node.id;
    if (loadingKeys.value.has(nodeId)) return;

    loadingKeys.value.add(nodeId);
    node.loading = true;
    failedKeys.value.delete(nodeId);
    emitNodesUpdate();
    
    try {
        const result = await props.load?.(node);
        const currentNode = findNodeById(localNodes.value, nodeId);
        if (!currentNode) return;
        if (result) {
            currentNode.children = result;
        }
        currentNode.loaded = true;
        currentNode.loading = false;
        emitNodesUpdate();
    } catch (err) {
        console.error(`Failed to load children for node ${nodeId}:`, err);
        const currentNode = findNodeById(localNodes.value, nodeId);
        if (!currentNode) return;
        currentNode.loading = false;
        currentNode.loaded = false;
        failedKeys.value.add(nodeId);
        emitNodesUpdate();
    } finally {
        loadingKeys.value.delete(nodeId);
    }
}

function onNodeDragStart(event: DragEvent, node: TreeNode) {
    if (!props.draggable) return;
    if (props.allowDrag && !props.allowDrag(node)) {
        event.preventDefault();
        return;
    }
    draggedNode.value = node;
    emit('node-drag-start', event, node);
}

function onNodeDragOver(event: DragEvent, node: TreeNode, rect: DOMRect, clientY: number) {
    if (!props.draggable || !draggedNode.value) return;
    
    if (draggedNode.value.id === node.id) {
        dragOverNode.value = null;
        dropType.value = null;
        return;
    }
    
    const relativeY = clientY - rect.top;
    let type: 'before' | 'after' | 'inner';
    if (relativeY < rect.height * 0.25) {
        type = 'before';
    } else if (relativeY > rect.height * 0.75) {
        type = 'after';
    } else {
        type = 'inner';
    }
    
    if (props.allowDrop && !props.allowDrop(draggedNode.value, node, type)) {
        dragOverNode.value = null;
        dropType.value = null;
        return;
    }
    
    event.preventDefault();
    dragOverNode.value = node;
    dropType.value = type;
    emit('node-drag-over', event, node);
}

function onNodeDragEnter(event: DragEvent, node: TreeNode) {
    emit('node-drag-enter', event, node);
}

function onNodeDragLeave(event: DragEvent, node: TreeNode) {
    if (dragOverNode.value?.id === node.id) {
        dragOverNode.value = null;
        dropType.value = null;
    }
    emit('node-drag-leave', event, node);
}

function onNodeDragEnd(event: DragEvent, node: TreeNode) {
    draggedNode.value = null;
    dragOverNode.value = null;
    dropType.value = null;
    emit('node-drag-end', event, node);
}

function onNodeDrop(event: DragEvent, node: TreeNode) {
    if (!props.draggable || !draggedNode.value || !dragOverNode.value || !dropType.value) return;
    event.preventDefault();
    
    const dragId = draggedNode.value.id;
    const dropId = node.id;
    const type = dropType.value;
    
    emit('node-drop', event, node, type);
    
    const nextNodes = moveNode(localNodes.value, dragId, dropId, type);
    localNodes.value = nextNodes;
    emitNodesUpdate();
    
    draggedNode.value = null;
    dragOverNode.value = null;
    dropType.value = null;
}

let filterExpandedSnapshot: Set<string> | null = null

function filter(query: string) {
    if (!props.filterable) return;
    
    if (!query) {
        function resetHidden(nodesList: TreeNode[]) {
            for (const node of nodesList) {
                node.hidden = false;
                if (node.children) {
                    resetHidden(node.children);
                }
            }
        }
        resetHidden(localNodes.value);
        if (filterExpandedSnapshot !== null) {
            expandedIds.value = filterExpandedSnapshot;
            emit('update:expanded', Array.from(filterExpandedSnapshot));
            filterExpandedSnapshot = null;
        }
        emitNodesUpdate();
        return;
    }
    
    if (filterExpandedSnapshot === null) {
        filterExpandedSnapshot = new Set(expandedIds.value);
    }
    
    const method = props.filterMethod || ((q: string, n: TreeNode) => 
        n.label.toLowerCase().includes(q.toLowerCase())
    );
    
    const nextExpanded = new Set(expandedIds.value);
    
    function runFilter(nodesList: TreeNode[]): boolean {
        let anyMatch = false;
        for (const node of nodesList) {
            const selfMatch = method(query, node);
            let childrenMatch = false;
            
            if (node.children && node.children.length > 0) {
                childrenMatch = runFilter(node.children);
            }
            
            const isMatch = selfMatch || childrenMatch;
            node.hidden = !isMatch;
            
            if (isMatch) {
                anyMatch = true;
                if (childrenMatch) {
                    nextExpanded.add(node.id);
                }
            }
        }
        return anyMatch;
    }
    
    runFilter(localNodes.value);
    expandedIds.value = nextExpanded;
    emit('update:expanded', Array.from(nextExpanded));
    emitNodesUpdate();
}

provide(TREE_CHECK_STATES_KEY, checkStates)
provide('TreeViewContext', {
    lazy: computed(() => props.lazy),
    retryOnError: computed(() => props.retryOnError),
    loadingKeys,
    failedKeys,
    draggable: computed(() => props.draggable),
    draggedNode,
    dragOverNode,
    dropType,
    triggerLoad,
    onNodeDragStart,
    onNodeDragOver,
    onNodeDragEnter,
    onNodeDragLeave,
    onNodeDragEnd,
    onNodeDrop,
});

function reloadNode(nodeKey: string) {
    const node = findNodeById(localNodes.value, nodeKey)
    if (!node) return
    node.loaded = false
    node.loading = false
    node.children = undefined
    loadingKeys.value.delete(nodeKey)
    failedKeys.value.delete(nodeKey)
    emitNodesUpdate()
    if (props.lazy && props.load) {
        triggerLoad(node)
    }
}

defineExpose({
    filter,
    reloadNode,
});

const rootClass = computed(() => cn('flex flex-col gap-0.5', props.class));
</script>

<template>
    <div
        ref="treeRootRef"
        :class="rootClass"
        role="tree"
        :aria-label="t('treeView.fileTree')"
        @focusin="clearPointerHighlight"
        @pointerleave="clearPointerHighlight"
    >
        <TreeViewNode
            v-for="(node, index) in localNodes"
            :key="node.id"
            :node="node"
            :selected-id="modelValue"
            :expanded-ids="expandedIds"
            :depth="0"
            :is-first-root="index === firstFocusableRootIndex && !modelValue"
            :selection-mode="selectionMode"
            :checked-ids="checkedSet"
            :disabled="node.disabled ?? false"
            :highlighted-id="pointerHighlightedId"
            @toggle="toggleExpand"
            @select="selectNode"
            @check="toggleCheck"
            @focus-prev="handleFocusPrev"
            @focus-next="handleFocusNext"
            @focus-parent="handleFocusParent"
            @focus-first-child="handleFocusFirstChild"
            @focus-first="handleFocusFirst"
            @focus-last="handleFocusLast"
            @pointer-enter="handleNodePointerEnter"
            @pointer-leave="handleNodePointerLeave"
        />
    </div>
</template>
