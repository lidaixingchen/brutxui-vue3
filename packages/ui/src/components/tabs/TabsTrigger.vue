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

function revealFocusedTab(event: FocusEvent) {
    const trigger = event.currentTarget as HTMLElement
    const list = trigger.closest<HTMLElement>('[role="tablist"]')
    if (!list || list.scrollWidth <= list.clientWidth) return

    const tabBounds = trigger.getBoundingClientRect()
    const listLeft = list.getBoundingClientRect().left + list.clientLeft
    const listRight = listLeft + list.clientWidth
    if (tabBounds.left < listLeft) {
        list.scrollLeft += tabBounds.left - listLeft
    }
    else if (tabBounds.right > listRight) {
        list.scrollLeft += tabBounds.right - listRight
    }
}
</script>

<template>
    <TabsTriggerPrimitive :value="value" :disabled="disabled" :class="classes" @focus="revealFocusedTab">
        <slot />
    </TabsTriggerPrimitive>
</template>
