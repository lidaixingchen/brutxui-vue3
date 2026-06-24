<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { cn } from '../../lib/utils';
import TreeViewNode from './TreeViewNode.vue';
import { useLocale } from '@/composables/useLocale';

export interface TreeNode {
    id: string;
    label: string;
    icon?: string;
    children?: TreeNode[];
    data?: unknown;
}

interface TreeViewProps {
    nodes: TreeNode[];
    modelValue?: string | null;
    defaultExpanded?: string[];
    class?: string;
}

const props = withDefaults(defineProps<TreeViewProps>(), {
    modelValue: null,
    defaultExpanded: () => [],
    class: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [id: string | null];
    'select': [node: TreeNode];
    'expand': [id: string, expanded: boolean];
}>();

const { t } = useLocale();

const treeRootRef = ref<HTMLDivElement | null>(null);

const expandedIds = ref<Set<string>>(new Set(props.defaultExpanded));

watch(() => props.defaultExpanded, (newVal) => {
    expandedIds.value = new Set(newVal);
});

function toggleExpand(id: string) {
    const nextSet = new Set(expandedIds.value)
    if (nextSet.has(id)) {
        nextSet.delete(id)
    } else {
        nextSet.add(id)
    }
    expandedIds.value = nextSet
    emit('expand', id, nextSet.has(id))
}

function selectNode(node: TreeNode) {
    emit('update:modelValue', node.id);
    emit('select', node);
}

function getVisibleTreeItems(): HTMLElement[] {
    const root = treeRootRef.value
    if (!root) return []
    return Array.from(root.querySelectorAll<HTMLElement>('[role="treeitem"]'))
}

function focusAdjacent(direction: -1 | 1) {
    const items = getVisibleTreeItems()
    if (items.length === 0) return
    const activeEl = document.activeElement as HTMLElement | null
    const currentIndex = activeEl ? items.indexOf(activeEl.closest('[role="treeitem"]') as HTMLElement) : -1
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
    const items = getVisibleTreeItems()
    if (items.length === 0) return
    const activeEl = document.activeElement as HTMLElement | null
    if (!activeEl) return
    const currentItem = activeEl.closest('[role="treeitem"]') as HTMLElement
    if (!currentItem) return
    const parentGroup = currentItem.parentElement?.closest('[role="treeitem"]') as HTMLElement | null
    if (parentGroup) {
        parentGroup.focus()
    }
}

function handleFocusFirstChild() {
    const items = getVisibleTreeItems()
    if (items.length === 0) return
    const activeEl = document.activeElement as HTMLElement | null
    if (!activeEl) return
    const currentItem = activeEl.closest('[role="treeitem"]') as HTMLElement
    if (!currentItem) return
    const currentIndex = items.indexOf(currentItem)
    if (currentIndex >= 0 && currentIndex < items.length - 1) {
        items[currentIndex + 1].focus()
    }
}

const rootClass = computed(() => cn('flex flex-col gap-0.5', props.class));
</script>

<template>
    <div ref="treeRootRef" :class="rootClass" role="tree" :aria-label="t('treeView.fileTree')">
        <TreeViewNode
            v-for="(node, index) in nodes"
            :key="node.id"
            :node="node"
            :selected-id="modelValue"
            :expanded-ids="expandedIds"
            :depth="0"
            :is-first-root="index === 0 && !modelValue"
            @toggle="toggleExpand"
            @select="selectNode"
            @focus-prev="handleFocusPrev"
            @focus-next="handleFocusNext"
            @focus-parent="handleFocusParent"
            @focus-first-child="handleFocusFirstChild"
        />
    </div>
</template>
