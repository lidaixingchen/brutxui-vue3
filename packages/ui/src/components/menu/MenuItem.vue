<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted } from 'vue'
import { MENU_KEY } from './menu-types'
import { cn } from '@/lib/utils'

interface MenuItemProps {
    /** Unique key of the menu item */
    index: string
    /** Whether the item is disabled */
    disabled?: boolean
    /** Route object or path for router push */
    route?: string | object
    /** Whether to indent the item to align with icon-bearing items */
    inset?: boolean
    /** Custom class list */
    class?: string
}

const props = withDefaults(defineProps<MenuItemProps>(), {
    disabled: false,
    route: undefined,
    inset: false,
    class: undefined,
})

const context = inject(MENU_KEY)
if (!context) {
    console.warn('[BrutxUI MenuItem] Must be used inside a Menu component.')
}

interface BrutxSubMenuContext {
    registerChild: (index: string) => void
    unregisterChild: (index: string) => void
}
const parentSubMenu = inject<BrutxSubMenuContext | null>('BrutxSubMenu', null)

onMounted(() => {
    if (parentSubMenu) {
        parentSubMenu.registerChild(props.index)
    }
})

onUnmounted(() => {
    if (parentSubMenu) {
        parentSubMenu.unregisterChild(props.index)
    }
})

const isActive = computed(() => context?.activeIndex.value === props.index)

const classes = computed(() => {
    return cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-brutal border-3 font-semibold transition-all duration-150 cursor-pointer select-none text-sm outline-none',
        props.inset && 'pl-10',
        isActive.value
            ? 'bg-brutal-primary text-brutal-primary-foreground border-brutal shadow-brutal translate-x-0.5 -translate-y-0.5'
            : 'text-brutal-fg border-transparent hover:bg-brutal-muted',
        props.disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
        props.class
    )
})

function handleClick() {
    if (props.disabled) return
    context?.selectItem(props.index, props.route)
}
</script>

<template>
    <li
        role="menuitem"
        :class="classes"
        :aria-disabled="disabled"
        :tabindex="disabled ? -1 : 0"
        @click="handleClick"
        @keydown.enter="handleClick"
        @keydown.space="handleClick"
    >
        <slot />
    </li>
</template>
