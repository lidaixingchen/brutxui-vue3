<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { colorPickerInputVariants } from './color-picker-variants'
import { formatColor, isValidColor, parseColor } from '@/lib/color'

interface ColorPickerInputProps {
    modelValue?: string | null
    format?: 'hex' | 'rgb' | 'hsl'
    showAlpha?: boolean
    disabled?: boolean
    ariaLabel?: string
}

const props = withDefaults(defineProps<ColorPickerInputProps>(), {
    modelValue: null,
    format: 'hex',
    showAlpha: false,
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
    if (props.modelValue && isValidColor(props.modelValue)) {
        text.value = formatToProp(props.modelValue) ?? ''
    } else {
        text.value = ''
    }
}

// 内部更新后由父级回写同一值时跳过同步，避免把归一化结果强行覆盖回输入框导致光标跳动
let lastEmitted: string | null | undefined

watch(() => props.modelValue, (val) => {
    if (val === lastEmitted) {
        lastEmitted = undefined
        return
    }
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
    } else if (isValidColor(target.value)) {
        const normalized = formatToProp(target.value)
        lastEmitted = normalized
        emit('update:modelValue', normalized)
    }
}

function doConfirm() {
    if (text.value && isValidColor(text.value)) {
        // isValidColor 已保证 parseColor 成功，formatToProp 恒非空；
        // null 分支不可达，防御性回退为原始文本
        const normalized = formatToProp(text.value) ?? text.value
        text.value = normalized
        emit('confirm', normalized)
    } else if (!text.value) {
        emit('confirm', null)
    } else {
        syncFromModel()
    }
}

function handleBlur() {
    if (suppressBlur) {
        suppressBlur = false
        return
    }
    doConfirm()
}

function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault()
        // 先标记再确认：抑制随后由失焦触发的重复 confirm（同一输入只确认一次）
        suppressBlur = true
        doConfirm()
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
