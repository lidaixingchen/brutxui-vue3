<script setup lang="ts">
import { computed, useId } from 'vue'
import { hasDocument } from '../../lib/env'
import { Check, ChevronRight, Folder, FolderOpen } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { treeSelectNodeVariants } from './tree-select-variants'
import { iconSizeVariants } from '../../lib/icon-size-variants'
import type { TreeNode } from './tree-select-types'

const INDENT_PER_DEPTH = 20
const BASE_INDENT = 8
const ICON_SIZE_CLASSES = iconSizeVariants({ size: 'default' })

const contentId = `tree-select-content-${useId()}`

interface TreeSelectNodeProps {
    node: TreeNode
    selectedIds: Set<string>
    expandedIds: Set<string>
    depth?: number
    multiple?: boolean
    focusedId?: string
}

const props = withDefaults(defineProps<TreeSelectNodeProps>(), {
    depth: 0,
    multiple: false,
    focusedId: undefined,
})

const emit = defineEmits<{
    toggle: [id: string]
    select: [node: TreeNode]
    focus: [id: string]
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

const chevronClasses = computed(() =>
    cn(ICON_SIZE_CLASSES, 'flex-shrink-0 transition-transform duration-150', isExpanded.value && 'rotate-90')
)
const folderOpenClasses = cn(ICON_SIZE_CLASSES, 'flex-shrink-0 text-brutal-primary')
const folderClasses = cn(ICON_SIZE_CLASSES, 'flex-shrink-0')
const checkClasses = cn(ICON_SIZE_CLASSES, 'stroke-[3] flex-shrink-0')
const spacerClasses = cn(ICON_SIZE_CLASSES, 'flex-shrink-0')

function handleClick() {
    if (props.node.disabled) return
    if (isLeaf.value) {
        emit('select', props.node)
    } else {
        emit('toggle', props.node.id)
    }
}

function getVisibleTreeItems(): HTMLElement[] {
    if (!hasDocument) return []
    const tree = document.activeElement?.closest('[role="tree"]')
    if (!tree) return []
    return Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]'))
}

function focusAdjacent(direction: -1 | 1) {
    if (!hasDocument) return
    const items = getVisibleTreeItems()
    if (items.length === 0) return
    const activeEl = document.activeElement as HTMLElement | null
    const currentIndex = activeEl ? items.indexOf(activeEl) : -1
    const nextIndex = currentIndex + direction
    if (nextIndex >= 0 && nextIndex < items.length) {
        items[nextIndex].focus()
    }
}

function focusParent() {
    if (!hasDocument) return
    const activeEl = document.activeElement as HTMLElement | null
    if (!activeEl) return
    const currentItem = activeEl.closest('[role="treeitem"]')
    if (!currentItem) return
    const parentGroup = currentItem.parentElement?.closest('[role="treeitem"]')
    if (parentGroup) (parentGroup as HTMLElement).focus()
}

function focusFirstChild() {
    if (!hasDocument) return
    const activeEl = document.activeElement as HTMLElement | null
    if (!activeEl) return
    const currentItem = activeEl.closest('[role="treeitem"]')
    if (!currentItem) return
    const childGroup = currentItem.querySelector('[role="group"]')
    if (childGroup) {
        const firstChild = childGroup.querySelector('[role="treeitem"]') as HTMLElement | null
        firstChild?.focus()
    }
}

function handleKeydown(e: KeyboardEvent) {
    if (props.node.disabled) return
    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault()
            handleClick()
            break
        case 'ArrowRight':
            e.preventDefault()
            if (!isLeaf.value && !isExpanded.value) {
                emit('toggle', props.node.id)
            } else if (!isLeaf.value && isExpanded.value) {
                focusFirstChild()
            }
            break
        case 'ArrowLeft':
            e.preventDefault()
            if (!isLeaf.value && isExpanded.value) {
                emit('toggle', props.node.id)
            } else {
                focusParent()
            }
            break
        case 'ArrowDown':
            e.preventDefault()
            focusAdjacent(1)
            break
        case 'ArrowUp':
            e.preventDefault()
            focusAdjacent(-1)
            break
        case 'Home': {
            e.preventDefault()
            const items = getVisibleTreeItems()
            if (items.length > 0) items[0].focus()
            break
        }
        case 'End': {
            e.preventDefault()
            const items = getVisibleTreeItems()
            if (items.length > 0) items[items.length - 1].focus()
            break
        }
    }
}
</script>

<template>
    <div
        role="treeitem"
        :tabindex="focusedId === node.id ? 0 : -1"
        :aria-expanded="!isLeaf ? isExpanded : undefined"
        :aria-controls="!isLeaf ? contentId : undefined"
        :aria-selected="isSelected"
        @focus="emit('focus', node.id)"
        @keydown="handleKeydown"
    >
        <div
            :class="itemClass"
            :style="indentStyle"
            @click="handleClick"
        >
            <ChevronRight
                v-if="!isLeaf"
                :class="chevronClasses"
            />
            <span v-else :class="spacerClasses" />

            <FolderOpen v-if="!isLeaf && isExpanded" :class="folderOpenClasses" />
            <Folder v-else-if="!isLeaf" :class="folderClasses" />
            <span v-else :class="spacerClasses" />

            <span class="truncate flex-1">{{ node.label }}</span>
            <Check
                v-if="isSelected"
                :class="checkClasses"
            />
        </div>

        <div v-if="!isLeaf && isExpanded" :id="contentId" role="group">
            <TreeSelectNode
                v-for="child in node.children"
                :key="child.id"
                :node="child"
                :selected-ids="selectedIds"
                :expanded-ids="expandedIds"
                :depth="depth + 1"
                :multiple="multiple"
                :focused-id="focusedId"
                @toggle="emit('toggle', $event)"
                @select="emit('select', $event)"
                @focus="emit('focus', $event)"
            />
        </div>
    </div>
</template>
