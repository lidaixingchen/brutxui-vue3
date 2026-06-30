<script setup lang="ts">
import { computed, useId, watch } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { ChevronDown, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { type ColorPreset } from '@/lib/default-presets'
import PopoverContent from '../popover/PopoverContent.vue'
import { colorPickerTriggerVariants } from './color-picker-variants'
import ColorPickerPanel from './ColorPickerPanel.vue'
import { type ColorPickerEmits, type ColorPickerProps } from './types'
import { useColorPicker } from '@/composables/useColorPicker'

type TriggerVariantProps = VariantProps<typeof colorPickerTriggerVariants>

interface ColorPickerRootProps extends ColorPickerProps {
    open?: boolean
    size?: NonNullable<TriggerVariantProps['size']>
}

const props = withDefaults(defineProps<ColorPickerRootProps>(), {
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
    open: undefined,
    size: 'default',
    name: undefined,
    id: undefined,
    ariaLabel: undefined,
    class: undefined,
})

const emit = defineEmits<ColorPickerEmits & {
    'update:open': [value: boolean]
}>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('colorPicker.placeholder'))
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('colorPicker.placeholder'))

const {
    open: internalOpen,
    displayValue,
    normalizedDisplay,
    swatchStyle,
    handlePanelUpdate,
    handlePanelConfirm,
    handlePanelClear,
    handleClearClick,
    handleTriggerKeydown,
} = useColorPicker({
    modelValue: () => props.modelValue,
    format: () => props.format,
    showAlpha: () => props.showAlpha,
    disabled: () => props.disabled,
    emit,
})

watch(() => props.open, (val) => {
    if (val !== undefined) internalOpen.value = val
}, { immediate: true })

const open = computed<boolean>({
    get: () => props.open !== undefined ? props.open : internalOpen.value,
    set: (val) => {
        internalOpen.value = val
        emit('update:open', val)
    },
})

const triggerClasses = computed(() =>
    cn(
        colorPickerTriggerVariants({ size: props.size }),
        !props.modelValue && 'text-brutal-muted-foreground',
        props.class
    )
)

const ICON_SIZE_CLASSES = {
    swatch: { sm: 'w-4 h-4', default: 'w-5 h-5', lg: 'w-7 h-7' },
    clearButton: { sm: 'w-4 h-4', default: 'w-5 h-5', lg: 'w-5 h-5' },
    smallIcon: { sm: 'w-3 h-3', default: 'w-4 h-4', lg: 'w-4 h-4' },
} as const

defineExpose({ open })

const contentId = `color-picker-content-${useId()}`

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
                :aria-controls="open ? contentId : undefined"
                :aria-label="resolvedAriaLabel"
                aria-haspopup="dialog"
                :disabled="disabled"
                :class="triggerClasses"
                @keydown="handleTriggerKeydown"
            >
                <span
                    class="inline-block border-2 border-brutal shrink-0"
                    :class="[
                        ICON_SIZE_CLASSES.swatch[size],
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
                        :class="ICON_SIZE_CLASSES.clearButton[size]"
                        :aria-label="t('colorPicker.clear')"
                        tabindex="-1"
                        @click="handleClearClick"
                    >
                        <X :class="ICON_SIZE_CLASSES.smallIcon[size]" class="stroke-[3]" />
                    </button>
                    <ChevronDown class="opacity-60 stroke-[3]" :class="ICON_SIZE_CLASSES.smallIcon[size]" />
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
