<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Calendar as CalendarIcon, ChevronDown, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { useDatePicker } from '@/composables/useDatePicker'
import PopoverContent from '../popover/PopoverContent.vue'
import { datePickerTriggerVariants } from './date-picker-variants'
import MonthPickerPanel from './MonthPickerPanel.vue'
import { type MonthPickerEmits, type MonthPickerProps } from './types'

type TriggerVariantProps = VariantProps<typeof datePickerTriggerVariants>

interface Props extends MonthPickerProps {
    open?: boolean
    size?: NonNullable<TriggerVariantProps['size']>
    variant?: NonNullable<TriggerVariantProps['variant']>
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    displayFormat: 'YYYY-MM',
    placeholder: undefined,
    minDate: undefined,
    maxDate: undefined,
    disabled: false,
    readonly: false,
    clearable: false,
    open: undefined,
    size: 'default',
    variant: 'default',
    name: undefined,
    id: undefined,
    ariaLabel: undefined,
    class: undefined,
})

const emit = defineEmits<MonthPickerEmits & {
    'update:open': [value: boolean]
}>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('datePicker.monthPlaceholder'))
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.monthPlaceholder'))

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
    openProp: () => props.open,
    emitUpdateOpen: (val) => emit('update:open', val),
    emit,
})

const triggerClasses = computed(() =>
    cn(
        datePickerTriggerVariants({ size: props.size, variant: props.variant }),
        !props.modelValue && 'text-brutal-muted-foreground',
        props.class
    )
)

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
                    :class="iconSizeVariants({ size })"
                />
                <span class="flex-1 text-left truncate font-mono text-sm">
                    {{ formattedDisplay || resolvedPlaceholder }}
                </span>
                <span class="flex items-center gap-1 shrink-0">
                    <button
                        v-if="clearable && modelValue && !disabled && !readonly"
                        type="button"
                        class="inline-flex items-center justify-center text-brutal-fg hover:text-brutal-destructive transition-colors"
                        :class="size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'"
                        :aria-label="t('datePicker.clear')"
                        tabindex="-1"
                        @click="handleClearClick"
                    >
                        <X :class="size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'" class="stroke-[3]" />
                    </button>
                    <ChevronDown class="opacity-60 stroke-[3]" :class="size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'" />
                </span>
            </button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0 border-none shadow-none bg-transparent" align="start">
            <MonthPickerPanel
                :model-value="displayValue"
                :min-date="minDate"
                :max-date="maxDate"
                :clearable="clearable"
                :aria-label="resolvedAriaLabel"
                @update:model-value="handlePanelUpdate"
                @confirm="handlePanelConfirm"
                @clear="handlePanelClear"
            />
        </PopoverContent>
    </PopoverRoot>
</template>
