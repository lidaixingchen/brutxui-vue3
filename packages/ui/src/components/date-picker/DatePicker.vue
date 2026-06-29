<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Calendar as CalendarIcon, ChevronDown, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import PopoverContent from '../popover/PopoverContent.vue'
import { datePickerTriggerVariants } from './date-picker-variants'
import DatePickerPanel from './DatePickerPanel.vue'
import { type DatePickerEmits, type DatePickerProps } from './types'
import { useDatePicker } from '@/composables/useDatePicker'

type TriggerVariantProps = VariantProps<typeof datePickerTriggerVariants>

interface Props extends DatePickerProps {
    size?: NonNullable<TriggerVariantProps['size']>
    variant?: NonNullable<TriggerVariantProps['variant']>
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    mode: 'date',
    displayFormat: 'YYYY-MM-DD',
    valueFormat: 'date',
    placeholder: undefined,
    minDate: undefined,
    maxDate: undefined,
    disabled: false,
    readonly: false,
    clearable: false,
    size: 'default',
    variant: 'default',
    shortcuts: () => [],
    name: undefined,
    id: undefined,
    ariaLabel: undefined,
    class: undefined,
})

const emit = defineEmits<DatePickerEmits>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('datePicker.placeholder'))
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.placeholder'))

const {
    open,
    displayValue,
    formattedDisplay,
    handlePanelUpdate,
    handlePanelConfirm,
    handlePanelClear,
    handleClearClick,
    handleTriggerKeydown,
} = useDatePicker({
    modelValue: () => props.modelValue,
    displayFormat: () => props.displayFormat,
    disabled: () => props.disabled,
    readonly: () => props.readonly,
    emit,
})

const triggerClasses = computed(() =>
    cn(
        datePickerTriggerVariants({ size: props.size, variant: props.variant }),
        !props.modelValue && 'text-brutal-muted-foreground',
        props.class
    )
)

const ICON_SIZE_CLASSES = {
    calendar: { sm: 'w-3.5 h-3.5', default: 'w-4 h-4', lg: 'w-5 h-5' },
    clearButton: { sm: 'w-4 h-4', default: 'w-5 h-5', lg: 'w-5 h-5' },
    smallIcon: { sm: 'w-3 h-3', default: 'w-4 h-4', lg: 'w-4 h-4' },
} as const

defineExpose({ open })
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
                <CalendarIcon
                    class="shrink-0 stroke-[3] opacity-70"
                    :class="ICON_SIZE_CLASSES.calendar[size]"
                />
                <span class="flex-1 text-left truncate font-mono text-sm">
                    {{ formattedDisplay || resolvedPlaceholder }}
                </span>
                <span class="flex items-center gap-1 shrink-0">
                    <button
                        v-if="clearable && modelValue && !disabled && !readonly"
                        type="button"
                        class="inline-flex items-center justify-center text-brutal-fg hover:text-brutal-destructive transition-colors"
                        :class="ICON_SIZE_CLASSES.clearButton[size]"
                        :aria-label="t('datePicker.clear')"
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
            <DatePickerPanel
                :model-value="displayValue"
                :min-date="minDate"
                :max-date="maxDate"
                :shortcuts="shortcuts"
                :clearable="clearable"
                :aria-label="resolvedAriaLabel"
                @update:model-value="handlePanelUpdate"
                @confirm="handlePanelConfirm"
                @clear="handlePanelClear"
            />
        </PopoverContent>
    </PopoverRoot>
</template>
