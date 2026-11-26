<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { MENU_KEY, SUB_MENU_KEY, SUB_MENU_HOVER_DELAY_MS, type MenuRuntimeContext } from './menu-types'
import { matchMedia } from '@/lib/env'
import { cn, FOCUS_RING_CLASSES } from '@/lib/utils'
import { subMenuLayoutVariants, subMenuTitleVariants, subMenuTriggerLayoutVariants } from './menu-variants'

interface SubMenuProps {
    /** Unique key of the sub-menu */
    index: string
    /** Title label for the sub-menu trigger */
    title?: string
    /** Whether the sub-menu is disabled */
    disabled?: boolean
    /** Whether to indent the item to align with icon-bearing items */
    inset?: boolean
    /** Custom class list for submenu wrapper */
    class?: string
    /** Custom class list for the trigger header */
    triggerClass?: string
}

const props = withDefaults(defineProps<SubMenuProps>(), {
    title: '',
    disabled: false,
    inset: false,
    class: undefined,
    triggerClass: undefined,
})

const context = inject(MENU_KEY) as MenuRuntimeContext | undefined
if (!context) {
    console.warn('[BrutxUI SubMenu] Must be used inside a Menu component.')
}

const isVertical = computed(() => context?.mode.value === 'vertical')

const isHovered = ref(false)
const isOpenClick = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const hoverTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const isOpened = computed(() => {
    if (isVertical.value) {
        return context?.openedMenus.value.has(props.index) ?? false
    }
    return isHovered.value || isOpenClick.value
})

const parentSubMenu = inject(SUB_MENU_KEY, null)
const childIndices = ref<Set<string>>(new Set())

function registerChild(idx: string) {
    const next = new Set(childIndices.value)
    next.add(idx)
    childIndices.value = next
    context?.registerSubMenu(props.index, childIndices.value)
    if (parentSubMenu) {
        parentSubMenu.registerChild(idx)
    }
}

function unregisterChild(idx: string) {
    const next = new Set(childIndices.value)
    next.delete(idx)
    childIndices.value = next
    context?.registerSubMenu(props.index, childIndices.value)
    if (parentSubMenu) {
        parentSubMenu.unregisterChild(idx)
    }
}

function notifyItemSelected() {
    if (!isVertical.value) resetHorizontalState()
    parentSubMenu?.notifyItemSelected()
}

function closeAndFocusTrigger() {
    context?.closeSubMenu(props.index)
}

provide(SUB_MENU_KEY, {
    registerChild,
    unregisterChild,
    notifyItemSelected,
    closeAndFocusTrigger,
})

function registerTrigger() {
    if (triggerRef.value && context) {
        context.registerItem({
            index: props.index,
            el: triggerRef.value,
            disabled: props.disabled,
            isSubMenuTrigger: true,
        })
    }
    if (rootRef.value && context) {
        context.registerSubMenuBranch(props.index, {
            root: rootRef.value,
            dismiss: resetHorizontalState,
            cancelPendingOpen,
        })
    }
}

function clearHoverTimer(): void {
    if (hoverTimer.value !== null) {
        clearTimeout(hoverTimer.value)
        hoverTimer.value = null
    }
}

function resetHorizontalState(): void {
    clearHoverTimer()
    isHovered.value = false
    isOpenClick.value = false
}

function cancelPendingOpen(): void {
    if (!isHovered.value) clearHoverTimer()
}

function scheduleHoverState(nextState: boolean): void {
    clearHoverTimer()
    hoverTimer.value = setTimeout(() => {
        isHovered.value = nextState
        hoverTimer.value = null
    }, SUB_MENU_HOVER_DELAY_MS)
}

onMounted(() => {
    if (parentSubMenu) {
        parentSubMenu.registerChild(props.index)
    }
    context?.registerSubMenu(props.index, childIndices.value)
    registerTrigger()
})

