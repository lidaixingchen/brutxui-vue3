<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { brutalPress } from '@/lib/brutal-interaction-variants'
import { useLocale } from '@/composables/useLocale'
import { datePickerPanelVariants } from './date-picker-variants'
import Button from '../button/Button.vue'
import DatePickerPanelFooter from './DatePickerPanelFooter.vue'

interface MonthPickerPanelProps {
    modelValue?: Date | null
    minDate?: Date
    maxDate?: Date
    clearable?: boolean
    ariaLabel?: string
}

const props = withDefaults(defineProps<MonthPickerPanelProps>(), {
    modelValue: null,
    minDate: undefined,
    maxDate: undefined,
    clearable: true,
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: Date | null]
    confirm: [value: Date | null]
    clear: []
}>()

const { locale, t } = useLocale()

const modelYear = props.modelValue?.getFullYear()
// 初始兜底为当前年份：避免 SSR/首帧渲染公元 0 年
const viewYear = ref<number>(Number.isFinite(modelYear) ? modelYear! : new Date().getFullYear())

watch(() => props.modelValue, (value) => {
    if (value) viewYear.value = value.getFullYear()
})

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.monthPlaceholder'))
const resolvedClearLabel = computed(() => t('datePicker.clear'))
const resolvedConfirmLabel = computed(() => t('datePicker.confirm'))

const panelClasses = computed(() => cn(datePickerPanelVariants()))

const months = computed(() => locale.value.datePicker.months)

const yearTitle = computed(() => String(viewYear.value))

function isMonthActive(monthIndex: number): boolean {
    if (!props.modelValue) return false
    return props.modelValue.getFullYear() === viewYear.value &&
        props.modelValue.getMonth() === monthIndex
}

function isMonthDisabled(monthIndex: number): boolean {
    const testDate = new Date(viewYear.value, monthIndex, 1)
    const endOfMonth = new Date(viewYear.value, monthIndex + 1, 0)
    if (props.minDate && endOfMonth < props.minDate) return true
    if (props.maxDate && testDate > props.maxDate) return true
    return false
}

function handleMonthSelect(monthIndex: number) {
    if (isMonthDisabled(monthIndex)) return
    let date = new Date(viewYear.value, monthIndex, 1)
    // 收敛到 [minDate, maxDate] 区间：月份面板的边界判断基于整月，
    // 选中值本身可能落在区间外（如 minDate 为月中）
    if (props.minDate && date < props.minDate) date = props.minDate
    if (props.maxDate && date > props.maxDate) date = props.maxDate
    emit('update:modelValue', date)
}

const canGoPrevYear = computed(() => {
    if (!props.minDate) return true
    return viewYear.value - 1 >= props.minDate.getFullYear()
})

const canGoNextYear = computed(() => {
    if (!props.maxDate) return true
    return viewYear.value + 1 <= props.maxDate.getFullYear()
})

function handlePrevYear() {
    if (!canGoPrevYear.value) return
    viewYear.value -= 1
}

function handleNextYear() {
    if (!canGoNextYear.value) return
    viewYear.value += 1
}

function handleConfirm() {
    if (!props.modelValue) {
        emit('confirm', null)
        return
    }
    // 确认时校验 modelValue 与 viewYear 一致：翻年未选月份时按 viewYear 重新生成，
    // 保证提交值与面板可视状态一致；生成值需与 handleMonthSelect 相同地收敛到 [minDate, maxDate]
    if (props.modelValue.getFullYear() === viewYear.value) {
        emit('confirm', props.modelValue)
        return
    }
    let nextDate = new Date(viewYear.value, props.modelValue.getMonth(), 1)
    if (props.minDate && nextDate < props.minDate) nextDate = props.minDate
    if (props.maxDate && nextDate > props.maxDate) nextDate = props.maxDate
    emit('confirm', nextDate)
}

function handleClear() {
    emit('clear')
    emit('update:modelValue', null)
}

const monthButtonClasses = computed(() =>
    cn(
        'h-10 w-full flex items-center justify-center text-xs font-bold uppercase tracking-tight cursor-pointer',
        'border-3 border-brutal/10 transition-all duration-100',
        'hover:bg-brutal-secondary hover:text-brutal-secondary-foreground hover:font-black hover:shadow-brutal-sm hover:border-brutal',
        brutalPress
    )
)

function getMonthClasses(monthIndex: number): string {
    return cn(
        monthButtonClasses.value,
        isMonthActive(monthIndex) && 'bg-brutal-primary text-brutal-primary-foreground border-brutal shadow-brutal-sm font-black',
        isMonthDisabled(monthIndex) && 'opacity-40 cursor-not-allowed hover:bg-brutal-bg hover:text-brutal-fg hover:shadow-none hover:border-brutal/10 hover:font-bold',
    )
}
</script>

<template>
    <div :class="panelClasses" role="dialog" :aria-label="resolvedAriaLabel">
        <div class="flex flex-col">
            <div class="flex items-center justify-between p-2 border-b-3 border-brutal bg-brutal-bg">
                <Button
                    variant="default"
                    size="sm"
                    class="w-7 h-7 p-0"
                    :disabled="!canGoPrevYear"
                    :aria-label="t('datePicker.previousYear')"
                    @click="handlePrevYear"
                >
                    <ChevronLeft class="w-4 h-4 stroke-[3]" />
                </Button>
                <span class="font-black text-sm tracking-tight uppercase text-brutal-fg">
                    {{ yearTitle }}
                </span>
                <Button
                    variant="default"
                    size="sm"
                    class="w-7 h-7 p-0"
                    :disabled="!canGoNextYear"
                    :aria-label="t('datePicker.nextYear')"
                    @click="handleNextYear"
                >
                    <ChevronRight class="w-4 h-4 stroke-[3]" />
                </Button>
            </div>

            <div class="grid grid-cols-4 gap-1 p-2 bg-brutal-bg" role="grid">
                <button
                    v-for="(month, index) in months"
                    :key="`month-${index}`"
                    type="button"
                    role="gridcell"
                    :aria-selected="isMonthActive(index)"
                    :disabled="isMonthDisabled(index)"
                    :class="getMonthClasses(index)"
                    @click="handleMonthSelect(index)"
                >
                    {{ month }}
                </button>
            </div>

            <DatePickerPanelFooter
                v-if="clearable"
                :clear-label="resolvedClearLabel"
                :confirm-label="resolvedConfirmLabel"
                @clear="handleClear"
                @confirm="handleConfirm"
            />
        </div>
    </div>
</template>
