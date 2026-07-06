<script setup lang="ts">
import { computed, watch, defineAsyncComponent } from 'vue'
import { TooltipRoot as Tooltip, TooltipTrigger } from 'reka-ui'
import TooltipContent from '../tooltip/TooltipContent.vue'
import TooltipProvider from '../tooltip/TooltipProvider.vue'

const DatePicker = defineAsyncComponent(async () => {
    try {
        const mod = await import('v-calendar')
        await import('v-calendar/style.css')
        return mod.DatePicker
    } catch {
        console.warn('[BrutxUI] Calendar component requires v-calendar. Install it: pnpm add v-calendar')
        return { template: '<div/>' }
    }
})
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { parseFormattedDate } from '@/lib/date'
import { brutalPressWithTransition } from '@/lib/brutal-interaction-variants'

export interface CalendarEvent {
    date: Date | string
    title: string
    [key: string]: unknown
}

interface CalendarProps {
    modelValue?: Date | Date[] | null
    isRange?: boolean
    disabled?: boolean
    class?: string
    events?: CalendarEvent[]
    eventRenderer?: (event: CalendarEvent) => unknown
    mode?: 'default' | 'card'
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
    events: () => [],
    eventRenderer: undefined,
    mode: 'default',
})

const emit = defineEmits<{
    'update:modelValue': [value: Date | Date[] | null]
}>()

