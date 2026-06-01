<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { marqueeContainerVariants, marqueeTrackVariants } from './marquee-variants'

const DEFAULT_SPEED = 20

interface MarqueeProps {
    direction?: 'left' | 'right'
    speed?: number
    pauseOnHover?: boolean
    fade?: boolean
    class?: string
}

const props = withDefaults(defineProps<MarqueeProps>(), {
    direction: 'left',
    speed: DEFAULT_SPEED,
    pauseOnHover: false,
    fade: false,
    class: '',
})

const containerClasses = computed(() =>
    cn(marqueeContainerVariants({ fade: props.fade || undefined }), props.class)
)

const trackClasses = computed(() =>
    cn(
        marqueeTrackVariants({ direction: props.direction, pauseOnHover: props.pauseOnHover || undefined })
    )
)

const containerStyle = computed(() => {
    const style: Record<string, string> = {
        '--speed': `${props.speed}s`,
    }
    if (props.fade) {
        style['mask-image'] = 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
        style['-webkit-mask-image'] = 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
    }
    return style
})
</script>

<template>
    <div :class="containerClasses" :style="containerStyle">
        <div :class="trackClasses">
            <slot />
        </div>
        <div :class="trackClasses" aria-hidden="true">
            <slot />
        </div>
    </div>
</template>
