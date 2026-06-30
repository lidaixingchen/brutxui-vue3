<script setup lang="ts">
import { computed, inject, type ComputedRef } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { TabsList as TabsListPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { tabsListVariants } from './tabs-variants'

type TabsListVariantProps = VariantProps<typeof tabsListVariants>

interface TabsListProps {
    size?: NonNullable<TabsListVariantProps['size']>
    orientation?: NonNullable<TabsListVariantProps['orientation']>
    class?: string
}

const props = withDefaults(defineProps<TabsListProps>(), {
    size: 'default',
    orientation: undefined,
    class: undefined,
})

const injectedOrientation = inject<ComputedRef<'horizontal' | 'vertical'> | null>('brutx-tabs-orientation', null)

const resolvedOrientation = computed(() => props.orientation ?? injectedOrientation?.value ?? 'horizontal')

const classes = computed(() =>
    cn(tabsListVariants({ size: props.size, orientation: resolvedOrientation.value }), props.class)
)
</script>

<template>
    <TabsListPrimitive :class="classes">
        <slot />
    </TabsListPrimitive>
</template>
