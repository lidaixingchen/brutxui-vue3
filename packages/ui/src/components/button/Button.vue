<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Loader2 } from '@lucide/vue'
import { Primitive } from 'reka-ui'
import { buttonVariants } from './button-variants'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'

type ButtonVariantProps = VariantProps<typeof buttonVariants>

interface ButtonProps {
    variant?: NonNullable<ButtonVariantProps['variant']>
    size?: NonNullable<ButtonVariantProps['size']>
    asChild?: boolean
    loading?: boolean
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<ButtonProps>(), {
    variant: 'default',
    size: 'default',
    asChild: false,
    loading: false,
    disabled: false,
    class: undefined,
})

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() =>
    cn(
        buttonVariants({ variant: props.variant, size: props.size }),
        props.asChild && isDisabled.value && 'pointer-events-none',
        props.class,
    )
)

const BUTTON_SIZE_TO_ICON: Record<NonNullable<ButtonVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'default',
    lg: 'lg',
    xl: 'xl',
    icon: 'default',
}

const loaderClasses = computed(() =>
    cn(iconSizeVariants({ size: BUTTON_SIZE_TO_ICON[props.size] }), 'animate-spin')
)
</script>

<template>
    <Primitive
        :as="asChild ? undefined : 'button'"
        :as-child="asChild"
        :class="classes"
        :disabled="!asChild && isDisabled"
        :aria-disabled="asChild && isDisabled ? true : undefined"
        :aria-busy="loading || undefined"
    >
        <Loader2 v-if="loading" :class="loaderClasses" />
        <slot />
    </Primitive>
</template>
