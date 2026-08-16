<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { marqueeContainerVariants, marqueeTrackVariants } from './marquee-variants'
import { useReducedMotion } from '@/composables/useReducedMotion'

type MarqueeContainerVariantProps = VariantProps<typeof marqueeContainerVariants>

const DEFAULT_SPEED = 20
const MIN_SPEED_SECONDS = 0.1

interface MarqueeProps {
    direction?: 'left' | 'right'
    speed?: number
    pauseOnHover?: boolean
    fade?: boolean
    variant?: NonNullable<MarqueeContainerVariantProps['variant']>
    size?: NonNullable<MarqueeContainerVariantProps['size']>
    class?: string
}

const props = withDefaults(defineProps<MarqueeProps>(), {
    direction: 'left',
    speed: DEFAULT_SPEED,
    pauseOnHover: false,
    fade: false,
    variant: 'default',
    size: 'default',
    class: undefined,
})

const prefersReducedMotion = useReducedMotion()

const containerClasses = computed(() =>
    cn(
        marqueeContainerVariants({
            fade: props.fade || undefined,
            variant: props.variant,
            size: props.size,
        }),
        props.class
    )
)

const trackClasses = computed(() =>
    cn(
        marqueeTrackVariants({ direction: props.direction, pauseOnHover: props.pauseOnHover || undefined }),
        prefersReducedMotion.value && 'animate-none!',
    )
)

const containerStyle = computed(() => {
    const validSpeed = typeof props.speed === 'number' && Number.isFinite(props.speed) ? props.speed : DEFAULT_SPEED
    return {
        '--speed': `${Math.max(validSpeed, MIN_SPEED_SECONDS)}s`,
    }
})
</script>

<template>
    <div :class="containerClasses" :style="containerStyle">
        <div :class="trackClasses">
            <slot />
        </div>
        <div v-if="!prefersReducedMotion" :class="trackClasses" aria-hidden="true" inert>
            <slot />
        </div>
    </div>
</template>
