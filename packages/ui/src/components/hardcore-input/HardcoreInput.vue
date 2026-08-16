<script setup lang="ts">
import { ref, computed, toRef, inject, onBeforeUnmount, useId } from 'vue'
import { cn } from '@/lib/utils'
import { useAudioEngine } from '@/composables/useAudioEngine'
import { useFormFieldValidation } from '@/composables/useFormFieldValidation'
import { useLocale } from '@/composables/useLocale'
import { HARDCORE_INPUT_SHAKE_DELAY_MS, HARDCORE_INPUT_SHAKE_ANIMATION_MS } from '@/lib/defaults'
import { hardcoreInputVariants, hardcoreInputFaceVariants } from './hardcore-input-variants'
import { formFieldKey, type FormFieldContext } from '../form/form-context'

interface HardcoreInputProps {
    modelValue?: string
    sound?: boolean
    rules?: Array<(val: string) => boolean | string>
    shakeOnError?: boolean
    type?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    validateOn?: 'input' | 'blur' | 'submit'
    class?: string
}

const props = withDefaults(defineProps<HardcoreInputProps>(), {
    modelValue: undefined,
    sound: true,
    rules: () => [],
    shakeOnError: true,
    type: 'text',
    placeholder: undefined,
    disabled: false,
    readonly: false,
    validateOn: 'blur',
    class: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'validation-change': [state: 'default' | 'success' | 'error', message?: string]
}>()

const errorId = `input-error-${useId().replace(/:/g, '-')}`

const triggerShake = ref(false)
const shakeTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined)
// 兜底复位定时器独立保存：连续触发 error 时先清除旧定时器，避免旧定时器
// 在新动画播放期间把 triggerShake 提前置回 false 截断动画；卸载时一并清理
const shakeResetTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined)
const isComposing = ref(false)
// IME 组合结束兜底 emit 后，用于跳过浏览器随后触发的那次携带相同值的 input 事件，避免重复 emit
let skipNextInput = false

const audioEngine = useAudioEngine(toRef(props, 'sound'))
const { t } = useLocale()

const formField = inject<FormFieldContext | null>(formFieldKey, null)

const { validationState, errorMessage, validate: validateField } = useFormFieldValidation<string>({
    rules: () => props.rules,
    validateOn: () => props.validateOn,
    defaultErrorMessage: () => t('hardcoreInput.invalidInput'),
})

onBeforeUnmount(() => {
    if (shakeTimer.value) clearTimeout(shakeTimer.value)
    if (shakeResetTimer.value) clearTimeout(shakeResetTimer.value)
})

const validate = (value: string): boolean => {
    const rulesEmpty = props.rules.length === 0
    const prevState = validationState.value
    const prevErrorMessage = errorMessage.value
    const result = validateField(value)

    if (rulesEmpty) {
        formField?.setError(undefined)
        if (prevState !== 'default' && validationState.value === 'default') {
            emit('validation-change', 'default')
        }
        return result
    }

    if (prevState !== validationState.value) {
        if (validationState.value === 'error') {
            audioEngine.playSound('fail')
        } else if (validationState.value === 'success') {
            audioEngine.playSound('success')
        }
    }

    if (validationState.value === 'error' && props.shakeOnError) {
        if (shakeTimer.value) clearTimeout(shakeTimer.value)
        if (shakeResetTimer.value) clearTimeout(shakeResetTimer.value)
        triggerShake.value = false
        shakeTimer.value = setTimeout(() => {
            shakeTimer.value = undefined
            triggerShake.value = true
            // 兜底复位：animationend/animationcancel 可能不触发
            // （prefers-reduced-motion 下动画被禁用、类被中断移除等），
            // 与 CSS 中 animate-shake 的 0.35s 动画时长对齐
            shakeResetTimer.value = setTimeout(() => {
                shakeResetTimer.value = undefined
                triggerShake.value = false
            }, HARDCORE_INPUT_SHAKE_ANIMATION_MS)
        }, HARDCORE_INPUT_SHAKE_DELAY_MS)
    } else {
        // 非 error（或未启用 shake）：立即复位，避免动画类残留
        if (shakeTimer.value) {
            clearTimeout(shakeTimer.value)
            shakeTimer.value = undefined
        }
        if (shakeResetTimer.value) {
            clearTimeout(shakeResetTimer.value)
            shakeResetTimer.value = undefined
        }
        triggerShake.value = false
    }

    if (formField) {
        formField.setError(validationState.value === 'error' ? errorMessage.value : undefined)
    }

    // 状态迁移或 error 文案变化时发射（与 useFormFieldValidation 的 onValidationChange 语义一致：
    // 连续失败但失败规则变化时也要通知，避免外部展示过期错误文案），避免每次输入重复通知
    if (
        prevState !== validationState.value ||
        (validationState.value === 'error' && errorMessage.value !== prevErrorMessage)
    ) {
        if (validationState.value === 'error') {
            emit('validation-change', 'error', errorMessage.value)
        } else if (validationState.value === 'success') {
            emit('validation-change', 'success')
        }
    }

    return result
}

const onInput = (e: Event) => {
    const target = e.target
    if (!(target instanceof HTMLInputElement)) return
    if (isComposing.value || (e as InputEvent).isComposing) return
    if (skipNextInput) {
        // 跳过 compositionend 兜底 emit 之后那次携带相同值的重复 input
        skipNextInput = false
        return
    }
    emit('update:modelValue', target.value)

    if (formField) {
        formField.setValue(target.value)
    }

    audioEngine.playSound('type')

    if (props.validateOn === 'input') {
        validate(target.value)
    }
}

