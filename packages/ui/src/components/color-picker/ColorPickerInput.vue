<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { colorPickerInputVariants } from './color-picker-variants'
import { formatColor, isValidColor, parseColor } from '@/lib/color'

interface ColorPickerInputProps {
    modelValue?: string | null
    format?: 'hex' | 'rgb' | 'hsl'
    showAlpha?: boolean
    confirmOnBlur?: boolean
    disabled?: boolean
    ariaLabel?: string
}

const props = withDefaults(defineProps<ColorPickerInputProps>(), {
    modelValue: null,
    format: 'hex',
    showAlpha: false,
    confirmOnBlur: true,
    disabled: false,
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: string | null]
    confirm: [value: string | null]
}>()

const text = ref('')

function formatToProp(color: string): string | null {
    const hsv = parseColor(color)
    if (!hsv) return null
    return formatColor(hsv, props.format, props.showAlpha)
}

function syncFromModel() {
    text.value = props.modelValue ? formatToProp(props.modelValue) ?? '' : ''
}

// 内部更新后由父级回写同一值时跳过同步，避免把归一化结果强行覆盖回输入框导致光标跳动
let lastEmitted: string | null | undefined

watch(() => [props.modelValue, props.format, props.showAlpha] as const, ([val], previous) => {
    // 每次触发都先清空标记：父级回写同一值（val === lastEmitted）时跳过同步，
    // 外部写入时同步并清标记，避免残留旧值把后续恰好等于该旧值的外部写入误判为「自回写」
    const skip = val === lastEmitted && previous?.[1] === props.format && previous?.[2] === props.showAlpha
    lastEmitted = undefined
    if (skip) return
    syncFromModel()
}, { immediate: true })

const isInvalid = computed(() => text.value.length > 0 && !isValidColor(text.value))

const inputClasses = computed(() =>
    cn(
        colorPickerInputVariants(),
        isInvalid.value && 'border-brutal-destructive',
        props.disabled && 'opacity-50 pointer-events-none'
    )
)

// Enter 确认后抑制随后的原生 blur 重复 confirm；用户再次输入时重置
let suppressBlur = false

function handleInput(event: Event) {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return
    suppressBlur = false
    text.value = target.value
    if (target.value === '') {
        lastEmitted = null
        emit('update:modelValue', null)
    } else {
        const normalized = formatToProp(target.value)
        if (normalized === null) return
        lastEmitted = normalized
        emit('update:modelValue', normalized)
    }
}

function finishInput(confirm: boolean) {
    const normalized = text.value ? formatToProp(text.value) : null
    if (text.value && normalized === null) {
        syncFromModel()
        return
    }
    text.value = normalized ?? ''
    if (confirm) emit('confirm', normalized)
}

function handleBlur() {
    if (suppressBlur) {
        suppressBlur = false
        return
    }
    finishInput(props.confirmOnBlur)
}

function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault()
        // 先标记再确认：抑制随后由失焦触发的重复 confirm（同一输入只确认一次）
        suppressBlur = true
        finishInput(true)
    }
}
</script>

<template>
    <input
        type="text"
        :value="text"
        :aria-label="ariaLabel"
        :aria-invalid="isInvalid"
        :disabled="disabled"
        spellcheck="false"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @keydown="handleKeydown"
    >
</template>
