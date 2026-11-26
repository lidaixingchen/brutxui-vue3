<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Calendar as CalendarIcon, ChevronDown, X } from '@lucide/vue'
import { PopoverRoot } from 'reka-ui'
import PopoverTrigger from '../popover/PopoverTrigger.vue'
import { cn, FOCUS_RING_CLASSES } from '@/lib/utils'
import { brutalDestructiveHoverTextClasses } from '@/lib/semantic-text-variants'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { useDatePickerSelection } from '@/composables/useDatePickerSelection'
import { formatDate } from '@/lib/date'
import PopoverContent from '../popover/PopoverContent.vue'
import {
    datePickerControlTriggerVariants,
    datePickerControlVariants,
    datePickerMultilineTriggerVariants,
    datePickerTriggerVariants,
} from './date-picker-variants'
import DatePickerRangePanel from './DatePickerRangePanel.vue'
import { type DatePickerRangeEmits, type DatePickerRangeProps, type DateRange } from './types'

type TriggerVariantProps = VariantProps<typeof datePickerTriggerVariants>

interface Props extends DatePickerRangeProps {
    size?: NonNullable<TriggerVariantProps['size']>
    variant?: NonNullable<TriggerVariantProps['variant']>
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    displayFormat: 'YYYY-MM-DD',
    startPlaceholder: undefined,
    endPlaceholder: undefined,
    separator: undefined,
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

const emit = defineEmits<DatePickerRangeEmits>()

const { t } = useLocale()

const resolvedStartPlaceholder = computed(() => props.startPlaceholder ?? t('datePicker.startPlaceholder'))
const resolvedEndPlaceholder = computed(() => props.endPlaceholder ?? t('datePicker.endPlaceholder'))
const resolvedSeparator = computed(() => props.separator ?? t('datePicker.separator'))
// 控件可访问名称与 placeholder 提示分离（placeholder 是示例文本，非控件名）
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.rangeLabel'))

const triggerRef = ref<HTMLButtonElement | null>(null)
const {
    open,
    displayValue,
    handlePanelUpdate,
    handlePanelConfirm,
    handlePanelClear,
    handleClearClick,
    handleTriggerKeydown,
} = useDatePickerSelection<DateRange>(
    {
        modelValue: () => props.modelValue,
        disabled: () => props.disabled,
        readonly: () => props.readonly,
        emit,
        onTriggerClear: () => void nextTick(() => triggerRef.value?.focus()),
    },
    (a, b) => a?.[0]?.getTime() === b?.[0]?.getTime() && a?.[1]?.getTime() === b?.[1]?.getTime(),
)

const formattedStart = computed(() => {
    if (!props.modelValue || props.modelValue.length !== 2) return ''
    return formatDate(props.modelValue[0], props.displayFormat)
})

const formattedEnd = computed(() => {
    if (!props.modelValue || props.modelValue.length !== 2) return ''
    return formatDate(props.modelValue[1], props.displayFormat)
})

const hasValue = computed(() => Boolean(props.modelValue && props.modelValue.length === 2))

const triggerClasses = computed(() =>
    cn(
        datePickerTriggerVariants({ size: props.size, variant: props.variant }),
        datePickerMultilineTriggerVariants({ size: props.size }),
        datePickerControlTriggerVariants(),
        !hasValue.value && 'text-brutal-muted-foreground',
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
        FOCUS_RING_CLASSES,
        brutalDestructiveHoverTextClasses,
        props.size === 'sm' ? 'right-8 w-4 h-4' : 'right-10 w-5 h-5'
    )
)
</script>

<template>
    <PopoverRoot v-model:open="open">
        <div :class="controlClasses">
            <PopoverTrigger :id="id" as-child>
                <button
                    ref="triggerRef"
                    type="button"
                    :name="name"
                    role="combobox"
                    :aria-expanded="open"
                    :aria-label="resolvedAriaLabel"
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
                    <span class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 text-left font-mono text-sm">
                        <span class="min-w-0 wrap-anywhere">{{ formattedStart || resolvedStartPlaceholder }}</span>
                        <span class="flex min-w-0 items-baseline gap-1.5">
                            <span class="min-w-0 wrap-anywhere font-bold text-brutal-muted-foreground">{{ resolvedSeparator }}</span>
                            <span class="min-w-0 wrap-anywhere">{{ formattedEnd || resolvedEndPlaceholder }}</span>
                        </span>
                    </span>
                    <span class="flex items-center gap-1 shrink-0">
                        <span
                            v-if="clearable && hasValue && !disabled && !readonly"
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
                v-if="clearable && hasValue && !disabled && !readonly"
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
        <PopoverContent class="w-auto p-0 border-none shadow-none bg-transparent" align="start" :title="resolvedAriaLabel">
            <DatePickerRangePanel
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
