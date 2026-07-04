<script setup lang="ts">
import { computed, ref, nextTick, useId, inject } from 'vue';
import { ChevronRight, File, Folder, FolderOpen, Loader2, RotateCw } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { treeItemVariants } from './tree-view-variants';
import { getCheckState } from './tree-view-utils';
import { INDENT_PER_DEPTH, BASE_INDENT_TREE_VIEW, treeChevronBaseClass, treeChevronExpandedClass, treeLabelBaseClass } from '@/lib/tree-variants';
import Checkbox from '../checkbox/Checkbox.vue';
import type { TreeNode, SelectionMode, CheckState, TreeViewContext } from './TreeView.vue';

const context = inject<TreeViewContext | null>('TreeViewContext', null);


const contentId = `tree-content-${useId()}`

interface TreeViewNodeProps {
    node: TreeNode;
    selectedId?: string | null;
    expandedIds: Set<string>;
    depth?: number;
    isFirstRoot?: boolean;
    selectionMode?: SelectionMode;
    checkedIds?: Set<string>;
    disabled?: boolean;
}

const props = withDefaults(defineProps<TreeViewNodeProps>(), {
    selectedId: null,
    depth: 0,
    isFirstRoot: false,
    selectionMode: 'single',
    checkedIds: () => new Set(),
    disabled: false,
});

const emit = defineEmits<{
    'toggle': [id: string];
    'select': [node: TreeNode];
    'check': [node: TreeNode];
    'focus-prev': [];
    'focus-next': [];
    'focus-parent': [];
    'focus-first-child': [];
    'focus-first': [];
    'focus-last': [];
}>();

const treeItemRef = ref<HTMLDivElement | null>(null);

const isLeaf = computed(() => {
    if (props.node.isLeaf !== undefined) return props.node.isLeaf;
    if (context?.lazy?.value) {
        if (props.node.loaded) {
            return !props.node.children || props.node.children.length === 0;
        }
        return false;
    }
    return !props.node.children || props.node.children.length === 0;
});
const isExpanded = computed(() => props.expandedIds.has(props.node.id));
const isSelected = computed(() => props.selectedId === props.node.id);
const isCheckboxMode = computed(() => props.selectionMode === 'checkbox');

const isLoading = computed(() => {
    return props.node.loading || (context?.loadingKeys.value.has(props.node.id) ?? false);
});
const isFailed = computed(() => {
    return context?.failedKeys.value.has(props.node.id) ?? false;
});
const showRetry = computed(() => {
    return isFailed.value && (context?.retryOnError.value ?? false);
});

const isDragOver = computed(() => {
    return context?.dragOverNode.value?.id === props.node.id;
});
const dragOverType = computed(() => {
    return isDragOver.value ? context?.dropType.value : null;
});

const dragClasses = computed(() => {
    if (!isDragOver.value || !dragOverType.value) return '';
    if (dragOverType.value === 'before') {
        return 'border-t-4 border-dashed border-black dark:border-white';
    }
    if (dragOverType.value === 'after') {
        return 'border-b-4 border-dashed border-black dark:border-white';
    }
    if (dragOverType.value === 'inner') {
        return 'border-2 border-solid border-black dark:border-white bg-black/5 dark:bg-white/5';
    }
    return '';
});

function handleDragStart(e: DragEvent) {
    if (props.disabled) return;
    context?.onNodeDragStart(e, props.node);
}

function handleDragOver(e: DragEvent) {
    if (props.disabled) return;
    const rect = e.currentTarget instanceof HTMLElement 
        ? e.currentTarget.getBoundingClientRect() 
        : null;
    if (rect) {
        context?.onNodeDragOver(e, props.node, rect, e.clientY);
    }
}

function handleDragEnter(e: DragEvent) {
    if (props.disabled) return;
    context?.onNodeDragEnter(e, props.node);
}

function handleDragLeave(e: DragEvent) {
    if (props.disabled) return;
    context?.onNodeDragLeave(e, props.node);
}

function handleDragEnd(e: DragEvent) {
    if (props.disabled) return;
    context?.onNodeDragEnd(e, props.node);
}

function handleDrop(e: DragEvent) {
    if (props.disabled) return;
    context?.onNodeDrop(e, props.node);
}

function handleRetry() {
    context?.triggerLoad(props.node);
}

const checkState = computed<CheckState>(() => {
    if (!isCheckboxMode.value) return 'unchecked'
    return getCheckState(props.node, props.checkedIds)
})

const isChecked = computed(() => checkState.value === 'checked');
const isIndeterminate = computed(() => checkState.value === 'indeterminate');

const ariaChecked = computed(() => {
    if (!isCheckboxMode.value) return undefined
    if (isIndeterminate.value) return 'mixed'
    return isChecked.value ? 'true' : 'false'
})

const itemClass = computed(() =>
    cn(treeItemVariants({ selected: isSelected.value }))
);

const chevronClass = computed(() =>
    cn('w-4 h-4', treeChevronBaseClass, isExpanded.value && treeChevronExpandedClass)
)

const indentStyle = computed(() => ({
    paddingLeft: `${props.depth * INDENT_PER_DEPTH + BASE_INDENT_TREE_VIEW}px`,
}));

