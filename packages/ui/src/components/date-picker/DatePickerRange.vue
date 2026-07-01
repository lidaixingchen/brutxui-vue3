<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Calendar as CalendarIcon, ChevronDown, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { formatDate } from '@/lib/date'
import PopoverContent from '../popover/PopoverContent.vue'
import { datePickerTriggerVariants } from './date-picker-variants'
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
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.startPlaceholder'))

const open = ref(false)
const displayValue = ref<DateRange | null>(props.modelValue)

watch(open, (isOpen) => {
    if (isOpen) emit('open')
    else {
        emit('close')
        const display = displayValue.value
        const model = props.modelValue
        if (
            display?.[0]?.getTime() !== model?.[0]?.getTime() ||
            display?.[1]?.getTime() !== model?.[1]?.getTime()
        ) {
            emit('change', displayValue.value)
        }
    }
})

watch(() => props.modelValue, (value) => {
    displayValue.value = value
})

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
        !hasValue.value && 'text-brutal-muted-foreground',
        props.class
    )
)

function handlePanelUpdate(value: DateRange | null) {
    displayValue.value = value
    emit('update:modelValue', value)
}

function handlePanelConfirm(value: DateRange | null) {
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
                <span class="flex-1 text-left truncate font-mono text-sm flex items-center gap-1.5 min-w-0">
                    <span class="truncate">{{ formattedStart || resolvedStartPlaceholder }}</span>
                    <span class="shrink-0 opacity-60 font-bold">{{ resolvedSeparator }}</span>
                    <span class="truncate">{{ formattedEnd || resolvedEndPlaceholder }}</span>
                </span>
                <span class="flex items-center gap-1 shrink-0">
                    <button
                        v-if="clearable && hasValue && !disabled"
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
