<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { TabsTrigger as TabsTriggerPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { tabsTriggerVariants } from './tabs-variants'

type TabsTriggerVariantProps = VariantProps<typeof tabsTriggerVariants>

interface TabsTriggerProps {
    value: string
    disabled?: boolean
    variant?: NonNullable<TabsTriggerVariantProps['variant']>
    class?: string
}

const props = withDefaults(defineProps<TabsTriggerProps>(), {
    disabled: false,
    variant: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(tabsTriggerVariants({ variant: props.variant }), props.class)
)
</script>

<template>
    <TabsTriggerPrimitive :value="value" :disabled="disabled" :class="classes">
        <slot />
    </TabsTriggerPrimitive>
</template>
