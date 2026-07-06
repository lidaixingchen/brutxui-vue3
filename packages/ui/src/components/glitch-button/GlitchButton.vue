<script setup lang="ts">
import { ref } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import Button from '../button/Button.vue'
import { buttonVariants } from '../button/button-variants'
import { DEFAULT_AUTOPLAY_INTERVAL_MS } from '@/lib/defaults'
import type { GlitchTrigger } from '@/composables/useGlitchEffect'

type ButtonVariantProps = VariantProps<typeof buttonVariants>

interface GlitchButtonProps {
    variant?: NonNullable<ButtonVariantProps['variant']>
    size?: NonNullable<ButtonVariantProps['size']>
    speed?: NonNullable<ButtonVariantProps['glitchSpeed']>
    direction?: NonNullable<ButtonVariantProps['glitchDirection']>
    trigger?: GlitchTrigger
    interval?: number
    asChild?: boolean
    loading?: boolean
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<GlitchButtonProps>(), {
    variant: 'default',
    size: 'default',
    speed: 'medium',
    direction: 'horizontal',
    trigger: 'hover',
    interval: DEFAULT_AUTOPLAY_INTERVAL_MS,
    asChild: false,
    loading: false,
    disabled: false,
    class: undefined,
})

const buttonRef = ref<InstanceType<typeof Button> | null>(null)

function play() {
    buttonRef.value?.play()
}

function stop() {
    buttonRef.value?.stop()
}

defineExpose({
    play,
    stop,
})
</script>

<template>
    <Button
        ref="buttonRef"
        effect="glitch"
        :variant="variant"
        :size="size"
        :as-child="asChild"
        :loading="loading"
        :disabled="disabled"
        :glitch-trigger="trigger"
        :glitch-interval="interval"
        :glitch-speed="speed"
        :glitch-direction="direction"
        :class="props.class"
    >
        <slot />
    </Button>
</template>
