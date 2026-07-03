<script setup lang="ts">
import { computed, provide, ref, watch, getCurrentInstance } from 'vue'
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

watch(() => props.defaultActive, (val) => {
    activeIndex.value = val
})

function selectItem(index: string, route?: string | object) {
    activeIndex.value = index
    emit('select', index)
    
    if (props.router) {
        const to = route || index
        if (to) {
            const instance = getCurrentInstance()
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
    router: props.router,
    selectItem,
    openedMenus,
    toggleSubMenu,
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
