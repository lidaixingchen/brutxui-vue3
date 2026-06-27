<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { ChevronDown, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { formatColor, parseColor } from '../../lib/color'
import { type ColorPreset } from '../../lib/default-presets'
import PopoverContent from '../popover/PopoverContent.vue'
import { colorPickerTriggerVariants } from './color-picker-variants'
import ColorPickerPanel from './ColorPickerPanel.vue'
import { type ColorPickerEmits, type ColorPickerProps } from './types'

type TriggerVariantProps = VariantProps<typeof colorPickerTriggerVariants>

interface Props extends ColorPickerProps {
    size?: NonNullable<TriggerVariantProps['size']>
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    format: 'hex',
    showAlpha: false,
    presets: undefined,
    showPresets: true,
    presetsLabel: undefined,
    showHistory: true,
    historyMax: 8,
    historyStorageKey: 'brutx-color-history',
    showInput: true,
    placeholder: undefined,
    disabled: false,
    clearable: false,
    size: 'default',
    name: undefined,
    id: undefined,
    ariaLabel: undefined,
    class: undefined,
})

const emit = defineEmits<ColorPickerEmits>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('colorPicker.placeholder'))
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('colorPicker.placeholder'))

const open = ref(false)
const displayValue = ref<string | null>(props.modelValue)

watch(open, (isOpen) => {
    if (isOpen) emit('open')
    else {
        emit('close')
        if (displayValue.value !== props.modelValue) {
            emit('change', props.modelValue)
        }
    }
})

watch(() => props.modelValue, (value) => {
    displayValue.value = value
})

const normalizedDisplay = computed(() => {
    if (!props.modelValue) return null
    const hsv = parseColor(props.modelValue)
    if (!hsv) return null
    return formatColor(hsv, props.format, props.showAlpha)
})

const swatchStyle = computed(() => ({
    backgroundColor: props.modelValue ?? 'transparent',
}))

const triggerClasses = computed(() =>
    cn(
        colorPickerTriggerVariants({ size: props.size }),
        !props.modelValue && 'text-brutal-muted-foreground',
        props.class
    )
)

function handlePanelUpdate(value: string | null) {
    displayValue.value = value
    emit('update:modelValue', value)
}

function handlePanelConfirm(value: string | null) {
    displayValue.value = value
    emit('update:modelValue', value)
    emit('change', value)
    open.value = false
}

function handlePanelClear() {
    displayValue.value = null
    emit('update:modelValue', null)
    emit('change', null)
}

function handleClearClick(event: MouseEvent) {
    event.stopPropagation()
    displayValue.value = null
    emit('update:modelValue', null)
    emit('change', null)
}

function handleTriggerKeydown(event: KeyboardEvent) {
    if (props.disabled) return
    if ((event.key === 'Enter' || event.key === ' ') && !open.value) {
        event.preventDefault()
        open.value = true
    }
}

const presetsForPanel = computed<string[] | ColorPreset[] | undefined>(() => props.presets)
</script>

<template>
    <PopoverRoot v-model:open="open">
        <PopoverTrigger as-child>
            <button
                :id="id"
                type="button"
                :name="name"
                role="combobox"
                :aria-expanded="open"
                :aria-label="resolvedAriaLabel"
                aria-haspopup="dialog"
                :disabled="disabled"
                :class="triggerClasses"
                @keydown="handleTriggerKeydown"
            >
                <span
                    class="inline-block border-2 border-brutal shrink-0"
                    :class="[
                        size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5',
                        !modelValue && 'opacity-40',
                    ]"
                    :style="swatchStyle"
                />
                <span v-if="showInput" class="flex-1 text-left truncate font-mono text-sm">
                    {{ normalizedDisplay ?? resolvedPlaceholder }}
                </span>
                <span v-else class="flex-1 text-left truncate">
                    {{ normalizedDisplay ?? resolvedPlaceholder }}
                </span>
                <span class="flex items-center gap-1 shrink-0">
                    <button
                        v-if="clearable && modelValue && !disabled"
                        type="button"
                        class="inline-flex items-center justify-center text-brutal-fg hover:text-brutal-destructive transition-colors"
                        :class="size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'"
                        :aria-label="t('colorPicker.clear')"
                        tabindex="-1"
                        @click="handleClearClick"
                    >
                        <X :class="size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'" class="stroke-[3]" />
                    </button>
                    <ChevronDown class="opacity-60 stroke-[3]" :class="size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'" />
                </span>
            </button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
            <ColorPickerPanel
                :model-value="displayValue"
                :format="format"
                :show-alpha="showAlpha"
                :presets="presetsForPanel"
                :show-presets="showPresets"
                :presets-label="presetsLabel"
                :show-history="showHistory"
                :history-max="historyMax"
                :history-storage-key="historyStorageKey"
                :show-input="showInput"
                :clearable="clearable"
                :size="size"
                @update:model-value="handlePanelUpdate"
                @confirm="handlePanelConfirm"
                @clear="handlePanelClear"
            />
        </PopoverContent>
    </PopoverRoot>
</template>
