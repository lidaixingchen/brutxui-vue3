<script setup lang="ts">
import { computed, useId } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Calendar as CalendarIcon, ChevronDown, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { formatDate } from '@/lib/date'
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

const contentId = `date-picker-content-${useId()}`

// 原生表单集成：name 经 hidden input 随表单提交（ISO 日期序列化）；
// 空值提交空串（与原生 date input 语义一致，服务端可区分"清空"与"未提供"）；
// disabled 时不参与表单提交（原生表单语义）
const hiddenInputValue = computed(() => {
    if (!props.name) return undefined
    if (!props.modelValue) return ''
    return formatDate(props.modelValue, 'YYYY-MM-DD')
})

defineExpose({ open })
</script>

<template>
    <PopoverRoot v-model:open="open">
        <input v-if="hiddenInputValue !== undefined" type="hidden" :name="name" :value="hiddenInputValue" :disabled="disabled">
        <div class="relative w-full">
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
                    :aria-disabled="readonly"
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
                            :class="iconSizeVariants({ size: size === 'sm' ? 'md' : 'lg' })"
                        >
                            <X :class="iconSizeVariants({ size: size === 'sm' ? 'sm' : 'md' })" class="stroke-[3]" />
                        </span>
                        <ChevronDown class="opacity-60 stroke-[3]" :class="iconSizeVariants({ size: size === 'sm' ? 'sm' : 'md' })" />
                    </span>
                </button>
            </PopoverTrigger>
            <button
                v-if="clearable && modelValue && !disabled && !readonly"
                type="button"
                class="absolute top-1/2 z-10 -translate-y-1/2 inline-flex items-center justify-center text-brutal-fg hover:text-brutal-destructive transition-colors"
                :class="[
                    size === 'sm' ? 'right-8' : 'right-10',
                    iconSizeVariants({ size: size === 'sm' ? 'md' : 'lg' }),
                ]"
                :aria-label="t('datePicker.clear')"
                @pointerdown.stop
                @click="handleClearClick"
            >
                <X :class="iconSizeVariants({ size: size === 'sm' ? 'sm' : 'md' })" class="stroke-[3]" />
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
                :aria-label="resolvedAriaLabel"
                @update:model-value="handlePanelUpdate"
                @confirm="handlePanelConfirm"
                @clear="handlePanelClear"
            />
            </div>
        </PopoverContent>
    </PopoverRoot>
</template>