const rootClasses = computed(() =>
    cn(
        'brutx-calendar',
        props.mode === 'card' ? 'mode-card w-full' : 'w-fit max-w-full overflow-x-auto',
        'p-2 sm:p-3',
        'bg-brutal-bg text-brutal-fg',
        'border-3 border-brutal',
        'shadow-brutal',
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

const dayBaseClasses = computed(() => {
    const isCard = props.mode === 'card'
    return cn(
        'flex font-semibold transition-all duration-100 hover:bg-brutal-secondary hover:text-brutal-secondary-foreground hover:font-bold hover:shadow-brutal-sm cursor-pointer border-3 border-brutal/10 relative',
        isCard
            ? 'h-auto min-h-16 flex-col items-stretch justify-start p-1 text-[10px] sm:text-xs'
            : 'h-6 w-6 sm:h-8 sm:w-8 items-center justify-center text-[10px] sm:text-xs',
        brutalPressWithTransition
    )
})
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

function isSameDay(date1: Date | string, date2: Date) {
    const d1 = typeof date1 === 'string'
        ? parseFormattedDate(date1, 'YYYY-MM-DD') ?? new Date(date1)
        : date1
    if (!(d1 instanceof Date) || isNaN(d1.getTime())) return false
    return (
        d1.getFullYear() === date2.getFullYear() &&
        d1.getMonth() === date2.getMonth() &&
        d1.getDate() === date2.getDate()
    )
}

function getDayEvents(day: { date?: Date; startDate?: Date }) {
    const dayDate = day.date || day.startDate
    if (!dayDate || !props.events) return []
    return props.events.filter(event => isSameDay(event.date, dayDate))
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
            <!-- Default mode with events: render with Tooltip and a Dot -->
            <template v-if="mode === 'default' && getDayEvents(day).length > 0">
                <TooltipProvider :delay-duration="100">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <div
                                v-bind="dayProps"
                                :class="getDayClasses(day, dayProps.class)"
                                v-on="dayEvents"
                            >
                                <span>{{ day.label }}</span>
                                <span
                                    class="absolute top-0.5 right-0.5 block h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-brutal-primary border border-brutal"
                                    data-testid="calendar-event-dot"
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div class="flex flex-col gap-1 text-xs">
                                <div
                                    v-for="event in getDayEvents(day)"
                                    :key="event.title"
                                    class="font-bold"
                                    data-testid="calendar-tooltip-event-title"
                                >
                                    {{ event.title }}
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </template>
            <!-- Default mode without events OR Card mode -->
            <template v-else>
                <div
                    v-bind="dayProps"
                    :class="getDayClasses(day, dayProps.class)"
                    v-on="dayEvents"
                >
                    <template v-if="mode === 'card'">
                        <div class="flex items-center justify-between w-full mb-1">
                            <span :class="day.isToday ? 'underline decoration-2 font-black' : ''">
                                {{ day.label }}
                            </span>
                        </div>
                        <div class="flex flex-col gap-1 w-full items-stretch" data-testid="calendar-event-list">
                            <template v-for="event in getDayEvents(day)" :key="event.title">
                                <component
                                    :is="eventRenderer(event)"
                                    v-if="eventRenderer"
                                />
                                <div
                                    v-else
                                    class="text-[9px] sm:text-[10px] leading-tight px-1.5 py-0.5 bg-brutal-bg text-brutal-fg border border-brutal shadow-[1px_1px_0px_rgba(0,0,0,1)] rounded font-mono truncate text-left"
                                    :title="event.title"
                                    data-testid="calendar-card-event-badge"
                                >
                                    {{ event.title }}
                                </div>
                            </template>
                        </div>
                    </template>
                    <template v-else>
                        {{ day.label }}
                    </template>
                </div>
            </template>
        </template>
    </DatePicker>
</template>

<style>
/* 提高特异性以替代 !important，允许下游覆盖 */
.brutx-calendar .brutal-selected {
    background-color: var(--brutal-primary);
    border: 3px solid var(--brutal-border-color);
    border-radius: var(--brutal-radius);
    box-shadow: var(--brutal-shadow-offset-x) var(--brutal-shadow-offset-y) 0 var(--brutal-shadow-color);
}

.brutx-calendar .brutal-selected-content {
    color: var(--brutal-primary-foreground);
    font-weight: 900;
}

.brutx-calendar .brutal-range {
    background-color: var(--brutal-accent);
    border-radius: var(--brutal-radius);
}

.brutx-calendar .brutal-range-content {
    color: var(--brutal-accent-foreground);
}

.brutx-calendar {
    --vc-rounded-full: var(--brutal-radius);
    --vc-highlight-solid-bg: var(--brutal-primary);
    --vc-highlight-light-bg: var(--brutal-accent);
    --vc-highlight-outline-bg: var(--brutal-bg);
    --vc-highlight-outline-border: var(--brutal-border-color);
    --vc-highlight-solid-content-color: var(--brutal-primary-foreground);
    --vc-highlight-light-content-color: var(--brutal-accent-foreground);
    --vc-highlight-outline-content-color: var(--brutal-fg);
}

.brutx-calendar .vc-day-layer.vc-day-box-center-center {
    display: flex;
    align-items: center;
    justify-content: center;
}

.brutx-calendar .vc-highlights .vc-highlight,
.brutx-calendar .vc-highlight-bg-solid,
.brutx-calendar .vc-highlight-bg-light,
.brutx-calendar .vc-highlight-bg-outline {
    border-radius: var(--brutal-radius);
}

.brutx-calendar .vc-arrow {
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

.brutx-calendar .vc-arrow:hover {
    box-shadow: calc(var(--brutal-shadow-offset-x) + 2px) calc(var(--brutal-shadow-offset-y) + 2px) 0 var(--brutal-shadow-color);
    transform: translate(-1px, -1px);
}

.brutx-calendar .vc-arrow:active {
    transform: translateY(var(--brutal-pressed-offset, 2px));
    box-shadow: none;
}

.brutx-calendar .vc-arrow.vc-prev svg,
.brutx-calendar .vc-arrow.vc-next svg {
    width: 1rem;
    height: 1rem;
}

.brutx-calendar .vc-title {
    font-weight: 900;
    font-size: 0.75rem;
    letter-spacing: -0.025em;
    text-transform: uppercase;
    color: var(--brutal-fg);
    background: none;
    border: none;
    padding: 0;
}

.brutx-calendar .vc-title:hover {
    color: var(--brutal-primary);
}

.brutx-calendar .vc-weekday {
    font-weight: 900;
    font-size: 0.625rem;
    text-transform: uppercase;
    color: var(--brutal-fg);
    padding: 0.25rem 0;
    border-bottom: 3px solid var(--brutal-border-color);
}

.brutx-calendar .vc-weeks {
    min-width: 0;
}

.brutx-calendar .vc-day {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Mode card custom overrides to make weeks stretch and days auto-resize */
.brutx-calendar.mode-card {
    width: 100%;
    max-width: 100%;
}

.brutx-calendar.mode-card .vc-weeks {
    width: 100%;
}

.brutx-calendar.mode-card .vc-day {
    height: auto;
    min-height: 4rem; /* 4rem = min-h-16 */
    align-items: stretch;
    justify-content: flex-start;
}
</style>
