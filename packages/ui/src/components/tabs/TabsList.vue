<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { TabsList as TabsListPrimitive } from 'reka-ui'
import { cn } from '../../lib/utils'
import { tabsListVariants } from './tabs-variants'

type TabsListVariantProps = VariantProps<typeof tabsListVariants>

interface TabsListProps {
    size?: NonNullable<TabsListVariantProps['size']>
    class?: string
}

const props = withDefaults(defineProps<TabsListProps>(), {
    size: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(tabsListVariants({ size: props.size }), props.class)
)
</script>

<template>
    <TabsListPrimitive :class="classes">
        <slot />
    </TabsListPrimitive>
</template>
