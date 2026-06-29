<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { marqueeContainerVariants, marqueeTrackVariants } from './marquee-variants'
import { useReducedMotion } from '../../composables/useReducedMotion'

type MarqueeContainerVariantProps = VariantProps<typeof marqueeContainerVariants>

const DEFAULT_SPEED = 20

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
    variant: 'accent',
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
        prefersReducedMotion.value && '[animation:none]',
    )
)

const containerStyle = computed(() => ({
    '--speed': `${props.speed}s`,
}))
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
