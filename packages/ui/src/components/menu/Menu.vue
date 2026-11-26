<script setup lang="ts">
import { computed, provide, ref, watch, getCurrentInstance, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { MENU_KEY, SUB_MENU_KEY, type MenuItemEntry, type MenuRuntimeContext, type SubMenuBranch } from './menu-types'
import { cn } from '@/lib/utils'
import { menuLayoutVariants } from './menu-variants'

interface MenuProps {
    /** Layout mode: horizontal or vertical */
    mode?: 'horizontal' | 'vertical'
    /** Unique key of the default active menu item */
    defaultActive?: string
    /** Whether to enable vue-router pushing */
    router?: boolean
    /** Custom class list */
    class?: string
}

const props = withDefaults(defineProps<MenuProps>(), {
    mode: 'vertical',
    defaultActive: '',
    router: false,
    class: undefined,
})

const emit = defineEmits<{
    select: [index: string]
}>()

const activeIndex = ref(props.defaultActive)
const focusedIndex = ref<string | null>(null)
const openedMenus = ref<Set<string>>(new Set())
const instance = getCurrentInstance()
const rootRef = ref<HTMLElement | null>(null)

const registeredItems = ref<MenuItemEntry[]>([])
const subMenuChildren = new Map<string, ReadonlySet<string>>()
const childToParent = new Map<string, Set<string>>()
const subMenuBranches = new Map<string, SubMenuBranch>()

function registerItem(entry: MenuItemEntry) {
    const previous = registeredItems.value.find((item) => item.index === entry.index)
    const hadFocus = previous ? isElementFocused(previous.el) : false
    const list = registeredItems.value.filter((i) => i.index !== entry.index)
    list.push(entry)
    registeredItems.value = list

    if (entry.disabled && (focusedIndex.value === entry.index || hadFocus)) {
        const next = getNearestAvailableItem(previous?.el ?? entry.el)
        focusedIndex.value = next?.index ?? null
        if (hadFocus && next) focusItem(next.index)
    }
}

function unregisterItem(index: string, restoreFocus = true) {
    const previous = registeredItems.value.find((item) => item.index === index)
    const hadFocus = previous ? isElementFocused(previous.el) : false
    registeredItems.value = registeredItems.value.filter((i) => i.index !== index)

    if (restoreFocus && (focusedIndex.value === index || hadFocus)) {
        const next = getNearestAvailableItem(previous?.el)
        focusedIndex.value = next?.index ?? null
        if (hadFocus && next) focusItem(next.index)
    }
}

function isElementFocused(element: HTMLElement): boolean {
    const activeElement = element.ownerDocument.activeElement
    return activeElement === element || (activeElement !== null && element.contains(activeElement))
}

function isItemVisible(index: string): boolean {
    const parents = childToParent.get(index)
    if (!parents || parents.size === 0) return true
    for (const parent of parents) {
        if (!openedMenus.value.has(parent)) return false
    }
    return true
}

function getAvailableItems(): MenuItemEntry[] {
    const visible = registeredItems.value.filter((item) => !item.disabled && isItemVisible(item.index))
    visible.sort((a, b) => {
        if (a.el === b.el) return 0
        const pos = a.el.compareDocumentPosition(b.el)
        return (pos & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1
    })
    return visible
}

function getNearestAvailableItem(anchor?: HTMLElement): MenuItemEntry | undefined {
    const available = getAvailableItems()
    if (!anchor) return available[0]

    const next = available.find((item) =>
        (anchor.compareDocumentPosition(item.el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    )
    return next ?? available[available.length - 1]
}

const firstEnabledIndex = computed(() => getAvailableItems()[0]?.index ?? null)

const tabStopIndex = computed(() => {
    const available = getAvailableItems()
    if (focusedIndex.value !== null && available.some((item) => item.index === focusedIndex.value)) {
        return focusedIndex.value
    }
    if (available.some((item) => item.index === activeIndex.value)) {
        return activeIndex.value
    }
    return available[0]?.index ?? null
})

function focusItem(index: string) {
    focusedIndex.value = index
    const target = registeredItems.value.find((i) => i.index === index)
    if (target && target.el) {
        target.el.focus()
        target.el.scrollIntoView?.({ block: 'nearest' })
    }
}

function focusNextItem(current: string) {
    const available = getAvailableItems()
    if (available.length === 0) return
    const currentIndex = available.findIndex((i) => i.index === current)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % available.length
    focusItem(available[nextIndex].index)
}

function focusPrevItem(current: string) {
    const available = getAvailableItems()
    if (available.length === 0) return
    const currentIndex = available.findIndex((i) => i.index === current)
    const prevIndex = currentIndex === -1 ? available.length - 1 : (currentIndex - 1 + available.length) % available.length
    focusItem(available[prevIndex].index)
}

function focusFirstItem() {
    const available = getAvailableItems()
    if (available.length > 0) {
        focusItem(available[0].index)
    }
}

function focusLastItem() {
    const available = getAvailableItems()
    if (available.length > 0) {
        focusItem(available[available.length - 1].index)
    }
}

function setSubMenuOpen(index: string, open: boolean) {
    if (openedMenus.value.has(index) === open) return
    const next = new Set(openedMenus.value)
    if (open) next.add(index)
    else next.delete(index)
    openedMenus.value = next
}

function openSubMenu(index: string) {
    setSubMenuOpen(index, true)
    const trigger = registeredItems.value.find((item) => item.index === index)?.el
    nextTick(() => {
        if (!trigger || !isElementFocused(trigger) || !openedMenus.value.has(index)) return
        const children = subMenuChildren.get(index)
        const firstChild = getAvailableItems().find((item) => children?.has(item.index))
        if (firstChild) focusItem(firstChild.index)
    })
}

function closeSubMenu(index: string) {
    setSubMenuOpen(index, false)
    focusItem(index)
}

function registerSubMenuBranch(index: string, branch: SubMenuBranch) {
    subMenuBranches.set(index, branch)
}

function setHorizontalSubMenuOpen(index: string, open: boolean) {
    const wasOpen = openedMenus.value.has(index)
    setSubMenuOpen(index, open)
    if (open || !wasOpen) return

    const branch = subMenuBranches.get(index)
    const trigger = registeredItems.value.find((item) => item.index === index)
    if (!branch || !trigger || !isElementFocused(branch.root) || isElementFocused(trigger.el)) return

    const destination = trigger.disabled ? getNearestAvailableItem(trigger.el) : trigger
    if (destination) focusItem(destination.index)
}

function getMenuOwner(target: EventTarget | null): Element | null {
    return target instanceof Element ? target.closest('[role="menubar"]') : null
}

function handleEscape() {
    const root = rootRef.value
    if (!root || props.mode !== 'horizontal') return false

    const activeElement = root.ownerDocument.activeElement
    let focusedBranch: SubMenuBranch | undefined
    if (getMenuOwner(activeElement) === root) {
        for (const [index, branch] of subMenuBranches) {
            if (
                openedMenus.value.has(index) && branch.root.contains(activeElement) &&
                (!focusedBranch || focusedBranch.root.contains(branch.root))
            ) {
                focusedBranch = branch
            }
        }
    }

    for (const branch of subMenuBranches.values()) {
        if (!focusedBranch || focusedBranch.root.contains(branch.root)) branch.dismiss()
        else branch.cancelPendingOpen()
    }
    return Boolean(focusedBranch)
}

function handleMenuKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented || getMenuOwner(event.target) !== rootRef.value) return
    if (handleEscape()) {
        event.preventDefault()
        event.stopPropagation()
    }
}

function handleDocumentKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented || getMenuOwner(event.target)) return
    const focusedMenu = getMenuOwner(rootRef.value?.ownerDocument.activeElement ?? null)
    if (!focusedMenu || focusedMenu === rootRef.value) handleEscape()
}

