<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { DialogDescription as DialogDescriptionPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { hasSlotContent } from '@/lib/slot-utils'

interface SheetDescriptionProps {
    class?: string
}

const props = defineProps<SheetDescriptionProps>()
const slots = useSlots()

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
