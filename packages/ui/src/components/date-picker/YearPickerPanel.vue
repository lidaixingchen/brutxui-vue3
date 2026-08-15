<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { brutalPress } from '@/lib/brutal-interaction-variants'
import { useLocale } from '@/composables/useLocale'
import { datePickerPanelVariants } from './date-picker-variants'
import Button from '../button/Button.vue'
import DatePickerPanelFooter from './DatePickerPanelFooter.vue'

const DEFAULT_YEAR_RANGE = 12

interface YearPickerPanelProps {
    modelValue?: Date | null
    minDate?: Date
    maxDate?: Date
    clearable?: boolean
    yearRange?: number
    ariaLabel?: string
}

const props = withDefaults(defineProps<YearPickerPanelProps>(), {
    modelValue: null,
    minDate: undefined,
    maxDate: undefined,
    clearable: true,
    yearRange: DEFAULT_YEAR_RANGE,
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: Date | null]
    confirm: [value: Date | null]
    clear: []
}>()

const { t } = useLocale()

const modelYear = props.modelValue?.getFullYear()
// 初始兜底为当前年份所在年代：避免 SSR/首帧渲染公元 0 年代
const viewDecadeStart = ref<number>(
    Number.isFinite(modelYear) ? Math.floor(modelYear! / 10) * 10 : Math.floor(new Date().getFullYear() / 10) * 10
)

watch(() => props.modelValue, (value) => {
    // 清空（null）时回退到当前年份所在年代，与"回到当前"的预期一致
    viewDecadeStart.value = Math.floor((value?.getFullYear() ?? new Date().getFullYear()) / 10) * 10
})

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.yearPlaceholder'))
const resolvedClearLabel = computed(() => t('datePicker.clear'))
const resolvedConfirmLabel = computed(() => t('datePicker.confirm'))

const panelClasses = computed(() => cn(datePickerPanelVariants()))

// yearRange 防御性归一化：0/负数/NaN/Infinity 会导致 years 循环不执行、
// 翻页方向反转与 decadeRange 区间错乱，统一收敛为有限且 >=1 的整数
const normalizedYearRange = computed(() => {
    const range = Math.floor(props.yearRange)
    return Number.isFinite(range) && range >= 1 ? range : DEFAULT_YEAR_RANGE
})

const years = computed(() => {
    const result: number[] = []
    for (let i = 0; i < normalizedYearRange.value; i++) {
        result.push(viewDecadeStart.value + i)
    }
    return result
})

const decadeRange = computed(() =>
    t('datePicker.yearRange', { start: viewDecadeStart.value, end: viewDecadeStart.value + normalizedYearRange.value - 1 })
)

function isYearActive(year: number): boolean {
    if (!props.modelValue) return false
    return props.modelValue.getFullYear() === year
}

function isYearDisabled(year: number): boolean {
    const testDate = new Date(year, 11, 31)
    if (props.minDate && testDate < props.minDate) return true
    const startOfYear = new Date(year, 0, 1)
    if (props.maxDate && startOfYear > props.maxDate) return true
    return false
}

function handleYearSelect(year: number) {
    if (isYearDisabled(year)) return
    // 基于原值保留月/日，避免选择年份后日期数据意外改变；
    // 用 setFullYear 避免 JS 将 0-99 的年份解释为 1900+year
    const base = props.modelValue ?? new Date()
    const date = new Date(0)
    date.setFullYear(year, base.getMonth(), base.getDate())
    emit('update:modelValue', date)
}

function handlePrevDecade() {
    viewDecadeStart.value -= normalizedYearRange.value
}

function handleNextDecade() {
    viewDecadeStart.value += normalizedYearRange.value
}

function handleConfirm() {
    emit('confirm', props.modelValue)
}

function handleClear() {
    emit('clear')
    emit('update:modelValue', null)
}

function getYearClasses(year: number): string {
    return cn(
        'h-10 w-full flex items-center justify-center text-xs font-bold tracking-tight cursor-pointer',
        'border-3 border-brutal/10 transition-all duration-100',
        'hover:bg-brutal-secondary hover:text-brutal-secondary-foreground hover:font-black hover:shadow-brutal-sm hover:border-brutal',
        brutalPress,
        isYearActive(year) && 'bg-brutal-primary text-brutal-primary-foreground border-brutal shadow-brutal-sm font-black',
        isYearDisabled(year) && 'opacity-40 cursor-not-allowed hover:bg-brutal-bg hover:text-brutal-fg hover:shadow-none hover:border-brutal/10 hover:font-bold',
    )
}
</script>

<template>
    <div :class="panelClasses" role="dialog" aria-modal="true" :aria-label="resolvedAriaLabel">
        <div class="flex flex-col">
            <div class="flex items-center justify-between p-2 border-b-3 border-brutal bg-brutal-bg">
                <Button
                    variant="default"
                    size="sm"
                    class="w-7 h-7 p-0"
                    :aria-label="t('datePicker.previousDecade')"
                    @click="handlePrevDecade"
                >
                    <ChevronLeft class="w-4 h-4 stroke-[3]" />
                </Button>
                <span class="font-black text-sm tracking-tight uppercase text-brutal-fg">
                    {{ decadeRange }}
                </span>
                <Button
                    variant="default"
                    size="sm"
                    class="w-7 h-7 p-0"
                    :aria-label="t('datePicker.nextDecade')"
                    @click="handleNextDecade"
                >
                    <ChevronRight class="w-4 h-4 stroke-[3]" />
                </Button>
            </div>

            <div class="grid grid-cols-4 gap-1 p-2 bg-brutal-bg" role="grid">
                <button
                    v-for="year in years"
                    :key="`year-${year}`"
                    type="button"
                    role="gridcell"
                    :aria-selected="isYearActive(year)"
                    :disabled="isYearDisabled(year)"
                    :class="getYearClasses(year)"
                    @click="handleYearSelect(year)"
                >
                    {{ year }}
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
