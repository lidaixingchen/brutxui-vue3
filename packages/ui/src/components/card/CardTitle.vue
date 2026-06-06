<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'

interface CardTitleProps {
    as?: string
    class?: string
}

const props = withDefaults(defineProps<CardTitleProps>(), {
    as: 'h3',
    class: undefined,
})

const classes = computed(() =>
    cn('text-2xl font-black tracking-tight leading-none', props.class)
)
</script>

<template>
    <component :is="as" :class="classes">
        <slot />
    </component>
</template>
