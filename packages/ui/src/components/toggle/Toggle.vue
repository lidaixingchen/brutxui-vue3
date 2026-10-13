<script setup lang="ts">
import { computed } from 'vue'
import { Toggle } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { Loader2 } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { toggleVariants } from './toggle-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

type ToggleVariantProps = VariantProps<typeof toggleVariants>

interface ToggleProps {
    modelValue?: boolean
    variant?: NonNullable<ToggleVariantProps['variant']>
    size?: NonNullable<ToggleVariantProps['size']>
    disabled?: boolean
    loading?: boolean
    class?: string
    /** 无障碍标签 */
    ariaLabel?: string
}

const props = withDefaults(defineProps<ToggleProps>(), {
    variant: 'default',
    size: 'default',
    disabled: false,
    loading: false,
    class: undefined,
    ariaLabel: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const TOGGLE_SIZE_TO_ICON: Record<NonNullable<ToggleVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'md',
    lg: 'lg',
}

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() =>
    cn(
        toggleVariants({ variant: props.variant, size: props.size }),
        props.loading && 'relative',
        isDisabled.value && 'pointer-events-none',
        props.class,
    )
)

const loaderClasses = computed(() =>
    cn(
        iconSizeVariants({ size: TOGGLE_SIZE_TO_ICON[props.size] }),
        'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin motion-reduce:animate-none'
    )
)
</script>

<template>
    <Toggle
        :model-value="modelValue"
        :disabled="isDisabled"
        :class="classes"
        :aria-label="ariaLabel"
        :aria-busy="loading || undefined"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <span v-if="loading" class="inline-flex items-center gap-2 opacity-0">
            <slot />
        </span>
        <slot v-else />
        <Loader2 v-if="loading" :class="loaderClasses" aria-hidden="true" />
    </Toggle>
</template>
