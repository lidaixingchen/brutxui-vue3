<script setup lang="ts">
import { computed, ref } from 'vue'
import { Menu } from '@lucide/vue'
import { useLocale } from '@/composables/useLocale'
import { cn } from '../../lib/utils'
import Button from '../button/Button.vue'

interface DashboardShellProps {
    userEmail?: string
    class?: string
}

const props = withDefaults(defineProps<DashboardShellProps>(), {
    userEmail: undefined,
    class: undefined,
})

const emit = defineEmits<{
    signOut: []
}>()

const { t } = useLocale()

const sidebarOpen = ref(true)

const displayEmail = computed(() => props.userEmail ?? t('dashboardShell.defaultEmail'))

const rootClasses = computed(() => cn('flex h-screen bg-brutal-bg', props.class))

const sidebarClasses = computed(() =>
    cn(
        'border-r-3 border-brutal bg-brutal-bg p-4 flex flex-col',
        sidebarOpen.value ? 'w-64' : 'w-0 overflow-hidden md:w-64'
    )
)
</script>

<template>
    <div :class="rootClasses">
        <aside :class="sidebarClasses" :aria-label="t('dashboardShell.sidebarNavigation')">
            <div class="font-black text-lg tracking-tight mb-8">
BrutxUI
</div>
            <nav class="flex-1 space-y-1">
                <slot name="sidebar" />
            </nav>
            <div class="border-t-3 border-brutal pt-4 mt-4">
                <div class="text-sm font-bold truncate">
{{ displayEmail }}
</div>
                <Button variant="link" class="text-sm font-bold text-brutal-destructive mt-1 hover:no-underline" @click="emit('signOut')">
{{ t('dashboardShell.signOut') }}
</Button>
            </div>
        </aside>

        <div class="flex-1 flex flex-col overflow-hidden">
            <header class="border-b-3 border-brutal bg-brutal-bg px-6 py-3 flex items-center justify-between">
                <Button variant="default" size="icon" class="md:hidden h-8 w-8" @click="sidebarOpen = !sidebarOpen">
                    <Menu class="h-4 w-4 stroke-[3]" />
                </Button>
                <slot name="header" />
            </header>

            <main class="flex-1 overflow-y-auto p-6">
                <slot />
            </main>
        </div>
    </div>
</template>
