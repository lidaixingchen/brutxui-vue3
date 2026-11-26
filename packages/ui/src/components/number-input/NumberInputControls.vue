<script setup lang="ts">
import { computed, defineComponent } from 'vue'
import { injectNumberFieldRootContext, NumberFieldRoot } from 'reka-ui'
import { clampNumber, getBoundedNumber, getSteppedNumber } from './number-input-range'

const props = withDefaults(defineProps<{
    step?: number
    stepSnapping?: boolean
    focusOnChange?: boolean
    editing: boolean
    locale: string
    formatOptions?: Intl.NumberFormatOptions
    readDraft: (apply: () => void) => number | undefined
}>(), {
    step: 1,
    stepSnapping: true,
    focusOnChange: true,
    formatOptions: undefined,
})

const emit = defineEmits<{
    commit: [value: number | null]
    restore: []
    stepClick: []
}>()

const context = injectNumberFieldRootContext()
const { applyInputValue, disableWheelChange } = context
const locked = computed(() => context.disabled.value || context.readonly.value)
const range = computed(() => ({
    min: context.min.value,
    max: context.max.value,
    step: props.step,
    snap: props.stepSnapping,
}))

const MAX_INTL_SIGNIFICANT_DIGITS = 21
const draftFormatOptions = computed<Intl.NumberFormatOptions>(() => ({
    ...props.formatOptions,
    notation: 'standard',
    signDisplay: 'auto',
    minimumSignificantDigits: 1,
    maximumSignificantDigits: MAX_INTL_SIGNIFICANT_DIGITS,
    roundingIncrement: 1,
    roundingPriority: 'auto',
    roundingMode: 'halfExpand',
}))

let applyRawDraft: ((text: string) => void) | undefined
let rawDraft: number | undefined
const DraftContext = defineComponent({
    inheritAttrs: false,
    setup() {
        applyRawDraft = injectNumberFieldRootContext().applyInputValue
        return () => null
    },
})

function readRawDraft(text: string) {
    rawDraft = undefined
    applyRawDraft?.(text)
    return rawDraft
}

function restoreText() {
    const input = context.inputEl.value
    if (input && input.value !== context.textValue.value) input.value = context.textValue.value
    emit('restore')
}

function parseDraft(text: string) {
    const value = props.readDraft(() => applyInputValue(text))
    return value === undefined ? undefined : clampNumber(value, range.value)
}

function stepValue(direction: 1 | -1, multiplier = 1) {
    if (locked.value) return
    const input = context.inputEl.value
    if (props.focusOnChange) input?.focus()
    const hasDraft = input && input.value !== context.textValue.value
    // 缩写等显示标记沿用当前格式的解析规则。
    const value = hasDraft ? readRawDraft(input.value) ?? parseDraft(input.value) : context.modelValue.value
    emit('commit', getSteppedNumber(value, direction * multiplier, range.value))
    if (hasDraft) restoreText()
}

function stepOnClick(event: MouseEvent, direction: 1 | -1) {
    // 指针按下和长按由 Reka 处理，键盘与辅助技术通过 click 激活。
    if (event.detail === 0) stepValue(direction)
    emit('stepClick')
}

context.applyInputValue = (text) => {
    if (locked.value || text === context.textValue.value) return
    const value = text === '' ? null : parseDraft(text)
    if (value !== undefined) emit('commit', value)
    restoreText()
}
context.handleIncrease = multiplier => stepValue(1, multiplier)
context.handleDecrease = multiplier => stepValue(-1, multiplier)
context.disableWheelChange = computed(() => locked.value || disableWheelChange.value)
context.handleMinMaxValue = (boundary) => {
    if (locked.value) return
    const value = range.value[boundary]
    if (value === undefined) return
    emit('commit', getBoundedNumber(value, range.value))
    restoreText()
}
context.isIncreaseDisabled = computed(() => !props.editing
    && getSteppedNumber(context.modelValue.value, 1, range.value) === context.modelValue.value)
context.isDecreaseDisabled = computed(() => !props.editing
    && getSteppedNumber(context.modelValue.value, -1, range.value) === context.modelValue.value)
</script>

<template>
    <!-- 使用同一套本地化解析规则读取步进起点，范围和步长随后统一应用。 -->
    <NumberFieldRoot
        :as="DraftContext"
        :locale="locale"
        :format-options="draftFormatOptions"
        :model-value="null"
        :step-snapping="false"
        @update:model-value="rawDraft = $event"
    />
    <slot :step-on-click="stepOnClick" />
</template>
