<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { MENU_KEY } from './menu-types'
import { hasDocument, getDocument } from '@/lib/env'
import { cn, FOCUS_RING_CLASSES } from '@/lib/utils'

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

const context = inject(MENU_KEY)
if (!context) {
    console.warn('[BrutxUI SubMenu] Must be used inside a Menu component.')
}

const isVertical = computed(() => context?.mode.value === 'vertical')

const isHovered = ref(false)
const isOpenClick = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

const isOpened = computed(() => {
    if (isVertical.value) {
        return context?.openedMenus.value.has(props.index) ?? false
    }
    return isHovered.value || isOpenClick.value
})

interface BrutxSubMenuContext {
    registerChild: (index: string) => void
    unregisterChild: (index: string) => void
    notifyItemSelected: () => void
    closeAndFocusTrigger?: () => void
}
const parentSubMenu = inject<BrutxSubMenuContext | null>('BrutxSubMenu', null)
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
    if (!isVertical.value) {
        isOpenClick.value = false
        context?.focusItem(props.index)
    }
    parentSubMenu?.notifyItemSelected()
}

function closeAndFocusTrigger() {
    if (isVertical.value) {
        context?.closeSubMenu(props.index)
    } else {
        isOpenClick.value = false
        context?.focusItem(props.index)
    }
}

provide('BrutxSubMenu', {
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
}

onMounted(() => {
    if (parentSubMenu) {
        parentSubMenu.registerChild(props.index)
    }
    context?.registerSubMenu(props.index, childIndices.value)
    registerTrigger()
    if (hasDocument) {
        getDocument()?.addEventListener('click', handleDocumentClick)
        getDocument()?.addEventListener('keydown', handleDocumentKeydown)
    }
})

watch(() => props.disabled, () => {
    registerTrigger()
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
            context.unregisterSubMenu(oldIndex)
            context.unregisterItem(oldIndex)
            context.registerSubMenu(newIndex, childIndices.value)
            registerTrigger()
        }
    }
)

onUnmounted(() => {
    context?.unregisterSubMenu(props.index)
    context?.unregisterItem(props.index)
    if (parentSubMenu) {
        parentSubMenu.unregisterChild(props.index)
    }
    if (hasDocument) {
        getDocument()?.removeEventListener('click', handleDocumentClick)
        getDocument()?.removeEventListener('keydown', handleDocumentKeydown)
    }
})

const isChildActive = computed(() => {
    if (!context) return false
    return childIndices.value.has(context.activeIndex.value)
})

const isFocused = computed(() => context?.focusedIndex.value === props.index)

const tabIndex = computed(() => {
    if (props.disabled) return -1
    if (context?.focusedIndex.value != null) {
        return isFocused.value ? 0 : -1
    }
    if (context?.activeIndex.value) {
        return isChildActive.value ? 0 : -1
    }
    return context?.firstEnabledIndex.value === props.index ? 0 : -1
})

const subMenuClasses = computed(() => {
    return cn(
        'list-none',
        !isVertical.value && 'relative',
        props.class
    )
})

const triggerClasses = computed(() => {
    return cn(
        'flex items-center justify-between gap-4 px-4 py-2.5 rounded-brutal border-3 font-semibold text-sm cursor-pointer select-none transition-all duration-150 outline-none',
        FOCUS_RING_CLASSES,
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

function handleMouseEnter() {
    if (isVertical.value) return
    isHovered.value = true
}

function handleMouseLeave() {
    if (isVertical.value) return
    isHovered.value = false
}

function handleTriggerClick() {
    if (props.disabled) return
    if (isVertical.value) {
        context?.toggleSubMenu(props.index)
    } else {
        isOpenClick.value = !isOpenClick.value
    }
    context?.focusItem(props.index)
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
            break
    }
}

function handleDocumentClick(event: MouseEvent) {
    if (isVertical.value) return
    if (!isOpenClick.value) return
    const target = event.target
    if (!(target instanceof Node)) return
    if (rootRef.value && !rootRef.value.contains(target)) {
        isOpenClick.value = false
    }
}

function handleDocumentKeydown(event: KeyboardEvent) {
    if (isVertical.value) return
    if (!isOpenClick.value) return
    if (event.key === 'Escape') {
        if (rootRef.value?.querySelector('.absolute [aria-expanded="true"]')) return
        isOpenClick.value = false
        context?.focusItem(props.index)
    }
}

function onEnter(el: Element) {
    const htmlEl = el as HTMLElement
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
            @click="handleTriggerClick"
            @keydown="handleTriggerKeydown"
        >
            <span class="flex items-center gap-2 truncate">
                <slot name="title">{{ title }}</slot>
            </span>
            <ChevronDown
                :class="cn('w-4 h-4 transition-transform duration-200 stroke-3 shrink-0', {
                    'rotate-180': isOpened
                })"
            />
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
        <div v-else-if="isOpened" class="absolute top-full left-0 z-50 pt-1.5">
            <ul class="min-w-[200px] border-3 border-brutal bg-brutal-bg p-1.5 shadow-brutal rounded-brutal flex flex-col gap-1 list-none">
                <slot />
            </ul>
        </div>
    </li>
</template>
