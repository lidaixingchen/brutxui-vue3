<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { type ColorPreset, DEFAULT_COLOR_PRESETS } from '@/lib/default-presets'
import { HSV_PERCENT_PRECISION, HUE_DEGREES, HSV_COMPONENT_MAX, ALPHA_PRECISION } from '@/lib/defaults'
import {
    type ColorFormat,
    type HSVColor,
    formatColor,
    hsvToHex,
    hsvToHexAlpha,
    hsvToRgb,
    isValidColor,
    normalizeColor,
    parseColor,
} from '@/lib/color'
import { useLocale } from '@/composables/useLocale'
import { useColorHistory } from '@/composables/useColorHistory'
import { colorPickerPanelVariants } from './color-picker-variants'
import ColorPickerSwatch from './ColorPickerSwatch.vue'
import ColorPickerInput from './ColorPickerInput.vue'
import ColorPickerHistory from './ColorPickerHistory.vue'
import Button from '../button/Button.vue'
import { type ColorPickerSize, normalizePresets } from './types'

interface ColorPickerPanelProps {
    modelValue?: string | null
    format?: ColorFormat
    showAlpha?: boolean
    presets?: string[] | ColorPreset[]
    showPresets?: boolean
    presetsLabel?: string
    showHistory?: boolean
    historyMax?: number
    historyStorageKey?: string
    showInput?: boolean
    clearable?: boolean
    size?: ColorPickerSize
}

const props = withDefaults(defineProps<ColorPickerPanelProps>(), {
    modelValue: null,
    format: 'hex',
    showAlpha: false,
    presets: () => DEFAULT_COLOR_PRESETS,
    showPresets: true,
    presetsLabel: undefined,
    showHistory: true,
    historyMax: 8,
    historyStorageKey: undefined,
    showInput: true,
    clearable: true,
    size: 'default',
})

const emit = defineEmits<{
    'update:modelValue': [value: string | null]
    confirm: [value: string | null]
    clear: []
}>()

const { t } = useLocale()

const resolvedPresetsLabel = computed(() => props.presetsLabel ?? t('colorPicker.presets'))
const resolvedHistoryLabel = computed(() => t('colorPicker.history'))
const resolvedClearHistoryLabel = computed(() => t('colorPicker.clearHistory'))
const resolvedClearLabel = computed(() => t('colorPicker.clear'))
const resolvedConfirmLabel = computed(() => t('colorPicker.confirm'))

const normalizedPresets = computed(() => normalizePresets(props.presets))

const hsv = ref<HSVColor>({ h: 0, s: 100, v: 100, a: 1 })

function syncFromModel() {
    if (props.modelValue && isValidColor(props.modelValue)) {
        const parsed = parseColor(props.modelValue)
        if (parsed) {
            hsv.value = { ...parsed }
        }
    } else {
        hsv.value = { h: 0, s: 100, v: 100, a: 1 }
    }
}

watch(() => props.modelValue, syncFromModel, { immediate: true })

const formattedValue = computed(() => {
    if (!props.modelValue) return ''
    return formatColor(hsv.value, props.format, props.showAlpha)
})

const hexPreview = computed(() => {
    if (!props.modelValue) return ''
    return props.showAlpha ? hsvToHexAlpha(hsv.value) : hsvToHex(hsv.value)
})

function emitUpdate() {
    const value = formatColor(hsv.value, props.format, props.showAlpha)
    emit('update:modelValue', value)
}

const { history, addToHistory, clearHistory } = useColorHistory({
    storageKey: props.historyStorageKey,
    maxItems: props.historyMax,
})

const svPadEl = ref<HTMLDivElement | null>(null)
const hueSliderEl = ref<HTMLDivElement | null>(null)
const alphaSliderEl = ref<HTMLDivElement | null>(null)
const dragging = ref<'sv' | 'hue' | 'alpha' | null>(null)

function updateFromPointer(target: 'sv' | 'hue' | 'alpha', event: PointerEvent) {
    const el = target === 'sv' ? svPadEl.value : target === 'hue' ? hueSliderEl.value : alphaSliderEl.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    if (target === 'sv') {
        hsv.value = {
            ...hsv.value,
            s: Math.round((x / rect.width) * HSV_PERCENT_PRECISION) / (HSV_PERCENT_PRECISION / HSV_COMPONENT_MAX),
            v: Math.round((1 - y / rect.height) * HSV_PERCENT_PRECISION) / (HSV_PERCENT_PRECISION / HSV_COMPONENT_MAX),
        }
    } else if (target === 'hue') {
        hsv.value = { ...hsv.value, h: Math.round((x / rect.width) * HUE_DEGREES) }
    } else {
        hsv.value = { ...hsv.value, a: Math.round((x / rect.width) * ALPHA_PRECISION) / ALPHA_PRECISION }
    }
    emitUpdate()
}

