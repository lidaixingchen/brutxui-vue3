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

const open = ref(false)
const displayValue = ref<DateRange | null>(props.modelValue)

// readonly 时拒绝打开（与 useDatePicker 的 setter 拦截语义一致）
const openModel = computed<boolean>({
    get: () => open.value,
    set: (val) => {
        if (val && props.readonly) return
        open.value = val
    },
})

let suppressCloseChange = false

watch(open, (isOpen) => {
    if (isOpen) {
        suppressCloseChange = false
        // 打开时以 modelValue 重新初始化 displayValue：父组件单向绑定时，
        // 上次关闭前未确认的选择残留会让下次打开的面板显示过期值
        displayValue.value = props.modelValue
        emit('open')
    } else {
        emit('close')
        if (suppressCloseChange) {
            suppressCloseChange = false
            return
        }
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
    // 新值非空时取消抑制：清除后重新选择并关闭面板时仍需触发 change
    // （与单日期 useDatePicker 的语义一致）
    if (value !== null) suppressCloseChange = false
    emit('update:modelValue', value)
}

function handlePanelConfirm(value: DateRange | null) {
    displayValue.value = value
    emit('update:modelValue', value)
    emit('change', value)
    suppressCloseChange = true
    open.value = false
}

function handlePanelClear() {
    displayValue.value = null
    emit('update:modelValue', null)
    emit('change', null)
    // 已在此处 emit change(null)，面板随后关闭时不再重复 emit
    suppressCloseChange = true
}

function handleClearClick(event: Event) {
    event.stopPropagation()
    displayValue.value = null
    emit('update:modelValue', null)
    emit('change', null)
}

function handleTriggerKeydown(event: KeyboardEvent) {
    // 键盘激活移交 reka-ui PopoverTrigger 原生处理（Enter/Space 打开）；
    // 此处仅拦截 disabled/readonly 场景，避免打开后由 open 拒绝造成状态回弹
    if (props.disabled || props.readonly) {
        event.preventDefault()
    }
}
</script>

<template>
    <PopoverRoot v-model:open="openModel">
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
                    :aria-disabled="readonly"
                    :class="triggerClasses"
                    @keydown="handleTriggerKeydown"
                >
                    <CalendarIcon
                        class="shrink-0 stroke-[3] opacity-70"
                        :class="iconSizeVariants({ size: size === 'default' ? 'md' : size })"
                    />
                    <span class="flex-1 text-left truncate font-mono text-sm flex items-center gap-1.5 min-w-0">
                        <span class="truncate">{{ formattedStart || resolvedStartPlaceholder }}</span>
                        <span class="shrink-0 opacity-60 font-bold">{{ resolvedSeparator }}</span>
                        <span class="truncate">{{ formattedEnd || resolvedEndPlaceholder }}</span>
                    </span>
                    <span class="flex items-center gap-1 shrink-0">
                        <span
                            v-if="clearable && hasValue && !disabled && !readonly"
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
                v-if="clearable && hasValue && !disabled && !readonly"
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
