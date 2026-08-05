<script setup lang="ts">
import { computed, provide, ref, watch, getCurrentInstance, onMounted } from 'vue'
import { MENU_KEY } from './menu-types'
import { cn } from '@/lib/utils'

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
const openedMenus = ref<Set<string>>(new Set())
const instance = getCurrentInstance()

const subMenuChildren = new Map<string, ReadonlySet<string>>()

function registerSubMenu(index: string, children: ReadonlySet<string>) {
    subMenuChildren.set(index, children)
}

function unregisterSubMenu(index: string) {
    subMenuChildren.delete(index)
}

function expandActiveSubMenuChain(target: string) {
    const toOpen = new Set(openedMenus.value)
    let changed = false
    const stack = [target]
    while (stack.length > 0) {
        const current = stack.pop()!
        for (const [subIndex, children] of subMenuChildren) {
            if (children.has(current) && !toOpen.has(subIndex)) {
                toOpen.add(subIndex)
                stack.push(subIndex)
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

function selectItem(index: string, route?: string | object) {
    activeIndex.value = index
    emit('select', index)

    expandActiveSubMenuChain(index)

    if (props.router) {
        const to = route || index
        if (to) {
            interface GlobalRouterProperties {
                $router?: {
                    push: (to: string | object) => void
                }
            }
            const router = (instance?.proxy as unknown as GlobalRouterProperties)?.$router ||
                           (instance?.appContext.config.globalProperties as unknown as GlobalRouterProperties).$router
            if (router) {
                router.push(to)
            } else {
                console.warn('[BrutxUI Menu] router is true but vue-router was not found or is not available.')
            }
        }
    }
}

function toggleSubMenu(index: string) {
    const next = new Set(openedMenus.value)
    if (next.has(index)) {
        next.delete(index)
    } else {
        next.add(index)
    }
    openedMenus.value = next
}

provide(MENU_KEY, {
    activeIndex,
    mode: computed(() => props.mode),
    router: computed(() => props.router),
    selectItem,
    openedMenus,
    toggleSubMenu,
    registerSubMenu,
    unregisterSubMenu,
})

onMounted(() => {
    if (activeIndex.value) expandActiveSubMenuChain(activeIndex.value)
})

const menuClasses = computed(() => {
    return cn(
        'flex border-3 border-brutal shadow-brutal bg-brutal-bg p-2 rounded-brutal',
        props.mode === 'horizontal' 
            ? 'flex-row items-center gap-2 w-full' 
            : 'flex-col gap-1.5 w-64',
        props.class
    )
})
</script>

<template>
    <ul :class="menuClasses" role="menubar">
        <slot />
    </ul>
</template>
