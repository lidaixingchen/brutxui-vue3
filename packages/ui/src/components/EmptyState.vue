<script setup lang="ts">
import { computed, type Component } from 'vue'
import { FolderOpen, Plus } from 'lucide-vue-next'
import { cn } from '../lib/utils'
import Button from './Button.vue'

interface EmptyStateProps {
    title?: string
    description?: string
    actionText?: string
    icon?: Component
    class?: string
}

const props = withDefaults(defineProps<EmptyStateProps>(), {
    title: 'No active deployments found',
    description: '',
    actionText: 'Deploy New App',
    icon: undefined,
    class: '',
})

const emit = defineEmits<{
    action: []
}>()

const rootClasses = computed(() => cn('flex flex-col items-center justify-center py-16 px-4', props.class))
</script>

<template>
    <div :class="rootClasses">
        <div class="relative mb-6">
            <div class="absolute inset-0 bg-brutal-muted border-3 border-brutal translate-x-2 translate-y-2" />
            <div class="relative h-20 w-20 flex items-center justify-center bg-brutal-accent border-3 border-brutal shadow-brutal">
                <component :is="icon || FolderOpen" class="h-10 w-10 stroke-[2.5]" />
            </div>
        </div>
        <h3 class="text-xl font-black tracking-tight">
{{ title }}
</h3>
        <p v-if="description" class="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium text-center max-w-md">
{{ description }}
</p>
        <Button v-if="actionText" variant="primary" class="mt-6" @click="emit('action')">
            <Plus class="mr-2 h-4 w-4 stroke-[3]" />
            {{ actionText }}
        </Button>
    </div>
</template>