function handleDocumentClick(event: MouseEvent) {
    if (props.mode !== 'horizontal' || !(event.target instanceof Node)) return
    for (const branch of subMenuBranches.values()) {
        if (!branch.root.contains(event.target)) branch.dismiss()
    }
}

function registerSubMenu(index: string, children: ReadonlySet<string>) {
    const previousChildren = subMenuChildren.get(index)
    if (previousChildren) {
        for (const child of previousChildren) {
            if (!children.has(child)) unregisterSubMenuChild(index, child)
        }
    }
    subMenuChildren.set(index, children)
    for (const child of children) {
        const parents = childToParent.get(child)
        if (parents) parents.add(index)
        else childToParent.set(child, new Set([index]))
    }
    if (activeIndex.value) expandActiveSubMenuChain(activeIndex.value)
}

function unregisterSubMenuChild(parent: string, child: string) {
    const parents = childToParent.get(child)
    if (!parents) return
    parents.delete(parent)
    if (parents.size === 0) childToParent.delete(child)
}

function unregisterSubMenu(index: string) {
    const children = subMenuChildren.get(index)
    if (children) {
        for (const child of children) unregisterSubMenuChild(index, child)
    }
    subMenuChildren.delete(index)
    subMenuBranches.delete(index)
}

function expandActiveSubMenuChain(target: string) {
    if (props.mode !== 'vertical') return
    const toOpen = new Set(openedMenus.value)
    let changed = false
    const stack = [target]
    while (stack.length > 0) {
        const current = stack.pop()!
        const parents = childToParent.get(current)
        if (!parents) continue
        for (const parent of parents) {
            if (!toOpen.has(parent)) {
                toOpen.add(parent)
                stack.push(parent)
                changed = true
            }
        }
    }
    if (changed) openedMenus.value = toOpen
}

