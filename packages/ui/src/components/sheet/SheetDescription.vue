<script setup lang="ts">
import { computed, useSlots, Comment, Text, type VNode } from 'vue'
import { DialogDescription as DialogDescriptionPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

interface SheetDescriptionProps {
    class?: string
}

const props = defineProps<SheetDescriptionProps>()
const slots = useSlots()

function hasSlotContent(nodes: VNode[]): boolean {
    return nodes.some((node) => {
        if (node.type === Comment) return false
        if (node.type === Text && typeof node.children === 'string') {
            return node.children.trim().length > 0
        }
        if (Array.isArray(node.children)) {
            return hasSlotContent(node.children as VNode[])
        }
        return true
    })
}

const hasDescriptionContent = computed(() => {
    const defaultSlot = slots.default
    if (!defaultSlot) return false
    return hasSlotContent(defaultSlot())
})

const classes = computed(() =>
    cn('text-sm text-brutal-muted-foreground font-medium', props.class)
)
</script>

<template>
    <DialogDescriptionPrimitive v-if="hasDescriptionContent" :class="classes">
        <slot />
    </DialogDescriptionPrimitive>
</template>
