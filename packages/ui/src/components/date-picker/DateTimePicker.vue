<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Calendar as CalendarIcon, ChevronDown, X } from '@lucide/vue'
import { PopoverRoot } from 'reka-ui'
import PopoverTrigger from '../popover/PopoverTrigger.vue'
import { cn } from '@/lib/utils'
import { brutalDestructiveHoverTextClasses } from '@/lib/semantic-text-variants'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { formatDate } from '@/lib/date'
import { useLocale } from '@/composables/useLocale'
import { useDatePicker } from '@/composables/useDatePicker'
import PopoverContent from '../popover/PopoverContent.vue'
import {
    datePickerControlTriggerVariants,
    datePickerControlVariants,
    datePickerTriggerVariants,
} from './date-picker-variants'
import DateTimePickerPanel from './DateTimePickerPanel.vue'
import { type DateTimePickerEmits, type DateTimePickerProps } from './types'

type TriggerVariantProps = VariantProps<typeof datePickerTriggerVariants>

interface Props extends DateTimePickerProps {
    open?: boolean
    size?: NonNullable<TriggerVariantProps['size']>
    variant?: NonNullable<TriggerVariantProps['variant']>
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    displayFormat: undefined,
    showSeconds: false,
    timeStep: () => ({ hour: 1, minute: 1, second: 1 }),
    placeholder: undefined,
    minDate: undefined,
    maxDate: undefined,
    disabled: false,
    readonly: false,
    clearable: false,
    open: undefined,
    size: 'default',
    variant: 'default',
    shortcuts: () => [],
    name: undefined,
    id: undefined,
    ariaLabel: undefined,
    ariaLabelledby: undefined,
    class: undefined,
})

const emit = defineEmits<DateTimePickerEmits & {
    'update:open': [value: boolean]
}>()

const { t } = useLocale()

const resolvedDisplayFormat = computed(() =>
    props.displayFormat ?? (props.showSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm')
)
const resolvedPlaceholder = computed(() => props.placeholder ?? t('datePicker.dateTimePlaceholder'))
const triggerIdAttrs = computed(() => props.id?.trim() ? { id: props.id.trim() } : {})
const resolvedAriaLabelledby = computed(() => props.ariaLabelledby?.trim() || undefined)
const resolvedAriaLabel = computed(() => resolvedAriaLabelledby.value
    ? undefined
    : props.ariaLabel?.trim() || undefined
)
const resolvedTitle = computed(() => resolvedAriaLabel.value || resolvedAriaLabelledby.value
    ? undefined
    : t('datePicker.dateTimePlaceholder')
)
const resolvedPanelAriaLabel = computed(() => props.ariaLabel?.trim() || t('datePicker.dateTimePlaceholder'))

// 原生表单集成：name 经 hidden input 随表单提交；
// DateTimePicker 的值含时分（及秒），序列化需保留时间部分，避免静默丢失
const hiddenInputValue = computed(() => {
    if (!props.name) return undefined
    if (!props.modelValue) return ''
    return formatDate(
        props.modelValue,
        props.showSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm',
    )
})

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
    displayFormat: () => resolvedDisplayFormat.value,
    disabled: () => props.disabled,
    readonly: () => props.readonly,
    openProp: () => props.open,
    emitUpdateOpen: (val) => emit('update:open', val),
    emit,
})

const triggerClasses = computed(() =>
    cn(
        datePickerTriggerVariants({ size: props.size, variant: props.variant }),
        datePickerControlTriggerVariants(),
        !props.modelValue && 'text-brutal-muted-foreground',
        props.class
    )
)

const controlClasses = computed(() =>
    cn(datePickerControlVariants({ disabled: props.disabled }))
)

const calendarIconClasses = computed(() =>
    iconSizeVariants({ size: props.size === 'default' ? 'md' : props.size })
)
const smallIconClasses = computed(() =>
    props.size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
)
const clearPlaceholderClasses = computed(() =>
    props.size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
)
const clearButtonClasses = computed(() =>
    cn(
        'text-brutal-fg transition-colors',
        brutalDestructiveHoverTextClasses,
        props.size === 'sm' ? 'right-8 w-4 h-4' : 'right-10 w-5 h-5'
    )
)

defineExpose({ open })
</script>

<template>
    <PopoverRoot v-model:open="open">
        <input v-if="hiddenInputValue !== undefined" type="hidden" :name="name" :value="hiddenInputValue" :disabled="disabled">
        <div :class="controlClasses">
            <PopoverTrigger :id="id" as-child>
                <button
                    v-bind="triggerIdAttrs"
                    type="button"
                    :name="name"
                    role="combobox"
                    :aria-expanded="open"
                    :aria-labelledby="resolvedAriaLabelledby"
                    :aria-label="resolvedAriaLabel"
                    :title="resolvedTitle"
                    aria-haspopup="dialog"
                    :disabled="disabled"
                    :class="triggerClasses"
                    @keydown="handleTriggerKeydown"
                >
                    <CalendarIcon
                        class="shrink-0 stroke-[3] opacity-70"
                        :class="calendarIconClasses"
                    />
                    <span class="flex-1 text-left truncate font-mono text-sm">
                        {{ formattedDisplay || resolvedPlaceholder }}
                    </span>
                    <span class="flex items-center gap-1 shrink-0">
                        <span
                            v-if="clearable && modelValue && !disabled && !readonly"
                            aria-hidden="true"
                            class="inline-flex items-center justify-center opacity-0 pointer-events-none"
                            :class="clearPlaceholderClasses"
                        >
                            <X :class="smallIconClasses" class="stroke-[3]" />
                        </span>
                        <ChevronDown class="opacity-60 stroke-[3]" :class="smallIconClasses" />
                    </span>
                </button>
            </PopoverTrigger>
            <button
                v-if="clearable && modelValue && !disabled && !readonly"
                type="button"
                class="absolute top-1/2 z-10 -translate-y-1/2 inline-flex items-center justify-center"
                :class="clearButtonClasses"
                :aria-label="t('datePicker.clear')"
                @pointerdown.stop
                @click="handleClearClick"
            >
                <X :class="smallIconClasses" class="stroke-[3]" />
            </button>
        </div>
        <PopoverContent class="w-auto p-0 border-none shadow-none bg-transparent overflow-visible" align="start" :aria-label="resolvedPanelAriaLabel">
            <DateTimePickerPanel
                :model-value="displayValue"
                :min-date="minDate"
                :max-date="maxDate"
                :shortcuts="shortcuts"
                :clearable="clearable"
                :show-seconds="showSeconds"
                :time-step="timeStep"
                :aria-label="resolvedPanelAriaLabel"
                @update:model-value="handlePanelUpdate"
                @confirm="handlePanelConfirm"
                @clear="handlePanelClear"
            />
        </PopoverContent>
    </PopoverRoot>
</template>
