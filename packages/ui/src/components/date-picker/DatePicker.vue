<script setup lang="ts">
import { computed, useId, watch } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Calendar as CalendarIcon, ChevronDown, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import PopoverContent from '../popover/PopoverContent.vue'
import { datePickerTriggerVariants } from './date-picker-variants'
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
    class: undefined,
})

const emit = defineEmits<DatePickerEmits & {
    'update:open': [value: boolean]
}>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('datePicker.placeholder'))
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.placeholder'))

const {
    open: internalOpen,
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
        datePickerTriggerVariants({ size: props.size, variant: props.variant }),
        !props.modelValue && 'text-brutal-muted-foreground',
        props.class
    )
)

const contentId = `date-picker-content-${useId()}`

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
                :aria-controls="open ? contentId : undefined"
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
                        :class="iconSizeVariants({ size: size === 'sm' ? 'default' : 'lg' })"
                        :aria-label="t('datePicker.clear')"
                        tabindex="-1"
                        @click="handleClearClick"
                    >
                        <X :class="iconSizeVariants({ size: size === 'sm' ? 'sm' : 'default' })" class="stroke-[3]" />
                    </button>
                    <ChevronDown class="opacity-60 stroke-[3]" :class="iconSizeVariants({ size: size === 'sm' ? 'sm' : 'default' })" />
                </span>
            </button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
            <div :id="contentId">
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
            </div>
        </PopoverContent>
    </PopoverRoot>
</template>
