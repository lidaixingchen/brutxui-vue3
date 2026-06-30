<script setup lang="ts">
import { computed, ref } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { inputVariants } from './input-variants'

type InputVariantProps = VariantProps<typeof inputVariants>

type HTMLInputType =
    | 'button'
    | 'checkbox'
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'hidden'
    | 'image'
    | 'month'
    | 'number'
    | 'password'
    | 'radio'
    | 'range'
    | 'reset'
    | 'search'
    | 'submit'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week'

interface InputProps {
    type?: HTMLInputType
    modelValue?: string
    variant?: NonNullable<InputVariantProps['variant']>
    size?: NonNullable<InputVariantProps['size']>
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

const props = withDefaults(defineProps<InputProps>(), {
    type: 'text',
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

const isComposing = ref(false)

const classes = computed(() =>
    cn(
        inputVariants({ variant: props.variant, size: props.size }),
        props.readonly && 'cursor-default',
        props.class
    )
)
</script>

<template>
    <input
        :type="type"
        :value="modelValue"
        :disabled="disabled"
        :readonly="readonly"
        :placeholder="placeholder"
        :class="classes"
        :aria-label="ariaLabel"
        :aria-labelledby="ariaLabelledby"
        :aria-describedby="ariaDescribedby"
        :aria-invalid="ariaInvalid"
        :aria-errormessage="ariaErrormessage"
        :aria-required="ariaRequired"
        @compositionstart="isComposing = true"
        @compositionend="(e: CompositionEvent) => { isComposing = false; emit('update:modelValue', (e.target as HTMLInputElement).value) }"
        @input="!isComposing && emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
</template>