watch(() => props.defaultActive, (val) => {
    activeIndex.value = val
    if (val) expandActiveSubMenuChain(val)
})

function selectItem(index: string, route?: string | Record<string, unknown>) {
    activeIndex.value = index
    emit('select', index)

    expandActiveSubMenuChain(index)

    if (props.router) {
        const to = route || index
        if (to) {
            interface GlobalRouterProperties {
                $router?: {
                    push: (to: string | Record<string, unknown>) => Promise<unknown> | void
                }
            }
            const router = (instance?.proxy as unknown as GlobalRouterProperties)?.$router ||
                           (instance?.appContext.config.globalProperties as unknown as GlobalRouterProperties).$router
            if (router) {
                Promise.resolve(router.push(to)).catch(() => {})
            } else {
                console.warn('[BrutxUI Menu] router is true but vue-router was not found or is not available.')
            }
        }
    }
}

function toggleSubMenu(index: string) {
    setSubMenuOpen(index, !openedMenus.value.has(index))
}

const menuContext: MenuRuntimeContext = {
    activeIndex,
    focusedIndex,
    firstEnabledIndex,
    tabStopIndex,
    mode: computed(() => props.mode),
    router: computed(() => props.router),
    openedMenus,
    registerItem,
    unregisterItem,
    focusItem,
    focusNextItem,
    focusPrevItem,
    focusFirstItem,
    focusLastItem,
    selectItem,
    toggleSubMenu,
    openSubMenu,
    closeSubMenu,
    registerSubMenu,
    unregisterSubMenu,
    registerSubMenuBranch,
    setHorizontalSubMenuOpen,
}

provide(MENU_KEY, menuContext)
provide(SUB_MENU_KEY, null)

onMounted(() => {
    if (activeIndex.value) expandActiveSubMenuChain(activeIndex.value)
    const ownerDocument = rootRef.value?.ownerDocument
    ownerDocument?.addEventListener('click', handleDocumentClick)
    ownerDocument?.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
    const ownerDocument = rootRef.value?.ownerDocument
    ownerDocument?.removeEventListener('click', handleDocumentClick)
    ownerDocument?.removeEventListener('keydown', handleDocumentKeydown)
})

const menuClasses = computed(() => {
    return cn(
        'flex border-3 border-brutal shadow-brutal bg-brutal-bg p-2 rounded-brutal',
        menuLayoutVariants({ mode: props.mode }),
        props.class
    )
})
</script>

<template>
    <ul ref="rootRef" :class="menuClasses" role="menubar" :aria-orientation="props.mode" @keydown="handleMenuKeydown">
        <slot />
    </ul>
</template>
