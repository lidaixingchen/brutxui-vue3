<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'

interface AvatarFallbackProps {
    class?: string
}

const props = defineProps<AvatarFallbackProps>()

const classes = computed(() =>
    cn('flex h-full w-full items-center justify-center bg-gray-200 font-bold', props.class)
)
</script>

<template>
    <span :class="classes">
        <slot />
    </span>
</template>
