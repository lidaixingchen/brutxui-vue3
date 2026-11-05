<script setup lang="ts">
import { computed, useId } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Calendar as CalendarIcon, ChevronDown, X } from '@lucide/vue'
import { PopoverRoot } from 'reka-ui'
import PopoverTrigger from '../popover/PopoverTrigger.vue'
import { cn } from '@/lib/utils'
import { brutalDestructiveHoverTextClasses } from '@/lib/semantic-text-variants'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { formatDate } from '@/lib/date'
import { useLocale } from '@/composables/useLocale'
import PopoverContent from '../popover/PopoverContent.vue'
import {
    datePickerControlTriggerVariants,
    datePickerControlVariants,
    datePickerTriggerVariants,
} from './date-picker-variants'
import DatePickerPanel from './DatePickerPanel.vue'
import { type DatePickerEmits, type DatePickerProps } from './types'
import { useDatePicker } from '@/composables/useDatePicker'

type TriggerVariantProps = VariantProps<typeof datePickerTriggerVariants>

interface DatePickerRootProps extends DatePickerProps {
    open?: boolean
    size?: NonNullable<TriggerVariantProps['size']>
    variant?: NonNullable<TriggerVariantProps['variant']>
}

const props = withDefaults(defineProps<DatePickerRootProps>(), {
    modelValue: null,
    displayFormat: 'YYYY-MM-DD',
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

const emit = defineEmits<DatePickerEmits & {
    'update:open': [value: boolean]
}>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('datePicker.placeholder'))
const triggerIdAttrs = computed(() => props.id?.trim() ? { id: props.id.trim() } : {})
const resolvedAriaLabelledby = computed(() => props.ariaLabelledby?.trim() || undefined)
const resolvedAriaLabel = computed(() => resolvedAriaLabelledby.value
    ? undefined
    : props.ariaLabel?.trim() || undefined
)
const resolvedTitle = computed(() => resolvedAriaLabel.value || resolvedAriaLabelledby.value
    ? undefined
    : t('datePicker.placeholder')
)
const resolvedPanelAriaLabel = computed(() => props.ariaLabel?.trim() || t('datePicker.placeholder'))

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
        datePickerControlTriggerVariants(),
        !props.modelValue && 'text-brutal-muted-foreground',
        props.class
    )
)

const controlClasses = computed(() =>
    cn(datePickerControlVariants({ disabled: props.disabled }))
)

const contentId = `date-picker-content-${useId()}`

// 原生表单集成：name 经 hidden input 随表单提交（ISO 日期序列化）；
// 空值提交空串（与原生 date input 语义一致，服务端可区分"清空"与"未提供"）；
// disabled 时不参与表单提交（原生表单语义）
const hiddenInputValue = computed(() => {
    if (!props.name) return undefined
    if (!props.modelValue) return ''
    return formatDate(props.modelValue, 'YYYY-MM-DD')
})

const calendarIconClasses = computed(() =>
    iconSizeVariants({ size: props.size === 'default' ? 'md' : props.size })
)
const smallIconClasses = computed(() =>
    iconSizeVariants({ size: props.size === 'sm' ? 'sm' : 'md' })
)
const clearPlaceholderClasses = computed(() =>
    iconSizeVariants({ size: props.size === 'sm' ? 'md' : 'lg' })
)
const clearButtonClasses = computed(() =>
    cn(
        'text-brutal-fg transition-colors',
        brutalDestructiveHoverTextClasses,
        props.size === 'sm' ? 'right-8' : 'right-10',
        iconSizeVariants({ size: props.size === 'sm' ? 'md' : 'lg' })
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
                    :aria-controls="open ? contentId : undefined"
                    :aria-labelledby="resolvedAriaLabelledby"
                    :aria-label="resolvedAriaLabel"
                    :title="resolvedTitle"
                    aria-haspopup="dialog"
                    :disabled="disabled"
                    :aria-disabled="readonly"
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
        <PopoverContent class="w-auto p-0 border-none shadow-none bg-transparent" align="start">
            <div :id="contentId">
            <DatePickerPanel
                :model-value="displayValue"
                :min-date="minDate"
                :max-date="maxDate"
                :shortcuts="shortcuts"
                :clearable="clearable"
                :aria-label="resolvedPanelAriaLabel"
                @update:model-value="handlePanelUpdate"
                @confirm="handlePanelConfirm"
                @clear="handlePanelClear"
            />
            </div>
        </PopoverContent>
    </PopoverRoot>
</template>
