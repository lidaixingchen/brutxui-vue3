<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Calendar as CalendarIcon, ChevronDown, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { formatDate } from '../../lib/date'
import PopoverContent from '../popover/PopoverContent.vue'
import { datePickerTriggerVariants } from './date-picker-variants'
import DatePickerPanel from './DatePickerPanel.vue'
import { type DatePickerEmits, type DatePickerProps } from './types'

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

const open = ref(false)
const displayValue = ref<Date | null>(props.modelValue)

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

const formattedDisplay = computed(() => {
    if (!props.modelValue) return ''
    return formatDate(props.modelValue, props.displayFormat)
})

const triggerClasses = computed(() =>
    cn(
        datePickerTriggerVariants({ size: props.size, variant: props.variant }),
        !props.modelValue && 'text-brutal-muted-foreground',
        props.class
    )
)

function handlePanelUpdate(value: Date | null) {
    displayValue.value = value
    emit('update:modelValue', value)
}

function handlePanelConfirm(value: Date | null) {
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
    if (props.disabled || props.readonly) return
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
                    :class="size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'"
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
