<script setup lang="ts">
import { computed, inject } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { TabsList as TabsListPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { tabsListVariants } from './tabs-variants'
import { TABS_ORIENTATION_KEY } from './types'

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

const injectedOrientation = inject(TABS_ORIENTATION_KEY, null)

const resolvedOrientation = computed(() => props.orientation ?? injectedOrientation?.value ?? 'horizontal')

const classes = computed(() =>
    cn(tabsListVariants({ size: props.size, orientation: resolvedOrientation.value }), props.class)
)
</script>

<template>
    <TabsListPrimitive :class="classes" :data-orientation="resolvedOrientation">
        <slot />
    </TabsListPrimitive>
</template>
