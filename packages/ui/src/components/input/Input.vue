<script setup lang="ts">
import { computed, ref, type ConcreteComponent, type Component } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Eye, EyeOff, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { inputVariants } from './input-variants'
import { useClearable } from '@/composables/useClearable'

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

// 计算是否有前置/后缀内容
const hasPrefix = computed(() => props.prefixIcon)
const hasSuffix = computed(() => props.suffixIcon || showClear.value || showPasswordToggle.value)

// 输入框样式
const inputClasses = computed(() =>
    cn(
        inputVariants({ variant: props.variant, size: props.size }),
        props.readonly && 'cursor-default',
        hasPrefix.value && 'pl-10',
        hasSuffix.value && 'pr-10',
        props.class,
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
        <!-- 前置插槽 -->
        <div
            v-if="$slots.prepend"
            class="flex items-stretch"
        >
            <div class="flex items-center px-3 border-3 border-r-0 rounded-l-brutal bg-brutal-muted text-brutal-fg font-medium">
                <slot name="prepend" />
            </div>
            <div
                class="relative flex-1"
                @mouseenter="onMouseEnter"
                @mouseleave="onMouseLeave"
            >
                <div
                    v-if="prefixIcon"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-brutal-placeholder"
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
                <!-- 后缀图标/清除按钮/密码切换 -->
                <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <!-- 清除按钮 -->
                    <button
                        v-if="showClear"
                        type="button"
                        class="p-0.5 hover:bg-brutal-muted rounded-sm transition-colors"
                        @click="handleClear"
                    >
                        <X class="h-3.5 w-3.5 text-brutal-placeholder" />
                    </button>
                    <!-- 密码切换按钮 -->
                    <button
                        v-if="showPasswordToggle"
                        type="button"
                        class="p-0.5 hover:bg-brutal-muted rounded-sm transition-colors"
                        @click="togglePasswordVisibility"
                    >
                        <Eye v-if="!passwordVisible" class="h-3.5 w-3.5 text-brutal-placeholder" />
                        <EyeOff v-else class="h-3.5 w-3.5 text-brutal-placeholder" />
                    </button>
                    <!-- 后缀图标 -->
                    <component
                        :is="suffixIcon"
                        v-if="suffixIcon && !showClear && !showPasswordToggle"
                        class="h-4 w-4 text-brutal-placeholder"
                    />
                </div>
            </div>
            <div class="flex items-center px-3 border-3 border-l-0 rounded-r-brutal bg-brutal-muted text-brutal-fg font-medium">
                <slot name="append" />
            </div>
        </div>

        <!-- 后置插槽 -->
        <div
            v-else-if="$slots.append"
            class="flex items-stretch"
        >
            <div
                class="relative flex-1"
                @mouseenter="onMouseEnter"
                @mouseleave="onMouseLeave"
            >
                <div
                    v-if="prefixIcon"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-brutal-placeholder"
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
                <!-- 后缀图标/清除按钮/密码切换 -->
                <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <!-- 清除按钮 -->
                    <button
                        v-if="showClear"
                        type="button"
                        class="p-0.5 hover:bg-brutal-muted rounded-sm transition-colors"
                        @click="handleClear"
                    >
                        <X class="h-3.5 w-3.5 text-brutal-placeholder" />
                    </button>
                    <!-- 密码切换按钮 -->
                    <button
                        v-if="showPasswordToggle"
                        type="button"
                        class="p-0.5 hover:bg-brutal-muted rounded-sm transition-colors"
                        @click="togglePasswordVisibility"
                    >
                        <Eye v-if="!passwordVisible" class="h-3.5 w-3.5 text-brutal-placeholder" />
                        <EyeOff v-else class="h-3.5 w-3.5 text-brutal-placeholder" />
                    </button>
                    <!-- 后缀图标 -->
                    <component
                        :is="suffixIcon"
                        v-if="suffixIcon && !showClear && !showPasswordToggle"
                        class="h-4 w-4 text-brutal-placeholder"
                    />
                </div>
            </div>
            <div class="flex items-center px-3 border-3 border-l-0 rounded-r-brutal bg-brutal-muted text-brutal-fg font-medium">
                <slot name="append" />
            </div>
        </div>

        <!-- 无前置/后置插槽 -->
        <div
            v-else
            class="relative"
            @mouseenter="onMouseEnter"
            @mouseleave="onMouseLeave"
        >
            <div
                v-if="prefixIcon"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-brutal-placeholder"
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
            <!-- 后缀图标/清除按钮/密码切换 -->
            <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <!-- 清除按钮 -->
                <button
                    v-if="showClear"
                    type="button"
                    class="p-0.5 hover:bg-brutal-muted rounded-sm transition-colors"
                    @click="handleClear"
                >
                    <X class="h-3.5 w-3.5 text-brutal-placeholder" />
                </button>
                <!-- 密码切换按钮 -->
                <button
                    v-if="showPasswordToggle"
                    type="button"
                    class="p-0.5 hover:bg-brutal-muted rounded-sm transition-colors"
                    @click="togglePasswordVisibility"
                >
                    <Eye v-if="!passwordVisible" class="h-3.5 w-3.5 text-brutal-placeholder" />
                    <EyeOff v-else class="h-3.5 w-3.5 text-brutal-placeholder" />
                </button>
                <!-- 后缀图标 -->
                <component
                    :is="suffixIcon"
                    v-if="suffixIcon && !showClear && !showPasswordToggle"
                    class="h-4 w-4 text-brutal-placeholder"
                />
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
            class="text-sm text-brutal-danger mt-1"
            role="alert"
        >
            {{ errorMessage }}
        </p>
    </div>
</template>
