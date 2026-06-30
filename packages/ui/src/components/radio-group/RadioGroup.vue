<script setup lang="ts">
import { computed } from 'vue'
import { RadioGroupRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

interface RadioGroupProps {
    modelValue?: string
    name?: string
    disabled?: boolean
    orientation?: 'horizontal' | 'vertical'
    class?: string
    /** 无障碍标签 */
    ariaLabel?: string
}

const props = defineProps<RadioGroupProps>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const classes = computed(() => cn('grid gap-2', props.class))
</script>

<template>
    <RadioGroupRoot
        :model-value="modelValue"
        :name="name"
        :disabled="disabled"
        :orientation="orientation"
        :aria-label="ariaLabel"
        :class="classes"
        @update:model-value="(val) => { if (typeof val === 'string') emit('update:modelValue', val) }"
    >
        <slot />
    </RadioGroupRoot>
</template>
