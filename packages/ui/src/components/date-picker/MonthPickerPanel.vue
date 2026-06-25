<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { datePickerPanelVariants, datePickerFooterVariants } from './date-picker-variants'

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

const viewYear = ref<number>(props.modelValue?.getFullYear() ?? new Date().getFullYear())

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
    const date = new Date(viewYear.value, monthIndex, 1)
    emit('update:modelValue', date)
}

function handlePrevYear() {
    viewYear.value -= 1
}

function handleNextYear() {
    viewYear.value += 1
}

function handleConfirm() {
    emit('confirm', props.modelValue)
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
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'
    )
)
</script>

<template>
    <div :class="panelClasses" role="dialog" aria-modal="true" :aria-label="resolvedAriaLabel">
        <div class="flex flex-col">
            <div class="flex items-center justify-between p-2 border-b-3 border-brutal bg-brutal-bg">
                <button
                    type="button"
                    class="inline-flex items-center justify-center w-7 h-7 border-3 border-brutal bg-brutal-bg shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none"
                    :aria-label="t('datePicker.previousYear')"
                    @click="handlePrevYear"
                >
                    <ChevronLeft class="w-4 h-4 stroke-[3]" />
                </button>
                <span class="font-black text-sm tracking-tight uppercase text-brutal-fg">
                    {{ yearTitle }}
                </span>
                <button
                    type="button"
                    class="inline-flex items-center justify-center w-7 h-7 border-3 border-brutal bg-brutal-bg shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none"
                    :aria-label="t('datePicker.nextYear')"
                    @click="handleNextYear"
                >
                    <ChevronRight class="w-4 h-4 stroke-[3]" />
                </button>
            </div>

            <div class="grid grid-cols-3 gap-1 p-2 bg-brutal-bg" role="grid">
                <button
                    v-for="(month, index) in months"
                    :key="`month-${index}`"
                    type="button"
                    role="gridcell"
                    :aria-selected="isMonthActive(index)"
                    :disabled="isMonthDisabled(index)"
                    :class="cn(
                        monthButtonClasses,
                        isMonthActive(index) && 'bg-brutal-primary text-brutal-primary-foreground border-brutal shadow-brutal-sm font-black',
                        isMonthDisabled(index) && 'opacity-40 cursor-not-allowed hover:bg-brutal-bg hover:text-brutal-fg hover:shadow-none hover:border-brutal/10 hover:font-bold'
                    )"
                    @click="handleMonthSelect(index)"
                >
                    {{ month }}
                </button>
            </div>

            <div v-if="clearable" :class="cn(datePickerFooterVariants())">
                <button
                    type="button"
                    class="px-3 py-1 text-sm font-bold border-3 border-brutal bg-brutal-bg text-brutal-fg shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none"
                    @click="handleClear"
                >
                    {{ resolvedClearLabel }}
                </button>
                <button
                    type="button"
                    class="px-3 py-1 text-sm font-bold border-3 border-brutal bg-brutal-primary text-brutal-primary-foreground shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none"
                    @click="handleConfirm"
                >
                    {{ resolvedConfirmLabel }}
                </button>
            </div>
        </div>
    </div>
</template>