function handlePointerDown(target: 'sv' | 'hue' | 'alpha', event: PointerEvent) {
    event.preventDefault()
    dragging.value = target
    const el = event.currentTarget
    if (!(el instanceof HTMLElement)) return
    el.setPointerCapture(event.pointerId)
    updateFromPointer(target, event)
}

function handlePointerMove(event: PointerEvent) {
    if (!dragging.value) return
    updateFromPointer(dragging.value, event)
}

function handlePointerUp(event: PointerEvent) {
    if (!dragging.value) return
    const target = dragging.value
    dragging.value = null
    const el = event.currentTarget
    if (el instanceof HTMLElement) {
        try {
            el.releasePointerCapture(event.pointerId)
        } catch {
            // pointer already released
        }
    }
    if (target === 'sv' || target === 'hue' || target === 'alpha') {
        confirmSelection()
    }
}

function confirmSelection() {
    const value = formatColor(hsv.value, props.format, props.showAlpha)
    emit('confirm', value)
    if (value && isValidColor(value)) {
        addToHistory(value)
    }
}

const svBackground = computed(() => {
    const hue = hsv.value.h
    return `hsl(${hue}, 100%, 50%)`
})

const hueThumbStyle = computed(() => ({
    left: `${(hsv.value.h / 360) * 100}%`,
}))

const alphaThumbStyle = computed(() => ({
    left: `${hsv.value.a * 100}%`,
}))

const svThumbStyle = computed(() => ({
    left: `${hsv.value.s}%`,
    top: `${100 - hsv.value.v}%`,
}))

