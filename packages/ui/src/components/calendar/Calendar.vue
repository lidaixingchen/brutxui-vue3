<script setup lang="ts">
import { computed, ref } from 'vue'
import { Calendar as VCalendar } from 'v-calendar'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'

interface CalendarProps {
    modelValue?: Date | Date[] | null
    isRange?: boolean
    disabled?: boolean
    class?: string
}

interface DateRangeValue {
    start: Date
    end: Date
}

const props = withDefaults(defineProps<CalendarProps>(), {
    modelValue: undefined,
    isRange: false,
    disabled: false,
    class: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: Date | Date[] | null]
}>()

const rootClasses = computed(() =>
    cn(
        'p-2 sm:p-3',
        'bg-brutal-bg text-brutal-fg',
        'border-3 border-brutal',
        'shadow-brutal',
        'w-fit max-w-full overflow-x-auto',
        props.class
    )
)

const vCalendarModelValue = computed<Date | DateRangeValue | null>(() => {
    if (props.isRange && Array.isArray(props.modelValue) && props.modelValue.length === 2) {
        return { start: props.modelValue[0], end: props.modelValue[1] }
    }
    if (props.isRange) return null
    if (props.modelValue instanceof Date) return props.modelValue
    return null
})

function handleUpdate(value: Date | DateRangeValue | null) {
    if (props.disabled) return
    if (props.isRange) {
        if (value && typeof value === 'object' && 'start' in value && 'end' in value) {
            emit('update:modelValue', [value.start, value.end])
        } else {
            emit('update:modelValue', null)
        }
    } else {
        if (value instanceof Date || value === null) {
            emit('update:modelValue', value)
        } else {
            emit('update:modelValue', null)
        }
    }
}

const { t } = useLocale()

const calendarRef = ref<InstanceType<typeof VCalendar> | null>(null)

function navigatePrev() {
    calendarRef.value?.move(-1)
}

function navigateNext() {
    calendarRef.value?.move(1)
}

const dayBaseClasses = computed(() =>
    cn(
        'flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-100 hover:bg-brutal-secondary hover:text-brutal-fg hover:font-bold cursor-pointer border-3 border-brutal/10',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all'
    )
)
const daySelectedClasses = computed(() => 'bg-brutal-primary text-brutal-fg font-black border-3 border-brutal shadow-brutal-sm')
const dayInRangeClasses = computed(() => 'bg-brutal-accent text-brutal-fg')
const dayRangeEndpointClasses = computed(() => 'bg-brutal-secondary text-brutal-fg font-black border-3 border-brutal shadow-brutal-sm')
const dayTodayClasses = computed(() => 'bg-brutal-secondary text-brutal-fg font-black border-3 border-brutal')
const dayOutsideClasses = computed(() => 'text-brutal-muted-foreground opacity-40')
const dayDisabledClasses = computed(() => 'opacity-40 cursor-not-allowed')

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate()
}

function getDayClasses(day: { isToday?: boolean; isDisabled?: boolean; inMonth?: boolean; startDate: Date }) {
    const isOutside = !day.inMonth
    let isSelected = false
    let isInRange = false
    let isStart = false
    let isEnd = false

    if (props.isRange && Array.isArray(props.modelValue) && props.modelValue.length === 2) {
        const [rangeStart, rangeEnd] = props.modelValue
        isStart = isSameDay(day.startDate, rangeStart)
        isEnd = isSameDay(day.startDate, rangeEnd)
        isInRange = day.startDate > rangeStart && day.startDate < rangeEnd
        isSelected = isStart || isEnd
    } else if (props.modelValue instanceof Date) {
        isSelected = isSameDay(day.startDate, props.modelValue)
    }

    return cn(
        dayBaseClasses.value,
        isSelected && !isInRange ? daySelectedClasses.value : '',
        isInRange && !isStart && !isEnd ? dayInRangeClasses.value : '',
        (isStart || isEnd) ? dayRangeEndpointClasses.value : '',
        day.isToday ? dayTodayClasses.value : '',
        isOutside ? dayOutsideClasses.value : '',
        day.isDisabled ? dayDisabledClasses.value : '',
    )
}
</script>

<template>
    <VCalendar
        ref="calendarRef"
        :model-value="vCalendarModelValue"
        :mode="isRange ? 'range' : 'date'"
        :disabled="disabled"
        :class="rootClasses"
        :attributes="[]"
        trim-weeks
        :first-day-of-week="1"
        @update:model-value="handleUpdate"
    >
        <template #default="{ page }">
            <div class="vc-header flex items-center justify-between mb-2">
                <button
                    type="button"
                    class="inline-flex items-center justify-center h-6 w-6 border-3 border-brutal rounded-brutal bg-brutal-bg shadow-brutal hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all"
                    @click="navigatePrev"
                    :aria-label="t('calendar.previousMonth')"
                >
                    <ChevronLeft class="w-4 h-4" />
                </button>
                <div class="vc-title font-black text-xs sm:text-sm tracking-tight uppercase text-brutal-fg">
                    {{ page.monthLabel }} {{ page.yearLabel }}
                </div>
                <button
                    type="button"
                    class="inline-flex items-center justify-center h-6 w-6 border-3 border-brutal rounded-brutal bg-brutal-bg shadow-brutal hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all"
                    @click="navigateNext"
                    :aria-label="t('calendar.nextMonth')"
                >
                    <ChevronRight class="w-4 h-4" />
                </button>
            </div>
        </template>
        <template #day-content="{ day }">
            <div
                :class="getDayClasses(day)"
            >
                {{ day.label }}
            </div>
        </template>
    </VCalendar>
</template>
