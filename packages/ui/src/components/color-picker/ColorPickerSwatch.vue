<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { colorPickerSwatchVariants } from './color-picker-variants'

type SwatchVariantProps = VariantProps<typeof colorPickerSwatchVariants>

interface ColorPickerSwatchProps {
    value: string
    label?: string
    selected?: boolean
    disabled?: boolean
    size?: NonNullable<SwatchVariantProps['size']>
    ariaLabel?: string
}

const props = withDefaults(defineProps<ColorPickerSwatchProps>(), {
    label: undefined,
    selected: false,
    disabled: false,
    size: 'default',
    ariaLabel: undefined,
})

const emit = defineEmits<{ select: [value: string] }>()

const classes = computed(() =>
    cn(
        colorPickerSwatchVariants({ size: props.size, selected: props.selected }),
        props.disabled && 'pointer-events-none'
    )
)

function handleClick() {
    if (props.disabled) return
    emit('select', props.value)
}
</script>

<template>
    <button
        type="button"
        role="option"
        :aria-label="ariaLabel ?? label ?? value"
        :aria-selected="selected"
        :disabled="disabled"
        :title="label ?? value"
        :class="classes"
        :style="{ backgroundColor: value }"
        @click="handleClick"
    />
</template>
