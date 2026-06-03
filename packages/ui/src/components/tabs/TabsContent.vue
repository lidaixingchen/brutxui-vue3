<script setup lang="ts">
import { computed } from 'vue'
import { TabsContent as TabsContentPrimitive } from 'reka-ui'
import { cn } from '../../lib/utils'
import { tabsContentVariants } from './tabs-variants'

interface TabsContentProps {
    value: string
    class?: string
}

const props = defineProps<TabsContentProps>()

const classes = computed(() =>
    cn(tabsContentVariants(), props.class)
)
</script>

<template>
    <TabsContentPrimitive :value="value" :class="classes">
        <slot />
    </TabsContentPrimitive>
</template>
