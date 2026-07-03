<script setup lang="ts">
import { computed, ref, type ConcreteComponent, type Component } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Eye, EyeOff, X } from '@lucide/vue'
import { useSlots } from 'vue'
import { cn } from '@/lib/utils'
import { inputVariants, inputContainerVariants } from './input-variants'
import { useClearable } from '@/composables/useClearable'

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
const passwordVisible = ref(false)

// 使用 useClearable composable
const { showClear, handleClear: handleClearEvent, onMouseEnter, onMouseLeave } = useClearable({
    modelValue: () => props.modelValue,
    clearable: () => props.clearable,
    disabled: () => props.disabled,
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

// 是否显示密码切换按钮
const showPasswordToggle = computed(() => {
    return props.type === 'password' && props.showPassword
})

// 是否显示字数统计
const showWordCount = computed(() => {
    return props.showWordLimit && props.maxlength !== undefined
})

// 当前字数
const currentLength = computed(() => {
    return props.modelValue?.length ?? 0
})

const hasSuffix = computed(() => props.suffixIcon || showClear.value || showPasswordToggle.value)

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
                    :class="inputClasses"
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

                <!-- 后缀功能区 (清除 / 密码切换 / 后缀图标) -->
                <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                        v-if="showClear"
                        type="button"
                        class="p-0.5 hover:bg-brutal-muted rounded-sm transition-colors"
                        @click="handleClear"
                    >
                        <X class="h-3.5 w-3.5 text-brutal-placeholder" />
                    </button>
                    <button
                        v-if="showPasswordToggle"
                        type="button"
                        class="p-0.5 hover:bg-brutal-muted rounded-sm transition-colors"
                        @click="togglePasswordVisibility"
                    >
                        <Eye v-if="!passwordVisible" class="h-3.5 w-3.5 text-brutal-placeholder" />
                        <EyeOff v-else class="h-3.5 w-3.5 text-brutal-placeholder" />
                    </button>
                    <component
                        :is="suffixIcon"
                        v-if="suffixIcon && !showClear && !showPasswordToggle"
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
