<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { datePickerPanelVariants, datePickerFooterVariants } from './date-picker-variants'
import Button from '../button/Button.vue'

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

const currentYear = props.modelValue?.getFullYear() ?? new Date().getFullYear()
const viewDecadeStart = ref<number>(Math.floor(currentYear / 10) * 10)

watch(() => props.modelValue, (value) => {
    if (value) {
        viewDecadeStart.value = Math.floor(value.getFullYear() / 10) * 10
    }
})

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.yearPlaceholder'))
const resolvedClearLabel = computed(() => t('datePicker.clear'))
const resolvedConfirmLabel = computed(() => t('datePicker.confirm'))

const panelClasses = computed(() => cn(datePickerPanelVariants()))

const years = computed(() => {
    const result: number[] = []
    for (let i = 0; i < props.yearRange; i++) {
        result.push(viewDecadeStart.value + i)
    }
    return result
})

const decadeRange = computed(() =>
    t('datePicker.yearRange', { start: viewDecadeStart.value, end: viewDecadeStart.value + props.yearRange - 1 })
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
    const date = new Date(year, 0, 1)
    emit('update:modelValue', date)
}

function handlePrevDecade() {
    viewDecadeStart.value -= 10
}

function handleNextDecade() {
    viewDecadeStart.value += 10
}

function handleConfirm() {
    emit('confirm', props.modelValue)
}

function handleClear() {
    emit('clear')
    emit('update:modelValue', null)
}

const footerClasses = cn(datePickerFooterVariants())

function getYearClasses(year: number): string {
    return cn(
        'h-10 w-full flex items-center justify-center text-xs font-bold tracking-tight cursor-pointer',
        'border-3 border-brutal/10 transition-all duration-100',
        'hover:bg-brutal-secondary hover:text-brutal-secondary-foreground hover:font-black hover:shadow-brutal-sm hover:border-brutal',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
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
