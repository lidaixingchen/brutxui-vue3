<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { DialogTitle as DialogTitlePrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { hasSlotContent } from '@/lib/slot-utils'

interface SheetTitleProps {
    class?: string
}

const props = defineProps<SheetTitleProps>()
const slots = useSlots()

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
