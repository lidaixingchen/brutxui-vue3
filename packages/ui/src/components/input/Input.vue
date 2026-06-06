<script setup lang="ts">
import { computed, ref } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { inputVariants } from './input-variants'

type InputVariantProps = VariantProps<typeof inputVariants>

interface InputProps {
    type?: string
    modelValue?: string
    variant?: NonNullable<InputVariantProps['variant']>
    inputSize?: NonNullable<InputVariantProps['inputSize']>
    disabled?: boolean
    placeholder?: string
    class?: string
}

const props = withDefaults(defineProps<InputProps>(), {
    type: 'text',
    modelValue: undefined,
    variant: 'default',
    inputSize: 'default',
    disabled: false,
    placeholder: undefined,
    class: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isComposing = ref(false)

const classes = computed(() =>
    cn(inputVariants({ variant: props.variant, inputSize: props.inputSize }), props.class)
)
</script>

<template>
    <input
        :type="type"
        :value="modelValue"
        :disabled="disabled"
        :placeholder="placeholder"
        :class="classes"
        @compositionstart="isComposing = true"
        @compositionend="(e: CompositionEvent) => { isComposing = false; emit('update:modelValue', (e.target as HTMLInputElement).value) }"
        @input="!isComposing && emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
</template>
