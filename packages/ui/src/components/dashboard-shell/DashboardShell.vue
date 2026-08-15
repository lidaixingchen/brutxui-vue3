<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { Menu } from '@lucide/vue'
import { useLocale } from '@/composables/useLocale'
import { cn } from '@/lib/utils'
import { getDocument, isClient, matchMedia } from '@/lib/env'
import Button from '../button/Button.vue'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import {
    dashboardShellVariants,
    dashboardSidebarVariants,
    dashboardHeaderVariants,
    dashboardMainVariants,
} from './dashboard-shell-variants'

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'

interface DashboardShellProps {
    userEmail?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<DashboardShellProps>(), {
    userEmail: undefined,
    class: undefined,
    iconSize: 'md',
})

const emit = defineEmits<{
    'sign-out': []
}>()

const { t } = useLocale()

const sidebarId = useId()
const sidebarElement = ref<HTMLElement | null>(null)
const headerElement = ref<HTMLElement | null>(null)

const sidebarOpen = ref(true)
const isDesktop = ref(true)
let desktopQuery: MediaQueryList | null = null

// 客户端同步视口：移动端默认收起、桌面端默认展开；SSR 无法获知视口（isClient=false 时跳过）
if (isClient) {
    const mq = matchMedia(DESKTOP_MEDIA_QUERY)
    if (mq) {
        desktopQuery = mq
        isDesktop.value = mq.matches
        sidebarOpen.value = mq.matches
    }
}

const onDesktopChange = (event: MediaQueryListEvent): void => {
    isDesktop.value = event.matches
    sidebarOpen.value = event.matches
}

onMounted(() => {
    desktopQuery?.addEventListener('change', onDesktopChange)
})

onUnmounted(() => {
    desktopQuery?.removeEventListener('change', onDesktopChange)
})

const closeSidebar = (): void => {
    sidebarOpen.value = false
}

// 移动端收起时侧边栏从可聚焦/可感知范围移除（inert）；桌面端始终可见
const isInert = computed(() => !isDesktop.value && !sidebarOpen.value)

const overlayVisible = computed(() => !isDesktop.value && sidebarOpen.value)

// 移动端展开后把焦点移入侧边栏；收起时若焦点在侧边栏内则归还给触发按钮
watch(sidebarOpen, async (open) => {
    if (!isClient) return
    await nextTick()
    if (open) {
        if (isDesktop.value) return
        sidebarElement.value
            ?.querySelector<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])')
            ?.focus()
        return
    }
    const activeElement = getDocument()?.activeElement ?? null
    if (sidebarElement.value?.contains(activeElement)) {
        headerElement.value?.querySelector<HTMLElement>('button')?.focus()
    }
})

const rootClasses = computed(() => cn(dashboardShellVariants(), props.class))

const sidebarClasses = computed(() =>
    dashboardSidebarVariants({ open: sidebarOpen.value })
)

const headerClasses = computed(() =>
    cn(dashboardHeaderVariants(), 'relative z-20')
)

const mainClasses = computed(() => dashboardMainVariants())

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <div :class="rootClasses">
        <aside
            :id="sidebarId"
            ref="sidebarElement"
            :class="sidebarClasses"
            :inert="isInert"
            :aria-label="t('dashboardShell.sidebarNavigation')"
        >
            <div class="font-black text-lg tracking-tight mb-8">
                {{ t('dashboardShell.brand') }}
            </div>
            <nav class="flex-1 space-y-1">
                <slot name="sidebar" />
            </nav>
            <div class="border-t-3 border-brutal pt-4 mt-4">
                <div v-if="props.userEmail" class="text-sm font-bold truncate">
                    {{ props.userEmail }}
                </div>
                <Button variant="link" class="text-sm font-bold text-brutal-destructive mt-1 hover:no-underline" @click="emit('sign-out')">
                    {{ t('dashboardShell.signOut') }}
                </Button>
            </div>
        </aside>

        <div class="relative flex-1 flex flex-col overflow-hidden">
            <header ref="headerElement" :class="headerClasses">
                <Button
                    variant="default"
                    size="icon"
                    class="md:hidden h-8 w-8 shadow-brutal-sm"
                    :aria-expanded="sidebarOpen"
                    :aria-controls="sidebarId"
                    @click="sidebarOpen = !sidebarOpen"
                >
                    <Menu :class="iconClasses" />
                </Button>
                <slot name="header" />
            </header>

            <main :class="mainClasses">
                <slot />
            </main>

            <div
                v-if="overlayVisible"
                class="absolute inset-0 z-10 bg-brutal-overlay"
                aria-hidden="true"
                @click="closeSidebar"
            />
        </div>
    </div>
</template>
