<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { textareaVariants } from './textarea-variants'
import { useLocale } from '@/composables/useLocale'

type TextareaVariantProps = VariantProps<typeof textareaVariants>

interface TextareaProps {
    modelValue?: string
    variant?: NonNullable<TextareaVariantProps['variant']>
    size?: NonNullable<TextareaVariantProps['size']>
    disabled?: boolean
    readonly?: boolean
    placeholder?: string
    /** 无障碍标签 */
    ariaLabel?: string
    /** 关联的标签元素 ID */
    ariaLabelledby?: string
    /** 描述元素 ID */
    ariaDescribedby?: string
    /** 是否无效 */
    ariaInvalid?: boolean
    /** 错误消息元素 ID */
    ariaErrormessage?: string
    /** 是否必填 */
    ariaRequired?: boolean
    class?: string
}

const props = withDefaults(defineProps<TextareaProps>(), {
    modelValue: undefined,
    variant: 'default',
    size: 'default',
    disabled: false,
    readonly: false,
    placeholder: undefined,
    ariaLabel: undefined,
    ariaLabelledby: undefined,
    ariaDescribedby: undefined,
    ariaInvalid: undefined,
    ariaErrormessage: undefined,
    ariaRequired: undefined,
    class: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('textarea.placeholder'))

const classes = computed(() =>
    cn(
        textareaVariants({ variant: props.variant, size: props.size }),
        props.readonly && 'cursor-default',
        props.class
    )
)
</script>

<template>
    <textarea
        :value="modelValue"
        :disabled="disabled"
        :readonly="readonly"
        :placeholder="resolvedPlaceholder"
        :class="classes"
        :aria-label="ariaLabel"
        :aria-labelledby="ariaLabelledby"
        :aria-describedby="ariaDescribedby"
        :aria-invalid="ariaInvalid"
        :aria-errormessage="ariaErrormessage"
        :aria-required="ariaRequired"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
</template>
