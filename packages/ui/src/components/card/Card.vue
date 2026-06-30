<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { cardVariants } from './card-variants'

type CardVariantProps = VariantProps<typeof cardVariants>

interface CardProps {
    variant?: NonNullable<CardVariantProps['variant']>
    padding?: NonNullable<CardVariantProps['padding']>
    interactive?: boolean
    class?: string
}

const props = withDefaults(defineProps<CardProps>(), {
    variant: 'default',
    padding: 'default',
    interactive: false,
    class: undefined,
})

const emit = defineEmits<{
    activate: []
}>()

const classes = computed(() =>
    cn(
        cardVariants({ variant: props.variant, padding: props.padding }),
        props.interactive && 'cursor-pointer hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all',
        props.class
    )
)

function onKeydown(e: KeyboardEvent) {
    if (!props.interactive) return
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        emit('activate')
    }
}

function onClick() {
    if (!props.interactive) return
    emit('activate')
}
</script>

<template>
    <div
        :class="classes"
        :role="interactive ? 'button' : undefined"
        :tabindex="interactive ? 0 : undefined"
        @click="onClick"
        @keydown="onKeydown"
    >
        <slot />
    </div>
</template>
