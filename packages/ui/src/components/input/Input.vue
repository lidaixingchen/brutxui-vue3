<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { inputVariants } from './input-variants'
import { useLocale } from '@/composables/useLocale'

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

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('input.placeholder'))

const classes = computed(() =>
    cn(inputVariants({ variant: props.variant, inputSize: props.inputSize }), props.class)
)
</script>

<template>
    <input
        :type="type"
        :value="modelValue"
        :disabled="disabled"
        :placeholder="resolvedPlaceholder"
        :class="classes"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
</template>
