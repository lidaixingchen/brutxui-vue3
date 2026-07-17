<script setup lang="ts">
import { ref, shallowRef, computed, watch, provide, getCurrentInstance, type Ref, type ComputedRef } from 'vue';
import { getDocument } from '@/lib/env';
import { cn } from '@/lib/utils';
import TreeViewNode from './TreeViewNode.vue';
import { getCheckState, getAllDescendantIds, moveNode, cloneTree } from './tree-view-utils';
import { useLocale } from '@/composables/useLocale';
import type { SelectionMode, TreeNode } from './types';
import type { CheckState } from './tree-view-utils';

export type { SelectionMode, TreeNode, CheckState };

export interface TreeViewContext {
    lazy: ComputedRef<boolean>;
    retryOnError: ComputedRef<boolean>;
    loadingKeys: Ref<Set<string>>;
    failedKeys: Ref<Set<string>>;
    draggable: ComputedRef<boolean>;
    draggedNode: Ref<TreeNode | null>;
    dragOverNode: Ref<TreeNode | null>;
    dropType: Ref<'before' | 'after' | 'inner' | null>;
    triggerLoad: (node: TreeNode) => Promise<void>;
    onNodeDragStart: (event: DragEvent, node: TreeNode) => void;
    onNodeDragOver: (event: DragEvent, node: TreeNode, rect: DOMRect, clientY: number) => void;
    onNodeDragEnter: (event: DragEvent, node: TreeNode) => void;
    onNodeDragLeave: (event: DragEvent, node: TreeNode) => void;
    onNodeDragEnd: (event: DragEvent, node: TreeNode) => void;
    onNodeDrop: (event: DragEvent, node: TreeNode) => void;
}

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
let isUpdatingInternally = false;

watch(
    () => props.nodes,
    (newVal) => {
        if (isUpdatingInternally) {
            isUpdatingInternally = false;
            return;
        }
        localNodes.value = cloneTree(newVal);
    },
    { immediate: true }
);

function emitNodesUpdate() {
    const instance = getCurrentInstance();
    const hasListener = !!instance?.vnode.props?.['onUpdate:nodes'];
    if (hasListener) {
        isUpdatingInternally = true;
    }
    emit('update:nodes', localNodes.value);
}

// 使用 shallowRef 避免对 Set 进行深层响应式转换
// defaultExpanded 仅作为非受控初始值：初始化时生效，后续变化不覆盖用户手动展开状态。
// 若需受控同步展开状态，应通过 v-model:expanded（expanded prop + update:expanded event）实现。
const expandedIds = shallowRef<Set<string>>(new Set(props.defaultExpanded));

const checkedSet = computed(() => new Set(props.checkedIds));

function toggleExpand(id: string) {
    const nextSet = new Set(expandedIds.value)
    if (nextSet.has(id)) {
        nextSet.delete(id)
    } else {
        nextSet.add(id)
        
        const node = findNodeById(localNodes.value, id);
        if (node && props.lazy && props.load && !node.loaded && !node.isLeaf) {
            triggerLoad(node);
        }
    }
    expandedIds.value = nextSet
    emit('expand', id, nextSet.has(id))
    emit('update:expanded', Array.from(nextSet))
}

function selectNode(node: TreeNode) {
    emit('update:modelValue', node.id);
    emit('select', node);
}

function toggleCheck(node: TreeNode) {
    if (node.disabled) return
    const state = getCheckState(node, checkedSet.value)
    const descendantIds = getAllDescendantIds(node)
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
    const nextIndex = currentIndex + direction
    if (nextIndex >= 0 && nextIndex < items.length) {
        items[nextIndex].focus()
    }
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
    const items = getVisibleTreeItems()
    if (items.length === 0) return
    const activeEl = doc.activeElement
    if (!(activeEl instanceof HTMLElement)) return
    const currentItem = activeEl.closest('[role="treeitem"]')
    if (!(currentItem instanceof HTMLElement)) return
    const parentGroup = currentItem.parentElement?.closest('[role="treeitem"]')
    if (parentGroup instanceof HTMLElement) {
        parentGroup.focus()
    }
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
        const firstChild = childGroup.querySelector('[role="treeitem"]')
        if (firstChild instanceof HTMLElement) {
            firstChild.focus()
        }
    }
}

function handleFocusFirst() {
    const items = getVisibleTreeItems()
    if (items.length === 0) return
    items[0].focus()
}

function handleFocusLast() {
    const items = getVisibleTreeItems()
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
    if (loadingKeys.value.has(node.id)) return;
    
    loadingKeys.value.add(node.id);
    node.loading = true;
    failedKeys.value.delete(node.id);
    emitNodesUpdate();
    
    try {
        const result = await props.load?.(node);
        if (result) {
            node.children = result;
        }
        node.loaded = true;
        node.loading = false;
        emitNodesUpdate();
    } catch (err) {
        node.loading = false;
        node.loaded = false;
        failedKeys.value.add(node.id);
        console.error(`Failed to load children for node ${node.id}:`, err);
        emitNodesUpdate();
    } finally {
        loadingKeys.value.delete(node.id);
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
        emitNodesUpdate();
        return;
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
    <div ref="treeRootRef" :class="rootClass" role="tree" :aria-label="t('treeView.fileTree')">
        <TreeViewNode
            v-for="(node, index) in localNodes"
            :key="node.id"
            :node="node"
            :selected-id="modelValue"
            :expanded-ids="expandedIds"
            :depth="0"
            :is-first-root="index === 0 && !modelValue"
            :selection-mode="selectionMode"
            :checked-ids="checkedSet"
            :disabled="node.disabled ?? false"
            @toggle="toggleExpand"
            @select="selectNode"
            @check="toggleCheck"
            @focus-prev="handleFocusPrev"
            @focus-next="handleFocusNext"
            @focus-parent="handleFocusParent"
            @focus-first-child="handleFocusFirstChild"
            @focus-first="handleFocusFirst"
            @focus-last="handleFocusLast"
        />
    </div>
</template>
