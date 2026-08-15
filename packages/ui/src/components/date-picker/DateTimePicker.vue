<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Calendar as CalendarIcon, ChevronDown, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { formatDate } from '@/lib/date'
import { useLocale } from '@/composables/useLocale'
import { useDatePicker } from '@/composables/useDatePicker'
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

// 原生表单集成：name 经 hidden input 随表单提交（ISO 日期序列化）
const hiddenInputValue = computed(() => {
    if (!props.name || !props.modelValue) return undefined
    return formatDate(props.modelValue, 'YYYY-MM-DD')
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
        !props.modelValue && 'text-brutal-muted-foreground',
        props.class
    )
)

defineExpose({ open })
</script>

<template>
    <PopoverRoot v-model:open="open">
        <input v-if="hiddenInputValue !== undefined" type="hidden" :name="name" :value="hiddenInputValue">
        <div class="relative w-full">
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
                        :class="iconSizeVariants({ size: size === 'default' ? 'md' : size })"
                    />
                    <span class="flex-1 text-left truncate font-mono text-sm">
                        {{ formattedDisplay || resolvedPlaceholder }}
                    </span>
                    <span class="flex items-center gap-1 shrink-0">
                        <span
                            v-if="clearable && modelValue && !disabled && !readonly"
                            aria-hidden="true"
                            class="inline-flex items-center justify-center opacity-0 pointer-events-none"
                            :class="size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'"
                        >
                            <X :class="size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'" class="stroke-[3]" />
                        </span>
                        <ChevronDown class="opacity-60 stroke-[3]" :class="size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'" />
                    </span>
                </button>
            </PopoverTrigger>
            <button
                v-if="clearable && modelValue && !disabled && !readonly"
                type="button"
                class="absolute top-1/2 z-10 -translate-y-1/2 inline-flex items-center justify-center text-brutal-fg hover:text-brutal-destructive transition-colors"
                :class="[
                    size === 'sm' ? 'right-8 w-4 h-4' : 'right-10 w-5 h-5',
                ]"
                :aria-label="t('datePicker.clear')"
                @pointerdown.stop
                @click="handleClearClick"
            >
                <X :class="size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'" class="stroke-[3]" />
            </button>
        </div>
        <PopoverContent class="w-auto p-0 border-none shadow-none bg-transparent" align="start" :aria-label="resolvedAriaLabel">
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
