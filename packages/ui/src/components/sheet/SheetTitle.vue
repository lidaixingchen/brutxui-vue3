<script setup lang="ts">
import { computed, useSlots, Comment, Text, type VNode } from 'vue'
import { DialogTitle as DialogTitlePrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

interface SheetTitleProps {
    class?: string
}

const props = defineProps<SheetTitleProps>()
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

const hasTitleContent = computed(() => {
    const defaultSlot = slots.default
    if (!defaultSlot) return false
    return hasSlotContent(defaultSlot())
})

const classes = computed(() =>
    cn('text-lg font-black tracking-tight text-brutal-fg', props.class)
)
</script>

<template>
    <DialogTitlePrimitive v-if="hasTitleContent" :class="classes">
        <slot />
    </DialogTitlePrimitive>
</template>
