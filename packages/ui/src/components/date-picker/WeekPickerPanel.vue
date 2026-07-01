<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'

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
import { useLocale } from '@/composables/useLocale'
import { getWeekStartDate } from '@/lib/date'
import { datePickerPanelVariants, datePickerShortcutVariants, datePickerFooterVariants } from './date-picker-variants'
import { type DatePickerShortcut, resolveShortcutValue } from './types'
import Button from '../button/Button.vue'
import './panel-styles.css'

interface WeekPickerPanelProps {
    modelValue?: Date | null
    weekStartsOn?: 0 | 1
    minDate?: Date
    maxDate?: Date
    shortcuts?: DatePickerShortcut[]
    clearable?: boolean
    ariaLabel?: string
}

const props = withDefaults(defineProps<WeekPickerPanelProps>(), {
    modelValue: null,
    weekStartsOn: 1,
    minDate: undefined,
    maxDate: undefined,
    shortcuts: () => [],
    clearable: true,
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: Date | null]
    confirm: [value: Date | null]
    clear: []
}>()

const { t } = useLocale()

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.weekPlaceholder'))
const resolvedClearLabel = computed(() => t('datePicker.clear'))
const resolvedConfirmLabel = computed(() => t('datePicker.confirm'))
const resolvedShortcutsLabel = computed(() => t('datePicker.today'))

const hasShortcuts = computed(() => props.shortcuts.length > 0)

const panelClasses = computed(() => cn(datePickerPanelVariants()))

const vCalendarFirstDayOfWeek = computed<1 | 2>(() => (props.weekStartsOn === 0 ? 1 : 2))

const weekAttributes = computed(() => {
    if (!props.modelValue) return []
    const start = getWeekStartDate(props.modelValue, props.weekStartsOn)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return [{
        key: 'week-range',
        highlight: {
            class: 'brutal-week-range',
            contentClass: 'brutal-week-range-content',
        },
        dates: { start, end },
    }]
})

const selectAttribute = computed(() => ({
    highlight: {
        class: 'brutal-selected',
        contentClass: 'brutal-selected-content',
    },
}))

function handleUpdate(value: Date | null) {
    if (value instanceof Date) {
        const weekStart = getWeekStartDate(value, props.weekStartsOn)
        emit('update:modelValue', weekStart)
    } else if (value === null) {
        emit('update:modelValue', null)
    }
}

function handleShortcutSelect(shortcut: DatePickerShortcut) {
    const value = resolveShortcutValue(shortcut)
    const weekStart = getWeekStartDate(value, props.weekStartsOn)
    emit('update:modelValue', weekStart)
}

function isShortcutActive(shortcut: DatePickerShortcut): boolean {
    if (!props.modelValue) return false
    const value = resolveShortcutValue(shortcut)
    const shortcutWeekStart = getWeekStartDate(value, props.weekStartsOn)
    const modelWeekStart = getWeekStartDate(props.modelValue, props.weekStartsOn)
    return modelWeekStart.toDateString() === shortcutWeekStart.toDateString()
}

function handleConfirm() {
    emit('confirm', props.modelValue)
}

function handleClear() {
    emit('clear')
    emit('update:modelValue', null)
}

const dayBaseClasses = computed(() =>
    cn(
        'flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-100 hover:bg-brutal-secondary hover:text-brutal-secondary-foreground hover:font-bold hover:shadow-brutal-sm cursor-pointer border-3 border-brutal/10',
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
        day.isToday ? 'bg-brutal-secondary text-brutal-secondary-foreground font-black border-3 border-brutal' : '',
        isOutside ? dayOutsideClasses.value : '',
        day.isDisabled ? dayDisabledClasses.value : '',
    )
}

const rootClasses = computed(() => cn('brutx-calendar', 'p-2 sm:p-3', 'bg-brutal-bg text-brutal-fg'))
const footerClasses = cn(datePickerFooterVariants())

function getShortcutClasses(shortcut: DatePickerShortcut): string {
    return cn(datePickerShortcutVariants({ active: isShortcutActive(shortcut) }))
}
</script>

