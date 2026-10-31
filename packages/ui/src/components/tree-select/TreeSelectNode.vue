<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { getDocument } from '@/lib/env'
import { Check, ChevronRight, Folder, FolderOpen } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { treeSelectNodeVariants } from './tree-select-variants'
import { INDENT_PER_DEPTH, BASE_INDENT_TREE_SELECT, treeChevronBaseClass, treeChevronExpandedClass, treeLabelBaseClass } from '@/lib/tree-variants'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import type { TreeNode } from './tree-select-types'

const ICON_SIZE_CLASSES = iconSizeVariants({ size: 'md' })

const contentId = `tree-select-content-${useId()}`

interface TreeSelectNodeProps {
    node: TreeNode
    selectedIds: Set<string>
    expandedIds: Set<string>
    depth?: number
    multiple?: boolean
    focusedId?: string
    highlightedId?: string
    variant?: 'default' | 'primary' | 'secondary'
}

const props = withDefaults(defineProps<TreeSelectNodeProps>(), {
    depth: 0,
    multiple: false,
    focusedId: undefined,
    highlightedId: undefined,
    variant: 'default',
})

const emit = defineEmits<{
    toggle: [id: string]
    select: [node: TreeNode]
    focus: [id: string]
    'pointer-enter': [id: string]
    'pointer-leave': [id: string]
}>()

const isLeaf = computed(() => !props.node.children || props.node.children.length === 0)
const isExpanded = computed(() => props.expandedIds.has(props.node.id))
const isSelected = computed(() => props.selectedIds.has(props.node.id))
const isFocusVisible = ref(false)

const itemClass = computed(() =>
    cn(
        treeSelectNodeVariants({
            variant: props.variant,
        })
    )
)

const indentStyle = computed(() => ({
    paddingLeft: `${props.depth * INDENT_PER_DEPTH + BASE_INDENT_TREE_SELECT}px`,
}))

const chevronClasses = computed(() =>
    cn(ICON_SIZE_CLASSES, treeChevronBaseClass, isExpanded.value && treeChevronExpandedClass)
)
const folderClasses = cn(ICON_SIZE_CLASSES, 'flex-shrink-0')
const checkSlotClasses = computed(() => cn(ICON_SIZE_CLASSES, 'flex-shrink-0'))
const checkClasses = computed(() => cn(ICON_SIZE_CLASSES, 'stroke-[3]'))
const spacerClasses = cn(ICON_SIZE_CLASSES, 'flex-shrink-0')

function handleClick() {
    if (props.node.disabled) return
    if (isLeaf.value) {
        emit('select', props.node)
    } else {
        emit('toggle', props.node.id)
    }
}

function handleFocus(event: FocusEvent) {
    // 禁用节点不进焦点序列（roving tabindex），点击后也不应获得焦点资格
    if (props.node.disabled) return
    isFocusVisible.value = event.target instanceof Element && event.target.matches(':focus-visible')
    emit('focus', props.node.id)
}

function getTreeItems(): HTMLElement[] {
    const doc = getDocument()
    if (!doc) return []
    const tree = doc.activeElement?.closest('[role="tree"]')
    if (!tree) return []
    return Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]'))
}

function getNavigableTreeItems(allItems = getTreeItems()): HTMLElement[] {
    return allItems.filter((item) => item.getAttribute('aria-disabled') !== 'true')
}

function focusAdjacent(direction: -1 | 1) {
    const doc = getDocument()
    if (!doc) return
    const allItems = getTreeItems()
    const navigableItems = new Set(getNavigableTreeItems(allItems))
    const activeEl = doc.activeElement
    const activeItem = activeEl instanceof HTMLElement ? activeEl.closest<HTMLElement>('[role="treeitem"]') : null
    const currentIndex = activeItem ? allItems.indexOf(activeItem) : -1
    for (let index = currentIndex + direction; index >= 0 && index < allItems.length; index += direction) {
        const item = allItems[index]
        if (navigableItems.has(item)) {
            item.focus()
            return
        }
    }
}

