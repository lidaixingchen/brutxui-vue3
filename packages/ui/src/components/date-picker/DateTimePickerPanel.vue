<script setup lang="ts">
import { computed } from 'vue'
import { DatePicker } from 'v-calendar'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { datePickerPanelVariants, datePickerShortcutVariants, datePickerFooterVariants } from './date-picker-variants'
import { type DatePickerShortcut, resolveShortcutValue } from './types'
import TimePicker from './TimePicker.vue'
import Button from '../button/Button.vue'
import './panel-styles.css'

interface DateTimePickerPanelProps {
    modelValue?: Date | null
    minDate?: Date
    maxDate?: Date
    shortcuts?: DatePickerShortcut[]
    clearable?: boolean
    showSeconds?: boolean
    timeStep?: { hour?: number; minute?: number; second?: number }
    ariaLabel?: string
}

const props = withDefaults(defineProps<DateTimePickerPanelProps>(), {
    modelValue: null,
    minDate: undefined,
    maxDate: undefined,
    shortcuts: () => [],
    clearable: true,
    showSeconds: false,
    timeStep: () => ({ hour: 1, minute: 1, second: 1 }),
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: Date | null]
    confirm: [value: Date | null]
    clear: []
}>()

const { t } = useLocale()

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.dateTimePlaceholder'))
const resolvedClearLabel = computed(() => t('datePicker.clear'))
const resolvedConfirmLabel = computed(() => t('datePicker.confirm'))
const resolvedShortcutsLabel = computed(() => t('datePicker.today'))

const hasShortcuts = computed(() => props.shortcuts.length > 0)

const panelClasses = computed(() => cn(datePickerPanelVariants()))

function handleCalendarUpdate(value: Date | null) {
    if (value instanceof Date) {
        if (props.modelValue) {
            const merged = new Date(value)
            merged.setHours(
                props.modelValue.getHours(),
                props.modelValue.getMinutes(),
                props.modelValue.getSeconds()
            )
            emit('update:modelValue', merged)
        } else {
            emit('update:modelValue', value)
        }
    } else if (value === null) {
        emit('update:modelValue', null)
    }
}

function handleTimeUpdate(value: Date | null) {
    if (value instanceof Date) {
        if (props.modelValue) {
            const merged = new Date(props.modelValue)
            merged.setHours(value.getHours(), value.getMinutes(), value.getSeconds())
            emit('update:modelValue', merged)
        } else {
            emit('update:modelValue', value)
        }
    } else {
        emit('update:modelValue', null)
    }
}

function handleShortcutSelect(shortcut: DatePickerShortcut) {
    const value = resolveShortcutValue(shortcut)
    if (props.modelValue) {
        const merged = new Date(value)
        merged.setHours(
            props.modelValue.getHours(),
            props.modelValue.getMinutes(),
            props.modelValue.getSeconds()
        )
        emit('update:modelValue', merged)
    } else {
        emit('update:modelValue', value)
    }
}

function isShortcutActive(shortcut: DatePickerShortcut): boolean {
    if (!props.modelValue) return false
    const value = resolveShortcutValue(shortcut)
    return props.modelValue.toDateString() === value.toDateString()
}

function handleConfirm() {
    emit('confirm', props.modelValue)
}

function handleClear() {
    emit('clear')
    emit('update:modelValue', null)
}

const selectAttribute = computed(() => ({
    highlight: {
        class: 'brutal-selected',
        contentClass: 'brutal-selected-content',
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
                :key="`dt-shortcut-${index}`"
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
                    :select-attribute="selectAttribute"
                    trim-weeks
                    :first-day-of-week="1"
                    :popover="false"
                    @update:model-value="handleCalendarUpdate"
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

            <TimePicker
                :model-value="modelValue"
                :show-seconds="showSeconds"
                :time-step="timeStep"
                :embedded="true"
                :aria-label="t('datePicker.timePlaceholder')"
                @update:model-value="handleTimeUpdate"
            />

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
.brutx-calendar .vc-highlight-bg-solid {
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