<template>
    <div :class="panelClasses" role="dialog" aria-modal="true" :aria-label="resolvedAriaLabel">
        <div
            v-if="hasShortcuts"
            role="listbox"
            :aria-label="resolvedShortcutsLabel"
            class="flex flex-col gap-1 p-2 border-r-3 border-brutal min-w-[8rem]"
        >
            <button
                v-for="(shortcut, index) in shortcuts"
                :key="`week-shortcut-${index}`"
                type="button"
                role="option"
                :aria-selected="isShortcutActive(shortcut)"
                :class="getShortcutClasses(shortcut)"
                @click="handleShortcutSelect(shortcut)"
            >
                {{ shortcut.label }}
            </button>
        </div>

        <div class="flex flex-col">
            <div :class="rootClasses">
                <DatePicker
                    :model-value="modelValue"
                    mode="date"
                    :min-date="minDate"
                    :max-date="maxDate"
                    :attributes="weekAttributes"
                    :select-attribute="selectAttribute"
                    trim-weeks
                    :first-day-of-week="vCalendarFirstDayOfWeek"
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
                            :class="getDayClasses(day, dayProps.class)"
                            v-on="dayEvents"
                        >
                            {{ day.label }}
                        </div>
                    </template>
                </DatePicker>
            </div>

            <div v-if="clearable" :class="footerClasses">
                <Button variant="default" size="sm" type="button" @click="handleClear">
                    {{ resolvedClearLabel }}
                </Button>
                <Button variant="primary" size="sm" type="button" @click="handleConfirm">
                    {{ resolvedConfirmLabel }}
                </Button>
            </div>
        </div>
    </div>
</template>

<style>
.brutal-week-range {
    background-color: var(--brutal-accent) !important;
    border-radius: var(--brutal-radius) !important;
}

.brutal-week-range-content {
    color: var(--brutal-accent-foreground) !important;
}

.brutx-calendar .vc-container {
    --vc-rounded-full: var(--brutal-radius);
    --vc-highlight-solid-bg: var(--brutal-primary);
    --vc-highlight-light-bg: var(--brutal-accent);
    --vc-highlight-outline-bg: var(--brutal-bg);
    --vc-highlight-outline-border: var(--brutal-border-color);
    --vc-highlight-solid-content-color: var(--brutal-primary-foreground);
    --vc-highlight-light-content-color: var(--brutal-accent-foreground);
    --vc-highlight-outline-content-color: var(--brutal-fg);
    background: transparent;
    border: none;
}

.brutx-calendar .vc-day-layer.vc-day-box-center-center {
    display: flex;
    align-items: center;
    justify-content: center;
}

.brutx-calendar .vc-highlights .vc-highlight,
.brutx-calendar .vc-highlight-bg-solid,
.brutx-calendar .vc-highlight-bg-light {
    border-radius: var(--brutal-radius) !important;
}

.brutx-calendar .vc-container .vc-arrow {
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

.brutx-calendar .vc-container .vc-arrow:hover {
    box-shadow: calc(var(--brutal-shadow-offset-x) + 2px) calc(var(--brutal-shadow-offset-y) + 2px) 0 var(--brutal-shadow-color);
    transform: translate(-1px, -1px);
}

.brutx-calendar .vc-container .vc-arrow:active {
    transform: translateY(var(--brutal-pressed-offset, 2px));
    box-shadow: none !important;
}

.brutx-calendar .vc-container .vc-title {
    font-weight: 900;
    font-size: 0.75rem;
    letter-spacing: -0.025em;
    text-transform: uppercase;
    color: var(--brutal-fg);
    background: none;
    border: none;
    padding: 0;
}

.brutx-calendar .vc-container .vc-title:hover {
    color: var(--brutal-primary);
}

.brutx-calendar .vc-container .vc-weekday {
    font-weight: 900;
    font-size: 0.625rem;
    text-transform: uppercase;
    color: var(--brutal-fg);
    padding: 0.25rem 0;
    border-bottom: 3px solid var(--brutal-border-color);
}

.brutx-calendar .vc-container .vc-weeks {
    min-width: 0;
}

.brutx-calendar .vc-container .vc-day {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
