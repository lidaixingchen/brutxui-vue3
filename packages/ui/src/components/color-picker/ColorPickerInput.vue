<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '../../lib/utils'
import { colorPickerInputVariants } from './color-picker-variants'
import { isValidColor, normalizeColor } from '../../lib/color'

interface ColorPickerInputProps {
    modelValue?: string | null
    format?: 'hex' | 'rgb' | 'hsl'
    showAlpha?: boolean
    disabled?: boolean
    ariaLabel?: string
}

const props = withDefaults(defineProps<ColorPickerInputProps>(), {
    modelValue: null,
    format: 'hex',
    showAlpha: false,
    disabled: false,
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: string | null]
    confirm: [value: string | null]
}>()

const text = ref('')

function syncFromModel() {
    if (props.modelValue && isValidColor(props.modelValue)) {
        text.value = normalizeColor(props.modelValue) ?? ''
    } else {
        text.value = ''
    }
}

watch(() => props.modelValue, syncFromModel, { immediate: true })

const isInvalid = computed(() => text.value.length > 0 && !isValidColor(text.value))

const inputClasses = computed(() =>
    cn(
        colorPickerInputVariants(),
        isInvalid.value && 'border-brutal-destructive',
        props.disabled && 'opacity-50 pointer-events-none'
    )
)

function handleInput(event: Event) {
    const value = (event.target as HTMLInputElement).value
    text.value = value
    if (isValidColor(value)) {
        emit('update:modelValue', normalizeColor(value))
    }
}

function handleBlur() {
    if (text.value && isValidColor(text.value)) {
        const normalized = normalizeColor(text.value)
        text.value = normalized ?? ''
        emit('confirm', normalized)
    } else if (!text.value) {
        emit('confirm', null)
    } else {
        syncFromModel()
    }
}

function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault()
        handleBlur()
    }
}
</script>

<template>
    <input
        type="text"
        :value="text"
        :aria-label="ariaLabel"
        :aria-invalid="isInvalid"
        :disabled="disabled"
        spellcheck="false"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @keydown="handleKeydown"
    >
</template>
