<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { textareaVariants } from './textarea-variants'
import { useLocale } from '@/composables/useLocale'

type TextareaVariantProps = VariantProps<typeof textareaVariants>

interface TextareaProps {
    modelValue?: string
    variant?: NonNullable<TextareaVariantProps['variant']>
    size?: NonNullable<TextareaVariantProps['size']>
    resize?: NonNullable<TextareaVariantProps['resize']>
    disabled?: boolean
    readonly?: boolean
    placeholder?: string
    /** 错误消息 */
    errorMessage?: string
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
    resize: 'none',
    disabled: false,
    readonly: false,
    placeholder: undefined,
    errorMessage: undefined,
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
const defaultErrorId = useId()
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isComposing = ref(false)
// IME 组合结束兜底 emit 后，用于跳过浏览器随后触发的那次携带相同值的 input 事件，避免重复 emit
let skipNextInput = false

const hasError = computed(() => props.variant === 'error' && !!props.errorMessage)
const resolvedErrorId = computed(() => props.ariaErrormessage ?? defaultErrorId)
const resolvedAriaInvalid = computed(() => props.ariaInvalid ?? (hasError.value ? true : undefined))
const resolvedAriaErrormessage = computed(() => (hasError.value ? resolvedErrorId.value : props.ariaErrormessage))
const resolvedAriaDescribedby = computed(() => props.ariaDescribedby ?? (hasError.value ? resolvedErrorId.value : undefined))

const resolvedPlaceholder = computed(() => props.placeholder ?? t('textarea.placeholder'))

const classes = computed(() =>
    cn(
        textareaVariants({
            variant: props.variant,
            size: props.size,
            resize: props.resize,
        }),
        props.readonly && 'cursor-default',
        props.class
    )
)

defineExpose({
    ref: textareaRef,
    focus: () => textareaRef.value?.focus(),
    blur: () => textareaRef.value?.blur(),
    select: () => textareaRef.value?.select(),
})

// 输入处理：IME 组合期间不 emit；组合结束后浏览器再触发的 input 事件由 skipNextInput 拦截去重
function handleInput(event: Event) {
    if (isComposing.value || (event as InputEvent).isComposing) return
    if (skipNextInput) {
        // 跳过 compositionend 兜底 emit 之后那次携带相同值的重复 input
        skipNextInput = false
        return
    }
    emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

// IME 组合结束：复位组合状态并兜底 emit 最终值。
// 部分浏览器/输入法在 compositionend 之后不再触发携带最终值的 input 事件，此处兜底保证值不丢；
// 若随后仍触发 input，则由 skipNextInput 拦截去重
function handleCompositionEnd(event: CompositionEvent) {
    isComposing.value = false
    emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
    skipNextInput = true
}

// IME 组合取消（如按 Esc 取消组合）：复位组合状态，避免后续 input 事件被永久忽略；
// 取消时无最终值，不触发兜底 emit，skipNextInput 保持 false 以确保后续 input 正常 emit
function handleCompositionCancel() {
    isComposing.value = false
}
</script>

<template>
    <div class="w-full">
        <textarea
            ref="textareaRef"
            :value="modelValue"
            :disabled="disabled"
            :readonly="readonly"
            :placeholder="resolvedPlaceholder"
            :class="classes"
            :aria-label="ariaLabel"
            :aria-labelledby="ariaLabelledby"
            :aria-describedby="resolvedAriaDescribedby"
            :aria-invalid="resolvedAriaInvalid"
            :aria-errormessage="resolvedAriaErrormessage"
            :aria-required="ariaRequired"
            @compositionstart="isComposing = true"
            @compositionend="handleCompositionEnd"
            @compositioncancel="handleCompositionCancel"
            @input="handleInput"
        />
        <p
            v-if="hasError"
            :id="resolvedErrorId"
            class="text-sm font-bold text-brutal-destructive mt-1"
            role="alert"
        >
            {{ errorMessage }}
        </p>
    </div>
</template>