const alphaTrackBackground = computed(() => {
    const rgb = hsvToRgb(hsv.value)
    const solid = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    const transparent = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`
    return `linear-gradient(to right, ${transparent}, ${solid})`
})

const previewStyle = computed(() => ({
    backgroundColor: props.modelValue ?? 'transparent',
}))

const swatchSize = computed<ColorPickerSize>(() => (props.size === 'lg' ? 'default' : 'sm'))

function handlePresetSelect(value: string) {
    const parsed = parseColor(value)
    if (parsed) {
        hsv.value = { ...parsed }
        emitUpdate()
        confirmSelection()
    }
}

function handleInputUpdate(value: string | null) {
    if (value === null) return
    const parsed = parseColor(value)
    if (parsed) {
        hsv.value = { ...parsed }
        emit('update:modelValue', formatColor(hsv.value, props.format, props.showAlpha))
    }
}

function handleInputConfirm(value: string | null) {
    if (value) {
        emit('confirm', value)
        addToHistory(value)
    } else {
        emit('confirm', null)
    }
}

function handleConfirm() {
    confirmSelection()
}

function handleClear() {
    emit('clear')
    emit('update:modelValue', null)
    emit('confirm', null)
}

const panelClasses = computed(() => cn(colorPickerPanelVariants()))

function handleKeydownHue(event: KeyboardEvent) {
    const step = event.shiftKey ? 15 : 1
    let next = hsv.value.h
    if (event.key === 'ArrowLeft') next -= step
    else if (event.key === 'ArrowRight') next += step
    else return
    event.preventDefault()
    hsv.value = { ...hsv.value, h: ((next % 360) + 360) % 360 }
    emitUpdate()
}

function handleKeydownSv(event: KeyboardEvent) {
    const step = event.shiftKey ? 10 : 1
    let s = hsv.value.s
    let v = hsv.value.v
    if (event.key === 'ArrowLeft') s = Math.max(0, s - step)
    else if (event.key === 'ArrowRight') s = Math.min(100, s + step)
    else if (event.key === 'ArrowUp') v = Math.min(100, v + step)
    else if (event.key === 'ArrowDown') v = Math.max(0, v - step)
    else return
    event.preventDefault()
    hsv.value = { ...hsv.value, s, v }
    emitUpdate()
}

function handleKeydownAlpha(event: KeyboardEvent) {
    const step = event.shiftKey ? 0.1 : 0.01
    let a = hsv.value.a
    if (event.key === 'ArrowLeft') a = Math.max(0, a - step)
    else if (event.key === 'ArrowRight') a = Math.min(1, a + step)
    else return
    event.preventDefault()
    hsv.value = { ...hsv.value, a: Math.round(a * 100) / 100 }
    emitUpdate()
}

const normalizedModelValue = computed(() => (props.modelValue ? normalizeColor(props.modelValue) : null))
</script>

<template>
    <div :class="panelClasses" role="dialog" aria-modal="true" :aria-label="t('colorPicker.placeholder')">
        <div
            ref="svPadEl"
            role="slider"
            tabindex="0"
            :aria-label="t('colorPicker.saturation')"
            :aria-valuenow="Math.round(hsv.s)"
            aria-valuemin="0"
            aria-valuemax="100"
            class="relative w-full h-32 border-3 border-brutal cursor-crosshair overflow-hidden"
            :style="{ backgroundColor: svBackground }"
            @pointerdown="handlePointerDown('sv', $event)"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @keydown="handleKeydownSv"
        >
            <div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(to right, #fff, rgba(255,255,255,0))" />
            <div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(to top, #000, rgba(0,0,0,0))" />
            <div
                class="absolute w-3 h-3 border-2 border-brutal rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                :style="{ ...svThumbStyle, backgroundColor: hexPreview || '#fff' }"
            />
        </div>

        <div class="mt-3 space-y-2">
            <div
                ref="hueSliderEl"
                role="slider"
                tabindex="0"
                :aria-label="t('colorPicker.hue')"
                :aria-valuenow="hsv.h"
                aria-valuemin="0"
                aria-valuemax="360"
                class="relative h-4 w-full border-3 border-brutal cursor-pointer"
                style="background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
                @pointerdown="handlePointerDown('hue', $event)"
                @pointermove="handlePointerMove"
                @pointerup="handlePointerUp"
                @keydown="handleKeydownHue"
            >
                <div
                    class="absolute top-1/2 w-2 h-6 border-2 border-brutal bg-brutal-bg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    :style="hueThumbStyle"
                />
            </div>

            <div
                v-if="showAlpha"
                ref="alphaSliderEl"
                role="slider"
                tabindex="0"
                :aria-label="t('colorPicker.alpha')"
                :aria-valuenow="Math.round(hsv.a * 100)"
                aria-valuemin="0"
                aria-valuemax="100"
                class="relative h-4 w-full border-3 border-brutal cursor-pointer"
                :style="{ background: alphaTrackBackground }"
                @pointerdown="handlePointerDown('alpha', $event)"
                @pointermove="handlePointerMove"
                @pointerup="handlePointerUp"
                @keydown="handleKeydownAlpha"
            >
                <div
                    class="absolute top-1/2 w-2 h-6 border-2 border-brutal bg-brutal-bg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    :style="alphaThumbStyle"
                />
            </div>
        </div>

        <div class="mt-3 flex items-center gap-2">
            <div
                class="w-10 h-10 border-3 border-brutal shrink-0"
                :class="!modelValue && 'opacity-50'"
                :style="previewStyle"
            />
            <ColorPickerInput
                v-if="showInput"
                :model-value="formattedValue"
                :format="format"
                :show-alpha="showAlpha"
                :aria-label="t('colorPicker.hex')"
                @update:model-value="handleInputUpdate"
                @confirm="handleInputConfirm"
            />
        </div>

        <ColorPickerHistory
            v-if="showHistory"
            class="mt-3"
            :history="history"
            :model-value="normalizedModelValue"
            :size="swatchSize"
            :aria-label="resolvedHistoryLabel"
            :clear-label="resolvedClearHistoryLabel"
            @select="handlePresetSelect"
            @clear="clearHistory"
        />

        <div v-if="showPresets && normalizedPresets.length > 0" class="mt-3">
            <span class="block text-xs font-bold uppercase tracking-tight text-brutal-fg mb-2">
                {{ resolvedPresetsLabel }}
            </span>
            <div role="listbox" :aria-label="resolvedPresetsLabel" class="flex flex-wrap gap-1.5">
                <ColorPickerSwatch
                    v-for="preset in normalizedPresets"
                    :key="preset.value"
                    :value="preset.value"
                    :label="preset.label"
                    :disabled="preset.disabled"
                    :size="swatchSize"
                    :selected="preset.value === normalizedModelValue"
                    @select="handlePresetSelect"
                />
            </div>
        </div>

        <div v-if="clearable || showInput" class="mt-3 flex items-center justify-end gap-2">
            <Button
                v-if="clearable"
                variant="default"
                size="sm"
                type="button"
                @click="handleClear"
            >
                {{ resolvedClearLabel }}
            </Button>
            <Button
                variant="primary"
                size="sm"
                type="button"
                @click="handleConfirm"
            >
                {{ resolvedConfirmLabel }}
            </Button>
        </div>
    </div>
</template>