// IME 组合结束：复位组合状态并兜底 emit 最终值。
// 部分浏览器/输入法在 compositionend 之后不再触发携带最终值的 input 事件，此处兜底保证值不丢；
// 若随后仍触发 input，则由 skipNextInput 拦截去重
const onCompositionEnd = (e: CompositionEvent) => {
    const target = e.target
    if (!(target instanceof HTMLInputElement)) return
    isComposing.value = false
    emit('update:modelValue', target.value)
    skipNextInput = true

    if (formField) {
        formField.setValue(target.value)
    }

    if (props.validateOn === 'input') {
        validate(target.value)
    }
}

// IME 组合取消（如按 Esc 取消组合）：复位组合状态，避免后续 input 事件被永久忽略；
// 取消时无最终值，不触发兜底 emit，skipNextInput 保持 false 以确保后续 input 正常 emit
const onCompositionCancel = () => {
    isComposing.value = false
}

const onBlur = () => {
    if (props.validateOn === 'blur') {
        validate(props.modelValue ?? '')
    }
}

const onAnimationEnd = () => {
    triggerShake.value = false
}

const onAnimationCancel = () => {
    triggerShake.value = false
}

const triggerValidate = (): boolean => {
    // 触发校验前同步表单上下文（vee-validate）中的值，
    // 避免父组件编程式更新 modelValue 后表单保存的值滞后
    if (formField) {
        formField.setValue(props.modelValue ?? '')
    }
    return validate(props.modelValue ?? '')
}

defineExpose({
    validate: triggerValidate,
    validationState,
    errorMessage,
})

const containerClasses = computed(() =>
    cn('relative w-full flex flex-col gap-1.5', props.class)
)

const inputClasses = computed(() =>
    cn(
        hardcoreInputVariants({ variant: validationState.value }),
        triggerShake.value ? 'animate-shake' : ''
    )
)

const faceClasses = computed(() =>
    cn(
        hardcoreInputFaceVariants({ variant: validationState.value }),
        // 动画类依赖组件内 scoped 关键帧（animate-bounce-short），在此应用
        validationState.value === 'error' ? 'animate-bounce-short' : ''
    )
)
</script>

<template>
    <div :class="containerClasses">
        <div class="relative flex items-center w-full">
            <input
                :type="type"
                :value="modelValue"
                :disabled="disabled"
                :readonly="readonly"
                :placeholder="placeholder"
                :class="inputClasses"
                :aria-invalid="validationState === 'error'"
                :aria-describedby="errorMessage ? errorId : undefined"
                @input="onInput"
                @blur="onBlur"
                @animationend="onAnimationEnd"
                @animationcancel="onAnimationCancel"
                @compositionstart="isComposing = true"
                @compositionend="onCompositionEnd"
                @compositioncancel="onCompositionCancel"
            >
            
            <!-- 右侧校验反馈表情 -->
            <div class="absolute right-3 flex items-center z-10 pointer-events-none select-none">
                <slot>
                    <div v-if="validationState !== 'default'" :class="faceClasses">
                        <!-- 成功 (😎) SVG -->
                        <svg v-if="validationState === 'success'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <circle cx="12" cy="12" r="10" fill="var(--brutal-accent)" stroke="currentColor" stroke-width="2.5" />
                            <!-- 墨镜 -->
                            <rect x="6" y="8" width="5" height="4" rx="1.5" fill="currentColor" stroke="currentColor" stroke-width="1" />
                            <rect x="13" y="8" width="5" height="4" rx="1.5" fill="currentColor" stroke="currentColor" stroke-width="1" />
                            <line x1="11" y1="10" x2="13" y2="10" stroke="currentColor" stroke-width="2" />
                            <!-- 微笑嘴巴 -->
                            <path d="M8 15 Q12 19 16 15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
                        </svg>
                        
                        <!-- 错误 (😠) SVG -->
                        <svg v-if="validationState === 'error'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <circle cx="12" cy="12" r="10" fill="var(--brutal-destructive)" stroke="currentColor" stroke-width="2.5" />
                            <!-- 倒八字愤怒眉毛 -->
                            <line x1="6" y1="8" x2="10" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                            <line x1="18" y1="8" x2="14" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                            <!-- 怒气眼睛 -->
                            <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                            <circle cx="16" cy="12" r="1.5" fill="currentColor" />
                            <!-- 嘟起向下的嘴巴 -->
                            <path d="M9 17 Q12 14 15 17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
                        </svg>
                    </div>
                </slot>
            </div>
        </div>
        
        <!-- 错误校验提示文案 -->
        <p
            v-if="validationState === 'error' && errorMessage"
            :id="errorId"
            class="text-xs font-black tracking-wide text-brutal-destructive animate-fade-in"
            aria-live="polite"
        >
            {{ errorMessage }}
        </p>
    </div>
</template>

<style scoped>
@keyframes input-shake {
    0%, 100% { transform: translateX(0); }
    15%, 45%, 75% { transform: translateX(-6px); }
    30%, 60%, 90% { transform: translateX(6px); }
}

:deep(.animate-shake) {
    animation: input-shake 0.35s ease-in-out;
}

@keyframes bounce-short {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
}

:deep(.animate-bounce-short) {
    animation: bounce-short 0.4s ease-in-out 2;
}

@keyframes fade-in {
    from { opacity: 0; transform: translateY(-2px); }
    to { opacity: 1; transform: translateY(0); }
}

:deep(.animate-fade-in) {
    animation: fade-in 0.2s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
    :deep(.animate-shake),
    :deep(.animate-bounce-short),
    :deep(.animate-fade-in) {
        animation: none !important;
        transform: none !important;
    }
}
</style>
