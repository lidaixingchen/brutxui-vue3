<script setup lang="ts">
import { computed, ref } from 'vue'
import { Menu } from 'lucide-vue-next'
import { cn } from '../lib/utils'

interface DashboardShellProps {
    userEmail?: string
    class?: string
}

const props = withDefaults(defineProps<DashboardShellProps>(), {
    userEmail: 'creator@brutxui.site',
    class: '',
})

const emit = defineEmits<{
    signOut: []
}>()

const sidebarOpen = ref(true)

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
        <aside :class="sidebarClasses">
            <div class="font-black text-lg tracking-tight mb-8">
BrutxUI
</div>
            <nav class="flex-1 space-y-1">
                <slot name="sidebar" />
            </nav>
            <div class="border-t-3 border-brutal pt-4 mt-4">
                <div class="text-sm font-bold truncate">
{{ userEmail }}
</div>
                <button class="text-sm font-bold text-brutal-destructive mt-1" @click="emit('signOut')">
Sign out
</button>
            </div>
        </aside>

        <div class="flex-1 flex flex-col overflow-hidden">
            <header class="border-b-3 border-brutal bg-brutal-bg px-6 py-3 flex items-center justify-between">
                <button class="md:hidden h-8 w-8 flex items-center justify-center border-3 border-brutal shadow-brutal-sm" @click="sidebarOpen = !sidebarOpen">
                    <Menu class="h-4 w-4 stroke-[3]" />
                </button>
                <slot name="header" />
            </header>

            <main class="flex-1 overflow-y-auto p-6">
                <slot />
            </main>
        </div>
    </div>
</template>
