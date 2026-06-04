<script setup lang="ts">
import { computed } from 'vue'
import { DatePicker } from 'v-calendar'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '../../lib/utils'

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
        props.disabled ? 'opacity-50 pointer-events-none' : '',
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

const selectAttribute = computed(() => ({
    highlight: {
        class: 'brutal-selected',
        contentClass: 'brutal-selected-content',
    },
}))

const dragAttribute = computed(() => ({
    highlight: {
        class: 'brutal-range',
        contentClass: 'brutal-range-content',
    },
}))

const dayBaseClasses = computed(() =>
    cn(
        'flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-100 hover:bg-brutal-secondary hover:text-brutal-fg hover:font-bold hover:shadow-brutal-sm cursor-pointer border-3 border-brutal/10',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all'
    )
)
const dayOutsideClasses = computed(() => 'text-brutal-muted-foreground opacity-40')
const dayDisabledClasses = computed(() => 'opacity-40 cursor-not-allowed')

function getDayClasses(day: { isToday?: boolean; isDisabled?: boolean; inMonth?: boolean }, dayPropsClass?: string) {
    const isOutside = !day.inMonth

    return cn(
        dayBaseClasses.value,
        dayPropsClass,
        day.isToday ? 'bg-brutal-secondary text-brutal-fg font-black border-3 border-brutal' : '',
        isOutside ? dayOutsideClasses.value : '',
        day.isDisabled ? dayDisabledClasses.value : '',
    )
}
</script>

<template>
    <DatePicker
        :model-value="vCalendarModelValue"
        mode="date"
        :is-range="isRange"
        :class="rootClasses"
        :select-attribute="selectAttribute"
        :drag-attribute="dragAttribute"
        trim-weeks
        :first-day-of-week="1"
        :popover="false"
        @update:model-value="handleUpdate"
    >
        <template #header-prev-button>
            <ChevronLeft class="w-4 h-4" />
        </template>
        <template #header-title="{ title }">
            <span class="font-black text-xs sm:text-sm tracking-tight uppercase text-brutal-fg">
                {{ title }}
            </span>
        </template>
        <template #header-next-button>
            <ChevronRight class="w-4 h-4" />
        </template>
        <template #day-content="{ day, dayProps, dayEvents }">
            <div
                v-bind="dayProps"
                v-on="dayEvents"
                :class="getDayClasses(day, dayProps.class)"
            >
                {{ day.label }}
            </div>
        </template>
    </DatePicker>
</template>

<style>
.brutal-selected {
    background-color: var(--brutal-primary) !important;
    border: 3px solid var(--brutal-border-color) !important;
    border-radius: var(--brutal-radius) !important;
    box-shadow: var(--brutal-shadow-offset-x) var(--brutal-shadow-offset-y) 0 var(--brutal-shadow-color) !important;
    width: calc(var(--brutal-day-size, 2rem) + 2px) !important;
    height: calc(var(--brutal-day-size, 2rem) + 2px) !important;
}

@media (min-width: 640px) {
    .brutal-selected {
        width: calc(var(--brutal-day-size-sm, 2rem) + 2px) !important;
        height: calc(var(--brutal-day-size-sm, 2rem) + 2px) !important;
    }
}

.brutal-selected-content {
    color: var(--brutal-fg) !important;
    font-weight: 900 !important;
}

.brutal-range {
    background-color: var(--brutal-accent) !important;
    border-radius: var(--brutal-radius) !important;
}

.brutal-range-content {
    color: var(--brutal-fg) !important;
}

.vc-container {
    --vc-rounded-full: var(--brutal-radius);
    --vc-highlight-solid-bg: var(--brutal-primary);
    --vc-highlight-light-bg: var(--brutal-accent);
    --vc-highlight-outline-bg: var(--brutal-bg);
    --vc-highlight-outline-border: var(--brutal-border-color);
    --vc-highlight-solid-content-color: var(--brutal-fg);
    --vc-highlight-light-content-color: var(--brutal-fg);
    --vc-highlight-outline-content-color: var(--brutal-fg);
}

.vc-day-layer.vc-day-box-center-center {
    display: flex;
    align-items: center;
    justify-content: center;
}

.vc-highlights .vc-highlight,
.vc-highlight-bg-solid,
.vc-highlight-bg-light,
.vc-highlight-bg-outline {
    border-radius: var(--brutal-radius) !important;
}

.vc-container .vc-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border: 3px solid var(--brutal-border-color);
    border-radius: var(--brutal-radius);
    background-color: var(--brutal-bg);
    box-shadow: var(--brutal-shadow-offset-x) var(--brutal-shadow-offset-y) 0 var(--brutal-shadow-color);
    transition: all 0.15s ease;
    color: var(--brutal-fg);
}

.vc-container .vc-arrow:hover {
    box-shadow: calc(var(--brutal-shadow-offset-x) + 2px) calc(var(--brutal-shadow-offset-y) + 2px) 0 var(--brutal-shadow-color);
    transform: translate(-1px, -1px);
}

.vc-container .vc-arrow:active {
    transform: translateY(var(--brutal-pressed-offset, 2px));
    box-shadow: none !important;
}

.vc-container .vc-arrow.vc-prev svg,
.vc-container .vc-arrow.vc-next svg {
    width: 1rem;
    height: 1rem;
}

.vc-container .vc-title {
    font-weight: 900;
    font-size: 0.75rem;
    letter-spacing: -0.025em;
    text-transform: uppercase;
    color: var(--brutal-fg);
    background: none;
    border: none;
    padding: 0;
}

.vc-container .vc-title:hover {
    color: var(--brutal-primary);
}

.vc-container .vc-weekday {
    font-weight: 900;
    font-size: 0.625rem;
    text-transform: uppercase;
    color: var(--brutal-fg);
    padding: 0.25rem 0;
    border-bottom: 3px solid var(--brutal-border-color);
}

.vc-container .vc-weeks {
    min-width: 0;
}

.vc-container .vc-day {
    min-width: 0;
}
</style>
