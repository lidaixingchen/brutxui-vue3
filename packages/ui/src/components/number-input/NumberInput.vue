<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, useId, watch } from 'vue'
import {
    NumberFieldRoot,
    type NumberFieldRootProps,
    type NumberFieldRootEmits,
    NumberFieldInput,
    NumberFieldIncrement,
    NumberFieldDecrement,
    VisuallyHidden,
    useLocale as useRekaLocale,
    useForwardProps
} from 'reka-ui'
import { Plus, Minus, ChevronUp, ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useNativeFormReset, vNativeFormValue } from '@/lib/native-form-reset'
import { brutalDestructiveTextClasses } from '@/lib/semantic-text-variants'
import { numberInputRootVariants, numberInputButtonVariants, numberInputFieldVariants } from './number-input-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { useBrutalHaptics } from '@/composables/useBrutalHaptics'
import { useReducedMotion } from '@/composables/useReducedMotion'

interface NumberInputProps extends NumberFieldRootProps {
    layout?: 'split' | 'stacked'
    variant?: 'default' | 'error' | 'success'
    errorMessage?: string
    placeholder?: string
    ariaLabel?: string
    ariaLabelledby?: string
    class?: string
    iconSize?: IconSize
    /** 显式开启步进按键的机械 click 音效；默认静音 */
    sound?: boolean
}

const props = withDefaults(defineProps<NumberInputProps>(), {
    layout: 'split',
    variant: 'default',
    errorMessage: undefined,
    placeholder: undefined,
    ariaLabel: undefined,
    ariaLabelledby: undefined,
    class: undefined,
    iconSize: 'md',
    sound: false,
})

defineOptions({ inheritAttrs: false })

const emit = defineEmits<NumberFieldRootEmits>()

const { value: currentValue, resetValue, updateValue, bindFormReset, resetting } = useNativeFormReset(
    () => props.modelValue,
    props.defaultValue ?? null,
    () => { restoreText.value = true },
)
// 重置时显示已提交的格式化文本，随后由原语继续处理下一次输入。
const restoreText = ref(false)
const locale = useRekaLocale(toRef(props, 'locale'))
const resetText = computed(() => resetValue.value === null || Number.isNaN(resetValue.value)
    ? ''
    : new Intl.NumberFormat(locale.value, props.formatOptions).format(resetValue.value))

function onUserUpdate(value: number) {
    updateValue(value ?? null)
    emit('update:modelValue', value)
}

const { t } = useLocale()

const haptics = useBrutalHaptics({ sound: () => props.sound })
const prefersReducedMotion = useReducedMotion()

/** Drum Ticker：数值变化时输入框做滚轮翻页微动效（reduced-motion 环境瞬时切换）。
    animationend 兜底定时器：动画被 reduced-motion 切换/元素隐藏等场景中断时，
    animationend 永不触发会导致类残留并使后续变化无法重启动画 */
const isDrumming = ref(false)
let drumResetTimer: ReturnType<typeof setTimeout> | null = null
watch(() => props.modelValue, () => {
    if (prefersReducedMotion.value) return
    isDrumming.value = true
    if (drumResetTimer !== null) clearTimeout(drumResetTimer)
    drumResetTimer = setTimeout(() => { isDrumming.value = false }, 200)
})

onBeforeUnmount(() => {
    if (drumResetTimer !== null) clearTimeout(drumResetTimer)
})

const resolvedPlaceholder = computed(() => props.placeholder ?? t('numberInput.placeholder'))

const errorId = useId()
const errorTextId = computed(() =>
    props.variant === 'error' && props.errorMessage ? `number-input-error-${errorId}` : undefined
)
const errorMessageClasses = computed(() => cn('text-sm mt-1', brutalDestructiveTextClasses))

const DELEGATED_OMIT_KEYS = new Set([
    'class',
    'layout',
    'variant',
    'errorMessage',
    'placeholder',
    'ariaLabel',
    'ariaLabelledby',
    'iconSize',
    'sound',
    'modelValue',
    'defaultValue',
    'name',
])

const delegatedProps = computed(() => {
    const entries = Object.entries(props).filter(([key]) => !DELEGATED_OMIT_KEYS.has(key))
    return Object.fromEntries(entries) as Partial<NumberFieldRootProps>
})

const forwarded = useForwardProps(delegatedProps)