function handleCheckboxUpdate() {
    if (!props.disabled) emit('check', props.node)
}

const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
        case ' ':
            e.preventDefault();
            if (isCheckboxMode.value) {
                if (!props.disabled) emit('check', props.node)
            } else if (isLeaf.value) {
                emit('select', props.node);
            } else {
                emit('toggle', props.node.id);
                emit('select', props.node);
            }
            break;
        case 'Enter':
            e.preventDefault();
            if (isCheckboxMode.value) {
                if (!props.disabled) emit('check', props.node)
            } else if (isLeaf.value) {
                emit('select', props.node);
            } else {
                emit('toggle', props.node.id);
                emit('select', props.node);
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (!isLeaf.value && !isExpanded.value) {
                emit('toggle', props.node.id);
                emit('select', props.node);
            } else if (!isLeaf.value && isExpanded.value) {
                emit('focus-first-child');
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (!isLeaf.value && isExpanded.value) {
                emit('toggle', props.node.id);
                emit('select', props.node);
            } else {
                emit('focus-parent');
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            emit('focus-prev');
            break;
        case 'ArrowDown':
            e.preventDefault();
            emit('focus-next');
            break;
        case 'Home':
            e.preventDefault();
            emit('focus-first');
            break;
        case 'End':
            e.preventDefault();
            emit('focus-last');
            break;
    }
};

const handleClick = () => {
    if (props.disabled) return
    if (isLeaf.value) {
        emit('select', props.node);
    } else {
        emit('toggle', props.node.id);
        emit('select', props.node);
    }
}

const focus = () => {
    nextTick(() => {
        treeItemRef.value?.focus();
    });
};

defineExpose({ focus, nodeId: props.node.id });
</script>

<template>
    <div
        v-show="!node.hidden"
        ref="treeItemRef"
        role="treeitem"
        :tabindex="isSelected ? 0 : (isFirstRoot ? 0 : -1)"
        :aria-expanded="!isLeaf ? isExpanded : undefined"
        :aria-controls="!isLeaf ? contentId : undefined"
        :aria-selected="isSelected"
        :aria-checked="ariaChecked"
        :aria-disabled="disabled || undefined"
        @keydown="handleKeydown"
    >
        <div
            :class="[itemClass, dragClasses]"
            :style="indentStyle"
            :draggable="context?.draggable.value && !disabled"
            @click="handleClick"
            @dragstart="handleDragStart"
            @dragover="handleDragOver"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @dragend="handleDragEnd"
            @drop="handleDrop"
        >
            <ChevronRight
                v-if="!isLeaf"
                :class="chevronClass"
            />
            <span v-else class="w-4 flex-shrink-0" />

            <Checkbox
                v-if="isCheckboxMode"
                :checked="isChecked ? true : (isIndeterminate ? 'indeterminate' : false)"
                :disabled="disabled"
                size="sm"
                class="flex-shrink-0"
                @click.stop
                @update:checked="handleCheckboxUpdate"
            />

            <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin flex-shrink-0 text-brutal-primary" />
            <template v-else>
                <FolderOpen v-if="!isLeaf && isExpanded" class="w-4 h-4 flex-shrink-0 text-brutal-primary" />
                <Folder v-else-if="!isLeaf" class="w-4 h-4 flex-shrink-0" />
                <File v-else class="w-4 h-4 flex-shrink-0 opacity-60" />
            </template>

            <span :class="treeLabelBaseClass">{{ node.label }}</span>

            <button
                v-if="showRetry"
                type="button"
                class="ml-2 p-1 border-2 border-black dark:border-white bg-brutal-primary text-black hover:bg-brutal-primary/80 transition-colors flex items-center justify-center rounded-none cursor-pointer"
                title="Retry Loading"
                @click.stop="handleRetry"
            >
                <RotateCw class="w-3 h-3" />
            </button>
        </div>

        <Transition name="tree-expand">
            <div v-if="!isLeaf && isExpanded" :id="contentId" role="group">
                <TreeViewNode
                    v-for="child in node.children"
                    :key="child.id"
                    :node="child"
                    :selected-id="selectedId"
                    :expanded-ids="expandedIds"
                    :depth="depth + 1"
                    :selection-mode="selectionMode"
                    :checked-ids="checkedIds"
                    :disabled="child.disabled ?? false"
                    @toggle="emit('toggle', $event)"
                    @select="emit('select', $event)"
                    @check="emit('check', $event)"
                    @focus-prev="emit('focus-prev')"
                    @focus-next="emit('focus-next')"
                    @focus-parent="emit('focus-parent')"
                    @focus-first-child="emit('focus-first-child')"
                    @focus-first="emit('focus-first')"
                    @focus-last="emit('focus-last')"
                />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.tree-expand-enter-active,
.tree-expand-leave-active {
    transition: opacity 0.15s ease, grid-template-rows 0.2s ease;
    overflow: hidden;
    display: grid;
    grid-template-rows: 1fr;
}
.tree-expand-enter-from,
.tree-expand-leave-to {
    opacity: 0;
    grid-template-rows: 0fr;
}
</style>
