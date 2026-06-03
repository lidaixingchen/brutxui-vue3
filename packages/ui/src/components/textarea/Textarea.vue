<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { textareaVariants } from './textarea-variants'
import { useLocale } from '@/composables/useLocale'

type TextareaVariantProps = VariantProps<typeof textareaVariants>

interface TextareaProps {
    modelValue?: string
    variant?: NonNullable<TextareaVariantProps['variant']>
    textareaSize?: NonNullable<TextareaVariantProps['textareaSize']>
    disabled?: boolean
    placeholder?: string
    class?: string
}

const props = withDefaults(defineProps<TextareaProps>(), {
    modelValue: undefined,
    variant: 'default',
    textareaSize: 'default',
    disabled: false,
    placeholder: undefined,
    class: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('textarea.placeholder'))

const classes = computed(() =>
    cn(textareaVariants({ variant: props.variant, textareaSize: props.textareaSize }), props.class)
)
</script>

<template>
    <textarea
        :value="modelValue"
        :disabled="disabled"
        :placeholder="resolvedPlaceholder"
        :class="classes"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
</template>