watch(() => props.disabled, () => {
    registerTrigger()
    if (props.disabled) {
        resetHorizontalState()
    }
})

// Keep the focused child in the DOM until Menu can return focus.
watch(isOpened, (val) => {
    if (isVertical.value) return
    context?.setHorizontalSubMenuOpen(props.index, val)
}, { flush: 'sync' })

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
            context.unregisterSubMenu(oldIndex)
            context.unregisterItem(oldIndex, false)
            context.registerSubMenu(newIndex, childIndices.value)
            registerTrigger()
            if (context.openedMenus.value.has(oldIndex)) {
                const opened = new Set(context.openedMenus.value)
                opened.delete(oldIndex)
                opened.add(newIndex)
                context.openedMenus.value = opened
            }
            if (context.activeIndex.value === oldIndex) {
                context.activeIndex.value = newIndex
            }
            if (wasFocused) {
                context.focusedIndex.value = newIndex
            }
        }
    }
)

onBeforeUnmount(() => {
    if (context?.openedMenus.value.has(props.index)) {
        const opened = new Set(context.openedMenus.value)
        opened.delete(props.index)
        context.openedMenus.value = opened
    }
    context?.unregisterItem(props.index)
})

onUnmounted(() => {
    clearHoverTimer()
    context?.unregisterSubMenu(props.index)
    if (parentSubMenu) {
        parentSubMenu.unregisterChild(props.index)
    }
})

const isChildActive = computed(() => {
    if (!context) return false
    return childIndices.value.has(context.activeIndex.value)
})

const tabIndex = computed(() => {
    if (props.disabled) return -1
    if (context?.tabStopIndex) return context.tabStopIndex.value === props.index ? 0 : -1
    if (context?.focusedIndex.value != null) {
        return context.focusedIndex.value === props.index ? 0 : -1
    }
    if (context?.activeIndex.value) return isChildActive.value ? 0 : -1
    return context?.firstEnabledIndex.value === props.index ? 0 : -1
})

const titleClasses = computed(() => cn(subMenuTitleVariants({ vertical: isVertical.value })))

const subMenuClasses = computed(() => {
    return cn(
        subMenuLayoutVariants({ vertical: isVertical.value }),
        props.class
    )
})

const triggerClasses = computed(() => {
    return cn(
        'flex items-center justify-between gap-4 px-4 py-2.5 rounded-brutal border-3 font-semibold text-sm cursor-pointer select-none transition-all duration-150 motion-reduce:transition-none',
        FOCUS_RING_CLASSES,
        subMenuTriggerLayoutVariants({ vertical: isVertical.value }),
        props.inset && 'pl-10',
        isChildActive.value
            ? 'text-brutal-primary-foreground bg-brutal-primary border-brutal shadow-brutal-sm'
            : isOpened.value && isVertical.value
                ? 'bg-brutal-muted border-transparent text-brutal-fg'
                : 'border-transparent text-brutal-fg hover:bg-brutal-muted',
        props.disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
        props.triggerClass
    )
})

const arrowClasses = computed(() =>
    cn('w-4 h-4 transition-transform duration-200 motion-reduce:transition-none stroke-3 shrink-0', {
        'rotate-180': isOpened.value,
    }),
)

function handleMouseEnter() {
    if (isVertical.value || props.disabled) return
    if (isHovered.value) {
        clearHoverTimer()
        return
    }
    scheduleHoverState(true)
}

function handleMouseLeave() {
    if (isVertical.value) return
    if (!isHovered.value) {
        clearHoverTimer()
        return
    }
    scheduleHoverState(false)
}

function handleTriggerClick() {
    if (props.disabled) return
    context?.focusItem(props.index)
    if (isVertical.value) {
        context?.toggleSubMenu(props.index)
    } else {
        isOpenClick.value = !isOpenClick.value
    }
}

function handleTriggerFocus() {
    if (!props.disabled && context) {
        context.focusedIndex.value = props.index
    }
}

