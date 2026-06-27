<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChevronRight, Folder, FolderOpen } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { treeSelectNodeVariants } from './tree-select-variants'
import type { TreeNode } from './tree-select-types'

const INDENT_PER_DEPTH = 20
const BASE_INDENT = 8

interface TreeSelectNodeProps {
    node: TreeNode
    selectedIds: Set<string>
    expandedIds: Set<string>
    depth?: number
    multiple?: boolean
}

const props = withDefaults(defineProps<TreeSelectNodeProps>(), {
    depth: 0,
    multiple: false,
})

const emit = defineEmits<{
    toggle: [id: string]
    select: [node: TreeNode]
}>()

const isLeaf = computed(() => !props.node.children || props.node.children.length === 0)
const isExpanded = computed(() => props.expandedIds.has(props.node.id))
const isSelected = computed(() => props.selectedIds.has(props.node.id))

const itemClass = computed(() =>
    cn(
        treeSelectNodeVariants({ selected: isSelected.value }),
        props.node.disabled && 'opacity-50 cursor-not-allowed'
    )
)

const indentStyle = computed(() => ({
    paddingLeft: `${props.depth * INDENT_PER_DEPTH + BASE_INDENT}px`,
}))

function handleClick() {
    if (props.node.disabled) return
    if (isLeaf.value) {
        emit('select', props.node)
    } else {
        emit('toggle', props.node.id)
    }
}
</script>

<template>
    <div role="treeitem" :aria-expanded="!isLeaf ? isExpanded : undefined">
        <div
            :class="itemClass"
            :style="indentStyle"
            @click="handleClick"
        >
            <ChevronRight
                v-if="!isLeaf"
                class="w-4 h-4 flex-shrink-0 transition-transform duration-150"
                :class="isExpanded && 'rotate-90'"
            />
            <span v-else class="w-4 flex-shrink-0" />

            <FolderOpen v-if="!isLeaf && isExpanded" class="w-4 h-4 flex-shrink-0 text-brutal-primary" />
            <Folder v-else-if="!isLeaf" class="w-4 h-4 flex-shrink-0" />
            <span v-else class="w-4 flex-shrink-0" />

            <span class="truncate flex-1">{{ node.label }}</span>
            <Check
                v-if="isSelected"
                class="h-4 w-4 stroke-[3] flex-shrink-0"
            />
        </div>

        <div v-if="!isLeaf && isExpanded" role="group">
            <TreeSelectNode
                v-for="child in node.children"
                :key="child.id"
                :node="child"
                :selected-ids="selectedIds"
                :expanded-ids="expandedIds"
                :depth="depth + 1"
                :multiple="multiple"
                @toggle="emit('toggle', $event)"
                @select="emit('select', $event)"
            />
        </div>
    </div>
</template>
