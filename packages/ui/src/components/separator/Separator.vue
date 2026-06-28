<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Separator as SeparatorPrimitive } from 'reka-ui'
import { separatorVariants, separatorLineVariants } from './separator-variants'

type SeparatorVariantProps = VariantProps<typeof separatorVariants>

interface SeparatorProps {
    variant?: NonNullable<SeparatorVariantProps['variant']>
    size?: NonNullable<SeparatorVariantProps['size']>
    orientation?: NonNullable<SeparatorVariantProps['orientation']>
    decorative?: boolean
    class?: string
}

const props = withDefaults(defineProps<SeparatorProps>(), {
    variant: 'default',
    size: 'default',
    orientation: 'horizontal',
    decorative: true,
    class: undefined,
})

const slots = useSlots()

const hasLabel = computed(() => Boolean(slots.default && slots.default().length > 0))

const isTextSeparator = computed(() => props.orientation === 'horizontal' && hasLabel.value)

const classes = computed(() =>
    cn(separatorVariants({ variant: props.variant, size: props.size, orientation: props.orientation }), props.class)
)

const lineClasses = computed(() =>
    separatorLineVariants({ variant: props.variant, size: props.size })
)

const wrapperClasses = computed(() =>
    cn('flex items-center gap-3 w-full', props.class)
)
</script>

<template>
    <div
        v-if="isTextSeparator"
        :class="wrapperClasses"
        role="separator"
        data-orientation="horizontal"
    >
        <div :class="lineClasses" />
        <slot />
        <div :class="lineClasses" />
    </div>
    <SeparatorPrimitive
        v-else
        :orientation="orientation"
        :decorative="decorative"
        :class="classes"
    >
        <slot />
    </SeparatorPrimitive>
</template>
