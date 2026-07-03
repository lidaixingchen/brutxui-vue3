<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { brutalHoverLiftNoX } from '@/lib/brutal-interaction-variants'
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
    activate: [event: Event]
}>()

const isInteractive = computed(() => props.interactive || props.variant === 'interactive')

const classes = computed(() =>
    cn(
        cardVariants({ variant: props.variant, padding: props.padding }),
        (props.interactive && props.variant !== 'interactive') &&
            `cursor-pointer ${brutalHoverLiftNoX} transition-all`,
        props.class
    )
)

function onKeydown(e: KeyboardEvent) {
    if (!isInteractive.value) return
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        emit('activate', e)
    }
}

function onClick(e: MouseEvent) {
    if (!isInteractive.value) return
    emit('activate', e)
}
</script>

<template>
    <div
        :class="classes"
        :role="isInteractive ? 'button' : undefined"
        :tabindex="isInteractive ? 0 : undefined"
        @click="onClick"
        @keydown="onKeydown"
    >
        <slot />
    </div>
</template>
