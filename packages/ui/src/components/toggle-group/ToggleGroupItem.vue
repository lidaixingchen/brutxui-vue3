<script setup lang="ts">
import { computed, inject } from 'vue'
import { ToggleGroupItem as ToggleGroupItemPrimitive } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { toggleVariants } from '../toggle/toggle-variants'
import { toggleGroupKey } from './toggle-group-key'

type ToggleVariantProps = VariantProps<typeof toggleVariants>

interface ToggleGroupItemProps {
    value: string
    variant?: NonNullable<ToggleVariantProps['variant']>
    size?: NonNullable<ToggleVariantProps['size']>
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<ToggleGroupItemProps>(), {
    variant: undefined,
    size: undefined,
    disabled: false,
    class: undefined,
})

const context = inject(toggleGroupKey, {
    variant: computed<NonNullable<ToggleVariantProps['variant']> | undefined>(() => undefined),
    size: computed<NonNullable<ToggleVariantProps['size']> | undefined>(() => undefined),
    disabled: computed(() => false),
})

const disabled = computed(() => context.disabled.value || props.disabled)

const classes = computed(() =>
    cn(
        toggleVariants({
            variant: props.variant ?? context.variant.value ?? 'default',
            size: props.size ?? context.size.value ?? 'default',
        }),
        props.class
    )
)
</script>

<template>
    <ToggleGroupItemPrimitive :value="value" :disabled="disabled" :class="classes">
        <slot />
    </ToggleGroupItemPrimitive>
</template>
