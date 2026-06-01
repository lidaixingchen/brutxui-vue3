<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'

interface MarqueeProps {
    direction?: 'left' | 'right'
    speed?: number // Speed in seconds for a full loop
    pauseOnHover?: boolean
    fade?: boolean
    class?: string
}

const props = withDefaults(defineProps<MarqueeProps>(), {
    direction: 'left',
    speed: 20,
    pauseOnHover: false,
    fade: false,
    class: '',
})

const containerClasses = computed(() =>
    cn(
        'relative flex overflow-hidden w-full border-y-3 border-brutal bg-brutal-accent text-brutal-fg font-black uppercase py-4 text-xl tracking-widest select-none',
        props.class
    )
)

const trackClasses = computed(() =>
    cn(
        'flex min-w-full shrink-0 items-center justify-around gap-4',
        props.direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right',
        props.pauseOnHover && 'hover:[animation-play-state:paused]'
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
