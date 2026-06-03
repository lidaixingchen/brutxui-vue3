<script setup lang="ts">
import { computed, ref, inject, type ComponentPublicInstance } from 'vue'
import { cn } from '../../lib/utils'
import { commandItemVariants } from './command-variants'

interface CommandItemProps {
    value: string
    disabled?: boolean
    class?: string
}

const props = defineProps<CommandItemProps>()

const emit = defineEmits<{ select: [value: string] }>()

const isSelected = ref(false)

const classes = computed(() =>
    cn(commandItemVariants(), props.class)
)

function handleMouseEnter() {
    isSelected.value = true
}

function handleMouseLeave() {
    isSelected.value = false
}

function handleClick() {
    if (!props.disabled) {
        emit('select', props.value)
    }
}

const commandListEl = inject<HTMLElement | null>('command-list-el', null)
let itemEl: HTMLElement | null = null

function setItemRef(el: Element | ComponentPublicInstance | null) {
    itemEl = el as HTMLElement | null
}

function focusItem(direction: 'up' | 'down') {
    const container = commandListEl || itemEl?.parentElement
    if (!container) return
    const items = Array.from(container.querySelectorAll<HTMLElement>('[data-slot="command-item"]:not([data-disabled="true"])'))
    const currentIndex = items.indexOf(itemEl!)
    if (currentIndex === -1) return
    const nextIndex = direction === 'down'
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length
    items[nextIndex]?.focus()
    isSelected.value = false
}

function handleItemKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
        e.preventDefault()
        focusItem('down')
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        focusItem('up')
    } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
    }
}
</script>

<template>
    <div
        :ref="setItemRef"
        :class="classes"
        role="option"
        :aria-selected="isSelected"
        :aria-disabled="disabled || undefined"
        data-slot="command-item"
        :data-highlighted="isSelected"
        :data-disabled="disabled"
        tabindex="-1"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @click="handleClick"
        @keydown="handleItemKeydown"
    >
        <slot />
    </div>
</template>
