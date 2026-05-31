<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '../lib/utils'

const submitButtonVariants = cva(
    [
        'inline-flex items-center justify-center gap-2',
        'border-3 border-brutal rounded-brutal',
        'font-black tracking-wide',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2',
    ],
    {
        variants: {},
        defaultVariants: {},
    }
)

interface SubmitButtonProps {
    class?: string
    disabled?: boolean
}

const props = defineProps<SubmitButtonProps>()

const classes = computed(() =>
    cn(submitButtonVariants(), props.class)
)
</script>

<template>
    <button type="submit" :class="classes" :disabled="disabled">
        <slot />
    </button>
</template>
