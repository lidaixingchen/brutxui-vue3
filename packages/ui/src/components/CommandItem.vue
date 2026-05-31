<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '../lib/utils'

interface CommandItemProps {
    value: string
    disabled?: boolean
    class?: string
}

const props = defineProps<CommandItemProps>()

const emit = defineEmits<{ select: [value: string] }>()

const isSelected = ref(false)

const classes = computed(() =>
    cn(
        'relative flex cursor-pointer items-center gap-3 px-3 py-2',
        'text-sm font-semibold',
        'select-none outline-none',
        'border-3 border-transparent',
        'data-[selected=true]:bg-brutal-secondary data-[selected=true]:text-brutal-fg',
        'data-[selected=true]:border-brutal data-[selected=true]:font-black',
        'data-[selected=true]:shadow-brutal-sm',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        props.class
    )
)

function handleMouseEnter() {
    isSelected.value = true
}

function handleMouseLeave() {
    isSelected.value = false
}

function handleClick() {
    if (!props.disabled) {
        emit('select', props.value)
    }
}
</script>

<template>
    <div
        :class="classes"
        data-slot="command-item"
        :data-selected="isSelected"
        :data-disabled="disabled"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @click="handleClick"
    >
        <slot />
    </div>
</template>
