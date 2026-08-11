<script setup lang="ts">
import { computed, ref, type ConcreteComponent, type Component } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Eye, EyeOff, X } from '@lucide/vue'
import { useSlots } from 'vue'
import { cn } from '@/lib/utils'
import { inputVariants, inputContainerVariants } from './input-variants'
import { useClearable } from '@/composables/useClearable'
import { useLocale } from '@/composables/useLocale'

type InputVariantProps = VariantProps<typeof inputContainerVariants>

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
    /** 最大长度 */
    maxlength?: number
    /** 自动填充提示（浏览器密码管理器识别，如 email / current-password） */
    autocomplete?: string
    /** 显示清除按钮 */
    clearable?: boolean
    /** 密码显隐切换按钮 */
    showPassword?: boolean
    /** 字数统计（需配合 maxlength） */
    showWordLimit?: boolean
    /** 前缀图标 */
    prefixIcon?: ConcreteComponent | (() => Component)
    /** 后缀图标 */
    suffixIcon?: ConcreteComponent | (() => Component)
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

const props = withDefaults(defineProps<InputProps>(), {
    type: 'text',
    modelValue: undefined,
    variant: 'default',
    size: 'default',
    disabled: false,
    readonly: false,
    placeholder: undefined,
    maxlength: undefined,
    autocomplete: undefined,
    clearable: false,
    showPassword: false,
    showWordLimit: false,
    prefixIcon: undefined,
    suffixIcon: undefined,
    errorMessage: undefined,
    ariaLabel: undefined,
    ariaLabelledby: undefined,
    ariaDescribedby: undefined,
    ariaInvalid: undefined,
    ariaErrormessage: undefined,
    ariaRequired: undefined,
    class: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
    clear: []
}>()

const slots = useSlots()
const inputRef = ref<HTMLInputElement | null>(null)
const isComposing = ref(false)
// IME 组合结束兜底 emit 后，用于跳过浏览器随后触发的那次携带相同值的 input 事件，避免重复 emit
let skipNextInput = false
const passwordVisible = ref(false)

const { t } = useLocale()

const passwordToggleLabel = computed(() =>
    passwordVisible.value ? t('input.hidePassword') : t('input.showPassword')
)

// 使用 useClearable composable（readonly 与 disabled 同等对待：只读输入不可清除）
const { showClear, handleClear: handleClearEvent, onMouseEnter, onMouseLeave, onFocus, onBlur } = useClearable({
    modelValue: () => props.modelValue,
    clearable: () => props.clearable,
    disabled: () => props.disabled || props.readonly,
    onClear: () => {
        emit('update:modelValue', '')
        emit('clear')
    },
})

// 计算实际输入类型
const actualType = computed(() => {
    if (props.type !== 'password') return props.type
    return passwordVisible.value ? 'text' : 'password'
})

// 是否显示密码切换按钮（disabled/readonly 下隐藏，只读输入不可交互）
const showPasswordToggle = computed(() => {
    return props.type === 'password' && props.showPassword && !props.disabled && !props.readonly
})

// 是否显示字数统计
const showWordCount = computed(() => {
    return props.showWordLimit && props.maxlength !== undefined
})

// 当前字数
const currentLength = computed(() => {
    return props.modelValue?.length ?? 0
})

// clearable/showPassword 优先于 suffixIcon：后缀图标被隐藏时，padding 计算同步排除，避免右侧多余留白
const showSuffixIcon = computed(() => props.suffixIcon && !showClear.value && !showPasswordToggle.value)

const hasSuffix = computed(() => showSuffixIcon.value || showClear.value || showPasswordToggle.value)

// 容器样式
const inputContainerClasses = computed(() =>
    cn(
        inputContainerVariants({ variant: props.variant, size: props.size, disabled: props.disabled }),
        props.class,
    )
)

// 输入框样式
const inputClasses = computed(() =>
    cn(
        inputVariants(),
        props.readonly && 'cursor-default',
        props.prefixIcon ? 'pl-9' : 'pl-3',
        hasSuffix.value ? 'pr-9' : 'pr-3',
    )
)

// 切换密码可见性
function togglePasswordVisibility() {
    passwordVisible.value = !passwordVisible.value
}

// 清除处理
function handleClear(e: MouseEvent) {
    handleClearEvent(e)
}

// 输入处理：IME 组合期间不 emit；组合结束后浏览器再触发的 input 事件由 skipNextInput 拦截去重
function handleInput(event: Event) {
    if (isComposing.value || (event as InputEvent).isComposing) return
    if (skipNextInput) {
        // 跳过 compositionend 兜底 emit 之后那次携带相同值的重复 input
        skipNextInput = false
        return
    }
    emit('update:modelValue', (event.target as HTMLInputElement).value)
}

// IME 组合结束：复位组合状态并兜底 emit 最终值。
// 部分浏览器/输入法在 compositionend 之后不再触发携带最终值的 input 事件，此处兜底保证值不丢；
// 若随后仍触发 input，则由 skipNextInput 拦截去重
function handleCompositionEnd(event: CompositionEvent) {
    isComposing.value = false
    emit('update:modelValue', (event.target as HTMLInputElement).value)
    skipNextInput = true
}

// IME 组合取消（如按 Esc 取消组合）：复位组合状态，避免后续 input 事件被永久忽略；
// 取消时无最终值，不触发兜底 emit，skipNextInput 保持 false 以确保后续 input 正常 emit
function handleCompositionCancel() {
    isComposing.value = false
}

defineExpose({
    ref: inputRef,
    focus: () => inputRef.value?.focus(),
    blur: () => inputRef.value?.blur(),
    select: () => inputRef.value?.select(),
})
</script>

<template>
    <div class="w-full">
        <!-- 统一外层容器，承载圆角、阴影、交互及 Focus-within -->
        <div
            class="brutal-input-container"
            :class="inputContainerClasses"
            @mouseenter="onMouseEnter"
            @mouseleave="onMouseLeave"
            @focusin="onFocus"
            @focusout="onBlur"
        >
            <!-- 前置插槽：仅在存在时渲染，防止出现空灰色块 -->
            <div
                v-if="slots.prepend"
                class="flex items-center px-3 border-r-3 border-brutal bg-brutal-muted text-brutal-fg font-medium"
            >
                <slot name="prepend" />
            </div>

            <!-- 输入核心区 -->
            <div class="relative flex-1 h-full flex items-center">
                <!-- 前缀图标 -->
                <div
                    v-if="prefixIcon"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-brutal-placeholder pointer-events-none"
                >
                    <component :is="prefixIcon" class="h-4 w-4" />
                </div>

                <input
                    ref="inputRef"
                    :type="actualType"
                    :value="modelValue"
                    :disabled="disabled"
                    :readonly="readonly"
                    :placeholder="placeholder"
                    :maxlength="maxlength"
                    :autocomplete="autocomplete"
                    :class="inputClasses"
                    :aria-label="ariaLabel"
                    :aria-labelledby="ariaLabelledby"
                    :aria-describedby="ariaDescribedby"
                    :aria-invalid="ariaInvalid ?? (variant === 'error')"
                    :aria-errormessage="ariaErrormessage"
                    :aria-required="ariaRequired"
                    @compositionstart="isComposing = true"
                    @compositionend="handleCompositionEnd"
                    @compositioncancel="handleCompositionCancel"
                    @input="handleInput"
                >

                <!-- 后缀功能区 (清除 / 密码切换 / 后缀图标) -->
                <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                        v-if="showClear"
                        type="button"
                        class="p-0.5 hover:bg-brutal-muted rounded-brutal transition-colors"
                        :aria-label="t('input.clear')"
                        @click="handleClear"
                    >
                        <X class="h-3.5 w-3.5 text-brutal-placeholder" />
                    </button>
                    <button
                        v-if="showPasswordToggle"
                        type="button"
                        class="p-0.5 hover:bg-brutal-muted rounded-brutal transition-colors"
                        :aria-label="passwordToggleLabel"
                        @mousedown.prevent
                        @click="togglePasswordVisibility"
                    >
                        <Eye v-if="!passwordVisible" class="h-3.5 w-3.5 text-brutal-placeholder" />
                        <EyeOff v-else class="h-3.5 w-3.5 text-brutal-placeholder" />
                    </button>
                    <component
                        :is="suffixIcon"
                        v-if="showSuffixIcon"
                        class="h-4 w-4 text-brutal-placeholder"
                    />
                </div>
            </div>

            <!-- 后置插槽：仅在存在时渲染，防止出现空灰色块 -->
            <div
                v-if="slots.append"
                class="flex items-center px-3 border-l-3 border-brutal bg-brutal-muted text-brutal-fg font-medium"
            >
                <slot name="append" />
            </div>
        </div>

        <!-- 字数统计 -->
        <div
            v-if="showWordCount"
            class="flex justify-end mt-1"
        >
            <span class="text-xs text-brutal-placeholder">
                {{ currentLength }} / {{ maxlength }}
            </span>
        </div>

        <!-- 错误消息 -->
        <p
            v-if="variant === 'error' && errorMessage"
            class="text-sm text-brutal-destructive mt-1"
            role="alert"
        >
            {{ errorMessage }}
        </p>
    </div>
</template>
