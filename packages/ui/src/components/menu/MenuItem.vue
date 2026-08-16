<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { MENU_KEY } from './menu-types'
import { cn, FOCUS_RING_CLASSES } from '@/lib/utils'

interface MenuItemProps {
    /** Unique key of the menu item */
    index: string
    /** Whether the item is disabled */
    disabled?: boolean
    /** Route object or path for router push */
    route?: string | Record<string, unknown>
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
    notifyItemSelected: () => void
    closeAndFocusTrigger?: () => void
}
const parentSubMenu = inject<BrutxSubMenuContext | null>('BrutxSubMenu', null)
const itemRef = ref<HTMLElement | null>(null)

function registerSelf() {
    if (itemRef.value && context) {
        context.registerItem({
            index: props.index,
            el: itemRef.value,
            disabled: props.disabled,
            isSubMenuTrigger: false,
        })
    }
}

onMounted(() => {
    if (parentSubMenu) {
        parentSubMenu.registerChild(props.index)
    }
    registerSelf()
})

watch(() => props.disabled, () => {
    registerSelf()
})

watch(
    () => props.index,
    (newIndex, oldIndex) => {
        if (newIndex === oldIndex) return
        if (parentSubMenu) {
            parentSubMenu.unregisterChild(oldIndex)
            parentSubMenu.registerChild(newIndex)
        }
        if (context) {
            const wasFocused = context.focusedIndex.value === oldIndex
            context.unregisterItem(oldIndex)
            registerSelf()
            if (context.activeIndex.value === oldIndex) {
                context.activeIndex.value = newIndex
            }
            if (wasFocused) {
                context.focusedIndex.value = newIndex
            }
        }
    }
)

onUnmounted(() => {
    if (parentSubMenu) {
        parentSubMenu.unregisterChild(props.index)
    }
    if (context) {
        context.unregisterItem(props.index)
    }
})

const isActive = computed(() => context?.activeIndex.value === props.index)
const isFocused = computed(() => context?.focusedIndex.value === props.index)

const tabIndex = computed(() => {
    if (props.disabled) return -1
    if (context?.focusedIndex.value != null) {
        return isFocused.value ? 0 : -1
    }
    if (context?.activeIndex.value) {
        return isActive.value ? 0 : -1
    }
    return context?.firstEnabledIndex.value === props.index ? 0 : -1
})

const classes = computed(() => {
    return cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-brutal border-3 font-semibold transition-all duration-150 cursor-pointer select-none text-sm outline-none',
        FOCUS_RING_CLASSES,
        props.inset && 'pl-10',
        isActive.value
            ? 'bg-brutal-primary text-brutal-primary-foreground border-brutal shadow-brutal-sm'
            : 'text-brutal-fg border-transparent hover:bg-brutal-muted',
        props.disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
        props.class
    )
})

function handleClick() {
    if (props.disabled) return
    context?.selectItem(props.index, props.route)
    context?.focusItem(props.index)
    parentSubMenu?.notifyItemSelected()
}

function handleKeydown(e: KeyboardEvent) {
    if (props.disabled) return
    const isHorizontal = context?.mode.value === 'horizontal'

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault()
            context?.focusNextItem(props.index)
            break
        case 'ArrowUp':
            e.preventDefault()
            context?.focusPrevItem(props.index)
            break
        case 'ArrowRight':
            e.preventDefault()
            if (isHorizontal) {
                context?.focusNextItem(props.index)
            }
            break
        case 'ArrowLeft':
            e.preventDefault()
            if (isHorizontal) {
                context?.focusPrevItem(props.index)
            } else if (parentSubMenu?.closeAndFocusTrigger) {
                parentSubMenu.closeAndFocusTrigger()
            }
            break
        case 'Home':
            e.preventDefault()
            context?.focusFirstItem()
            break
        case 'End':
            e.preventDefault()
            context?.focusLastItem()
            break
        case 'Enter':
        case ' ':
            e.preventDefault()
            handleClick()
            break
    }
}
</script>

<template>
    <li
        ref="itemRef"
        role="menuitem"
        :class="classes"
        :aria-disabled="disabled"
        :tabindex="tabIndex"
        @click="handleClick"
        @keydown="handleKeydown"
    >
        <slot />
    </li>
</template>
