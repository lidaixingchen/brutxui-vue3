<script setup lang="ts">
import { computed, watch } from 'vue'
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
        'brutx-calendar',
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

function handleDrag(value: DateRangeValue) {
    if (props.disabled) return
    if (value && typeof value === 'object' && 'start' in value && 'end' in value) {
        emit('update:modelValue', [value.start, value.end])
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
        'flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-100 hover:bg-brutal-secondary hover:text-brutal-secondary-foreground hover:font-bold hover:shadow-brutal-sm cursor-pointer border-3 border-brutal/10',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all'
    )
)
const dayOutsideClasses = computed(() => 'text-brutal-muted-foreground opacity-40')
const dayDisabledClasses = computed(() => 'opacity-40 cursor-not-allowed')

const dayClassesCache = new Map<string, string>()

watch([dayBaseClasses, dayOutsideClasses, dayDisabledClasses], () => {
    dayClassesCache.clear()
})

function getDayClasses(day: { isToday?: boolean; isDisabled?: boolean; inMonth?: boolean }, dayPropsClass?: string) {
    const key = `${day.isToday}-${day.isDisabled}-${day.inMonth}-${dayPropsClass ?? ''}`
    const cached = dayClassesCache.get(key)
    if (cached !== undefined) return cached

    const isOutside = !day.inMonth
    const result = cn(
        dayBaseClasses.value,
        dayPropsClass,
        day.isToday ? 'bg-brutal-secondary text-brutal-secondary-foreground font-black border-3 border-brutal' : '',
        isOutside ? dayOutsideClasses.value : '',
        day.isDisabled ? dayDisabledClasses.value : '',
    )

    dayClassesCache.set(key, result)
    return result
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
        @drag="handleDrag"
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
                :class="getDayClasses(day, dayProps.class)"
                v-on="dayEvents"
            >
                {{ day.label }}
            </div>
        </template>
    </DatePicker>
</template>

<style scoped>
:global(.brutal-selected) {
    background-color: var(--brutal-primary) !important;
    border: 3px solid var(--brutal-border-color) !important;
    border-radius: var(--brutal-radius) !important;
    box-shadow: var(--brutal-shadow-offset-x) var(--brutal-shadow-offset-y) 0 var(--brutal-shadow-color) !important;
}

:global(.brutal-selected-content) {
    color: var(--brutal-primary-foreground) !important;
    font-weight: 900 !important;
}

:global(.brutal-range) {
    background-color: var(--brutal-accent) !important;
    border-radius: var(--brutal-radius) !important;
}

:global(.brutal-range-content) {
    color: var(--brutal-accent-foreground) !important;
}

:global(.brutx-calendar) {
    --vc-rounded-full: var(--brutal-radius);
    --vc-highlight-solid-bg: var(--brutal-primary);
    --vc-highlight-light-bg: var(--brutal-accent);
    --vc-highlight-outline-bg: var(--brutal-bg);
    --vc-highlight-outline-border: var(--brutal-border-color);
    --vc-highlight-solid-content-color: var(--brutal-primary-foreground);
    --vc-highlight-light-content-color: var(--brutal-accent-foreground);
    --vc-highlight-outline-content-color: var(--brutal-fg);
}

:global(.brutx-calendar .vc-day-layer.vc-day-box-center-center) {
    display: flex;
    align-items: center;
    justify-content: center;
}

:global(.brutx-calendar .vc-highlights .vc-highlight),
:global(.brutx-calendar .vc-highlight-bg-solid),
:global(.brutx-calendar .vc-highlight-bg-light),
:global(.brutx-calendar .vc-highlight-bg-outline) {
    border-radius: var(--brutal-radius) !important;
}

:global(.brutx-calendar .vc-arrow) {
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

:global(.brutx-calendar .vc-arrow:hover) {
    box-shadow: calc(var(--brutal-shadow-offset-x) + 2px) calc(var(--brutal-shadow-offset-y) + 2px) 0 var(--brutal-shadow-color);
    transform: translate(-1px, -1px);
}

:global(.brutx-calendar .vc-arrow:active) {
    transform: translateY(var(--brutal-pressed-offset, 2px));
    box-shadow: none !important;
}

:global(.brutx-calendar .vc-arrow.vc-prev svg),
:global(.brutx-calendar .vc-arrow.vc-next svg) {
    width: 1rem;
    height: 1rem;
}

:global(.brutx-calendar .vc-title) {
    font-weight: 900;
    font-size: 0.75rem;
    letter-spacing: -0.025em;
    text-transform: uppercase;
    color: var(--brutal-fg);
    background: none;
    border: none;
    padding: 0;
}

:global(.brutx-calendar .vc-title:hover) {
    color: var(--brutal-primary);
}

:global(.brutx-calendar .vc-weekday) {
    font-weight: 900;
    font-size: 0.625rem;
    text-transform: uppercase;
    color: var(--brutal-fg);
    padding: 0.25rem 0;
    border-bottom: 3px solid var(--brutal-border-color);
}

:global(.brutx-calendar .vc-weeks) {
    min-width: 0;
}

:global(.brutx-calendar .vc-day) {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