const containerClasses = computed(() =>
    cn(numberInputRootVariants({ layout: props.layout, variant: props.variant }), props.class)
)

const decrementClasses = computed(() =>
    cn(numberInputButtonVariants({ position: 'decrement', layout: props.layout }))
)

const incrementClasses = computed(() =>
    cn(numberInputButtonVariants({ position: 'increment', layout: props.layout }))
)

const fieldClasses = computed(() =>
    cn(
        numberInputFieldVariants({ layout: props.layout }),
        isDrumming.value && 'animate-brutal-drum',
    )
)

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <div class="@container/number-input w-full min-w-0">
        <NumberFieldRoot
            v-slot="{ textValue }"
            v-bind="forwarded"
            :model-value="currentValue"
            :class="containerClasses"
            @update:model-value="onUserUpdate"
        >
            <template v-if="layout === 'split'">
                <NumberFieldDecrement
                    :class="decrementClasses"
                    :aria-label="t('numberInput.decrease')"
                    @click="haptics.click()"
                >
                    <Minus :class="iconClasses" />
                </NumberFieldDecrement>

                <NumberFieldInput
                    v-native-form-value="{ current: textValue, initial: resetText, preserveCurrent: true }"
                    v-bind="restoreText ? { ...$attrs, value: textValue } : $attrs"
                    :placeholder="resolvedPlaceholder"
                    :aria-label="ariaLabelledby ? undefined : ariaLabel"
                    :aria-labelledby="ariaLabelledby"
                    :aria-invalid="variant === 'error' ? true : $attrs['aria-invalid']"
                    :aria-describedby="errorMessage ? [errorTextId, $attrs['aria-describedby']].filter(Boolean).join(' ') : $attrs['aria-describedby']"
                    :class="fieldClasses"
                    @animationend="isDrumming = false"
                    @input="restoreText = false"
                    @vue:mounted="bindFormReset"
                    @vue:updated="bindFormReset"
                />

                <NumberFieldIncrement
                    :class="incrementClasses"
                    :aria-label="t('numberInput.increase')"
                    @click="haptics.click()"
                >
                    <Plus :class="iconClasses" />
                </NumberFieldIncrement>
            </template>

            <template v-else>
                <NumberFieldInput
                    v-native-form-value="{ current: textValue, initial: resetText, preserveCurrent: true }"
                    v-bind="restoreText ? { ...$attrs, value: textValue } : $attrs"
                    :placeholder="resolvedPlaceholder"
                    :aria-label="ariaLabelledby ? undefined : ariaLabel"
                    :aria-labelledby="ariaLabelledby"
                    :aria-invalid="variant === 'error' ? true : $attrs['aria-invalid']"
                    :aria-describedby="errorMessage ? [errorTextId, $attrs['aria-describedby']].filter(Boolean).join(' ') : $attrs['aria-describedby']"
                    :class="fieldClasses"
                    @animationend="isDrumming = false"
                    @input="restoreText = false"
                    @vue:mounted="bindFormReset"
                    @vue:updated="bindFormReset"
                />

                <div class="flex flex-col border-l-3 border-brutal w-10 shrink-0">
                    <NumberFieldIncrement
                        :class="incrementClasses"
                        :aria-label="t('numberInput.increase')"
                        @click="haptics.click()"
                    >
                        <ChevronUp :class="iconClasses" />
                    </NumberFieldIncrement>
                    <NumberFieldDecrement
                        :class="decrementClasses"
                        :aria-label="t('numberInput.decrease')"
                        @click="haptics.click()"
                    >
                        <ChevronDown :class="iconClasses" />
                    </NumberFieldDecrement>
                </div>
            </template>
            <VisuallyHidden
                v-if="name"
                v-native-form-value="{
                    current: String(currentValue ?? ''),
                    initial: String(resetValue ?? ''),
                    bubble: !resetting,
                }"
                as="input"
                feature="fully-hidden"
                type="text"
                :form="$attrs.form"
                :name="name"
                :value="currentValue"
                :disabled="disabled"
                :readonly="readonly"
                :required="required"
            />
        </NumberFieldRoot>
        <p
            v-if="variant === 'error' && errorMessage"
            :id="errorTextId"
            :class="errorMessageClasses"
            role="alert"
        >
            {{ errorMessage }}
        </p>
    </div>
</template>
