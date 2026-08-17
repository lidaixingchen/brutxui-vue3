<script setup lang="ts">
import { computed } from 'vue'
import { TabsContent as TabsContentPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { tabsContentVariants } from './tabs-variants'

interface TabsContentProps {
    value: string
    forceMount?: boolean
    class?: string
}

const props = withDefaults(defineProps<TabsContentProps>(), {
    forceMount: undefined,
    class: undefined,
})

const classes = computed(() =>
    cn(tabsContentVariants(), props.class)
)
</script>

<template>
    <TabsContentPrimitive :value="value" :force-mount="forceMount" :class="classes">
        <slot />
    </TabsContentPrimitive>
</template>