function focusParent() {
    const doc = getDocument()
    if (!doc) return
    const activeEl = doc.activeElement as HTMLElement | null
    if (!activeEl) return
    let currentItem = activeEl.closest('[role="treeitem"]')
    if (!(currentItem instanceof HTMLElement)) return
    let parentGroup = currentItem.parentElement?.closest('[role="treeitem"]')
    while (
        parentGroup instanceof HTMLElement &&
        parentGroup.getAttribute('aria-disabled') === 'true'
    ) {
        currentItem = parentGroup
        parentGroup = currentItem.parentElement?.closest('[role="treeitem"]')
    }
    if (parentGroup instanceof HTMLElement) parentGroup.focus()
}

function focusFirstChild() {
    const doc = getDocument()
    if (!doc) return
    const activeEl = doc.activeElement as HTMLElement | null
    if (!activeEl) return
    const currentItem = activeEl.closest('[role="treeitem"]')
    if (!currentItem) return
    const childGroup = currentItem.querySelector('[role="group"]')
    if (childGroup) {
        const firstChild = Array.from(childGroup.children)
            .filter((item): item is HTMLElement => item instanceof HTMLElement && item.getAttribute('role') === 'treeitem')
            .find((item) => item.getAttribute('aria-disabled') !== 'true')
        if (firstChild) firstChild.focus()
    }
}

function handleKeydown(e: KeyboardEvent) {
    const isTreeKey = e.key === 'Enter' ||
        e.key === ' ' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Home' ||
        e.key === 'End'
    if (isTreeKey) e.stopPropagation()
    // 禁用节点仅拦截 Enter/Space 触发类按键，导航类按键（方向键/Home/End）仍可移走焦点
    if (props.node.disabled && (e.key === 'Enter' || e.key === ' ')) return
    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault()
            handleClick()
            break
        case 'ArrowRight':
            e.preventDefault()
            // 禁用节点不可展开/折叠，仅保留导航行为
            if (!props.node.disabled && !isLeaf.value && !isExpanded.value) {
                emit('toggle', props.node.id)
            } else if (!isLeaf.value && isExpanded.value) {
                focusFirstChild()
            }
            break
        case 'ArrowLeft':
            e.preventDefault()
            // 禁用节点不可展开/折叠，仅保留导航行为
            if (!props.node.disabled && !isLeaf.value && isExpanded.value) {
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
            getNavigableTreeItems()[0]?.focus()
            break
        }
        case 'End': {
            e.preventDefault()
            const items = getNavigableTreeItems()
            if (items.length > 0) items[items.length - 1].focus()
            break
        }
    }
}

function handleBlur() {
    isFocusVisible.value = false
}
</script>

<template>
    <div
        role="treeitem"
        class="focus:outline-hidden"
        :tabindex="!node.disabled && focusedId === node.id ? 0 : -1"
        :aria-expanded="!isLeaf ? isExpanded : undefined"
        :aria-controls="!isLeaf && isExpanded ? contentId : undefined"
        :aria-selected="isSelected"
        :aria-disabled="node.disabled ? true : undefined"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
    >
        <div
            :class="itemClass"
            :style="indentStyle"
            :data-highlighted="highlightedId === node.id && !node.disabled ? '' : undefined"
            :data-focus-visible="isFocusVisible ? '' : undefined"
            :data-disabled="node.disabled ? '' : undefined"
            @click="handleClick"
            @pointerenter="emit('pointer-enter', node.id)"
            @pointerleave="emit('pointer-leave', node.id)"
        >
            <ChevronRight
                v-if="!isLeaf"
                :class="chevronClasses"
            />
            <span v-else :class="spacerClasses" />

            <FolderOpen v-if="!isLeaf && isExpanded" :class="folderClasses" />
            <Folder v-else-if="!isLeaf" :class="folderClasses" />
            <span v-else :class="spacerClasses" />

            <span :class="[treeLabelBaseClass, 'min-w-0 flex-1']">{{ node.label }}</span>
            <span :class="checkSlotClasses" aria-hidden="true">
                <Check v-if="isSelected" :class="checkClasses" />
            </span>
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
                :highlighted-id="highlightedId"
                :variant="variant"
                @toggle="emit('toggle', $event)"
                @select="emit('select', $event)"
                @focus="emit('focus', $event)"
                @pointer-enter="emit('pointer-enter', $event)"
                @pointer-leave="emit('pointer-leave', $event)"
            />
        </div>
    </div>
</template>
