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
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.dateTimePlaceholder'))

const internalOpen = ref(false)
const displayValue = ref<Date | null>(props.modelValue)

watch(internalOpen, (isOpen) => {
    if (isOpen) emit('open')
    else {
        emit('close')
        if (displayValue.value?.getTime() !== props.modelValue?.getTime()) {
            emit('change', displayValue.value)
        }
    }
})

watch(() => props.modelValue, (value) => {
    displayValue.value = value
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

const formattedDisplay = computed(() => {
    if (!props.modelValue) return ''
    return formatDate(props.modelValue, resolvedDisplayFormat.value)
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
            <DateTimePickerPanel
                :model-value="displayValue"
                :min-date="minDate"
                :max-date="maxDate"
                :shortcuts="shortcuts"
                :clearable="clearable"
                :show-seconds="showSeconds"
                :time-step="timeStep"
                :aria-label="resolvedAriaLabel"
                @update:model-value="handlePanelUpdate"
                @confirm="handlePanelConfirm"
                @clear="handlePanelClear"
            />
        </PopoverContent>
    </PopoverRoot>
</template>