function handleTriggerKeydown(e: KeyboardEvent) {
    if (props.disabled) return
    const isHorizontal = !isVertical.value

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault()
            if (isHorizontal) {
                isOpenClick.value = true
                context?.openSubMenu(props.index)
            } else {
                context?.focusNextItem(props.index)
            }
            break
        case 'ArrowUp':
            e.preventDefault()
            context?.focusPrevItem(props.index)
            break
        case 'ArrowRight':
            e.preventDefault()
            if (isHorizontal) {
                context?.focusNextItem(props.index)
            } else {
                context?.openSubMenu(props.index)
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
            handleTriggerClick()
            if (isHorizontal && isOpenClick.value) context?.openSubMenu(props.index)
            break
    }
}

function prefersReducedMotion(): boolean {
    return matchMedia('(prefers-reduced-motion: reduce)')?.matches ?? false
}

function onEnter(el: Element) {
    const htmlEl = el as HTMLElement
    if (prefersReducedMotion()) {
        htmlEl.style.height = ''
        htmlEl.style.overflow = ''
        return
    }
    htmlEl.style.height = '0'
    htmlEl.style.overflow = 'hidden'
    htmlEl.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    void htmlEl.offsetHeight
    htmlEl.style.height = `${htmlEl.scrollHeight}px`
}

function onAfterEnter(el: Element) {
    const htmlEl = el as HTMLElement
    htmlEl.style.height = ''
    htmlEl.style.overflow = ''
    htmlEl.style.transition = ''
}

function onLeave(el: Element) {
    const htmlEl = el as HTMLElement
    if (prefersReducedMotion()) {
        htmlEl.style.height = '0'
        htmlEl.style.overflow = 'hidden'
        return
    }
    htmlEl.style.height = `${htmlEl.scrollHeight}px`
    htmlEl.style.overflow = 'hidden'
    htmlEl.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    void htmlEl.offsetHeight
    htmlEl.style.height = '0'
}

function onAfterLeave(el: Element) {
    const htmlEl = el as HTMLElement
    htmlEl.style.height = ''
    htmlEl.style.overflow = ''
    htmlEl.style.transition = ''
}
</script>

<template>
    <li
        ref="rootRef"
        :class="subMenuClasses"
        role="none"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
    >
        <!-- SubMenu Header Trigger -->
        <div
            ref="triggerRef"
            role="menuitem"
            aria-haspopup="true"
            :aria-expanded="isOpened"
            :aria-disabled="disabled"
            :class="triggerClasses"
            :tabindex="tabIndex"
            @focus="handleTriggerFocus"
            @click="handleTriggerClick"
            @keydown="handleTriggerKeydown"
        >
            <span :class="titleClasses">
                <slot name="title">{{ title }}</slot>
            </span>
            <ChevronDown :class="arrowClasses" />
        </div>

        <!-- Vertical collapsible content list -->
        <Transition
            v-if="isVertical"
            name="menu-collapse"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
            @after-leave="onAfterLeave"
        >
            <ul v-show="isOpened" class="flex flex-col gap-1.5 pl-4 mt-1.5 list-none">
                <slot />
            </ul>
        </Transition>

        <!-- Horizontal absolute dropdown overlays -->
        <Transition
            v-else
            enter-active-class="transition-all duration-150 ease-out motion-reduce:transition-none"
            enter-from-class="opacity-0 scale-95 -translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-100 ease-in motion-reduce:transition-none pointer-events-none"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
            <div v-if="isOpened" class="absolute top-full left-0 z-dropdown pt-1.5">
                <ul
                    role="menu"
                    aria-orientation="vertical"
                    class="min-w-[200px] border-3 border-brutal bg-brutal-bg p-1.5 shadow-brutal rounded-brutal flex flex-col gap-1 list-none"
                >
                    <slot />
                </ul>
            </div>
        </Transition>
    </li>
</template>
