<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, provide, ref } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { MENU_KEY } from './menu-types'
import { cn } from '@/lib/utils'

interface SubMenuProps {
    /** Unique key of the sub-menu */
    index: string
    /** Title label for the sub-menu trigger */
    title?: string
    /** Whether the sub-menu is disabled */
    disabled?: boolean
    /** Custom class list for submenu wrapper */
    class?: string
    /** Custom class list for the trigger header */
    triggerClass?: string
}

const props = withDefaults(defineProps<SubMenuProps>(), {
    title: '',
    disabled: false,
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

const isOpened = computed(() => {
    if (isVertical.value) {
        return context?.openedMenus.value.has(props.index) ?? false
    }
    return isHovered.value || isOpenClick.value
})

// Child index registration system to support active state propagation
interface BrutxSubMenuContext {
    registerChild: (index: string) => void
    unregisterChild: (index: string) => void
}
const parentSubMenu = inject<BrutxSubMenuContext | null>('BrutxSubMenu', null)
const childIndices = ref<Set<string>>(new Set())

function registerChild(idx: string) {
    const next = new Set(childIndices.value)
    next.add(idx)
    childIndices.value = next
    if (parentSubMenu) {
        parentSubMenu.registerChild(idx)
    }
}

function unregisterChild(idx: string) {
    const next = new Set(childIndices.value)
    next.delete(idx)
    childIndices.value = next
    if (parentSubMenu) {
        parentSubMenu.unregisterChild(idx)
    }
}

provide('BrutxSubMenu', {
    registerChild,
    unregisterChild,
})

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

const isChildActive = computed(() => {
    if (!context) return false
    return childIndices.value.has(context.activeIndex.value)
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
        isChildActive.value
            ? 'text-brutal-primary-foreground bg-brutal-primary border-brutal shadow-brutal translate-x-0.5 -translate-y-0.5'
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
    isOpenClick.value = false
}

function handleTriggerClick() {
    if (props.disabled) return
    if (isVertical.value) {
        context?.toggleSubMenu(props.index)
    } else {
        isOpenClick.value = !isOpenClick.value
    }
}

// Fold Transition animation hooks for vertical accordion collapsible list
function onEnter(el: Element) {
    const htmlEl = el as HTMLElement
    htmlEl.style.height = '0'
    htmlEl.style.overflow = 'hidden'
    htmlEl.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    void htmlEl.offsetHeight // force reflow
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
    void htmlEl.offsetHeight // force reflow
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
        :class="subMenuClasses"
        role="none"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
    >
        <!-- SubMenu Header Trigger -->
        <div
            role="menuitem"
            aria-haspopup="true"
            :aria-expanded="isOpened"
            :class="triggerClasses"
            :tabindex="disabled ? -1 : 0"
            @click="handleTriggerClick"
            @keydown.enter="handleTriggerClick"
            @keydown.space="handleTriggerClick"
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
        <ul
            v-else-if="isOpened"
            class="absolute top-full left-0 z-50 mt-1.5 min-w-[200px] border-3 border-brutal bg-brutal-bg p-1.5 shadow-brutal rounded-brutal flex flex-col gap-1 list-none"
        >
            <slot />
        </ul>
    </li>
</template>
