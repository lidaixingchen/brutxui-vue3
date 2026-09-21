<script setup lang="ts">
import { computed } from 'vue'
import { TabsContent as TabsContentPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { tabsContentVariants, type TabsContentSurface } from './tabs-variants'

interface TabsContentProps {
    value: string
    surface?: TabsContentSurface
    forceMount?: boolean
    class?: string
}

const props = withDefaults(defineProps<TabsContentProps>(), {
    surface: 'plain',
    forceMount: undefined,
    class: undefined,
})

const classes = computed(() =>
    cn(tabsContentVariants({ surface: props.surface }), props.class)
)
</script>

<template>
    <TabsContentPrimitive :value="value" :force-mount="forceMount" :class="classes">
        <slot />
    </TabsContentPrimitive>
</template>
