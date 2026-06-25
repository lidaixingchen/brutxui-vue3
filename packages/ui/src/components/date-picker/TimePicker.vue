<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { timePickerVariants } from './date-picker-variants'

interface TimePickerProps {
    modelValue?: Date | null
    showSeconds?: boolean
    timeStep?: { hour?: number; minute?: number; second?: number }
    disabled?: boolean
    ariaLabel?: string
}

const props = withDefaults(defineProps<TimePickerProps>(), {
    modelValue: null,
    showSeconds: false,
    timeStep: () => ({ hour: 1, minute: 1, second: 1 }),
    disabled: false,
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: Date | null]
}>()

const { t } = useLocale()

const hourStep = computed(() => Math.max(1, props.timeStep?.hour ?? 1))
const minuteStep = computed(() => Math.max(1, props.timeStep?.minute ?? 1))
const secondStep = computed(() => Math.max(1, props.timeStep?.second ?? 1))

const currentHour = computed(() => props.modelValue?.getHours() ?? 0)
const currentMinute = computed(() => props.modelValue?.getMinutes() ?? 0)
const currentSecond = computed(() => props.modelValue?.getSeconds() ?? 0)

function buildOptions(max: number, step: number): number[] {
    const options: number[] = []
    for (let i = 0; i < max; i += step) {
        options.push(i)
    }
    return options
}

const hourOptions = computed(() => buildOptions(24, hourStep.value))
const minuteOptions = computed(() => buildOptions(60, minuteStep.value))
const secondOptions = computed(() => buildOptions(60, secondStep.value))

function pad2(value: number): string {
    return value.toString().padStart(2, '0')
}

function ensureDate(): Date {
    if (props.modelValue instanceof Date) return new Date(props.modelValue.getTime())
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
}

function handleHourChange(event: Event) {
    if (props.disabled) return
    const target = event.target as HTMLSelectElement
    const date = ensureDate()
    date.setHours(parseInt(target.value, 10))
    emit('update:modelValue', date)
}

function handleMinuteChange(event: Event) {
    if (props.disabled) return
    const target = event.target as HTMLSelectElement
    const date = ensureDate()
    date.setMinutes(parseInt(target.value, 10))
    emit('update:modelValue', date)
}

function handleSecondChange(event: Event) {
    if (props.disabled) return
    const target = event.target as HTMLSelectElement
    const date = ensureDate()
    date.setSeconds(parseInt(target.value, 10))
    emit('update:modelValue', date)
}

const selectClasses = computed(() =>
    cn(
        timePickerVariants(),
        'cursor-pointer appearance-none bg-brutal-bg',
        props.disabled && 'opacity-50 pointer-events-none'
    )
)

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.timePlaceholder'))
</script>

<template>
    <div
        class="flex items-center gap-1 p-2 border-t-3 border-brutal"
        role="group"
        :aria-label="resolvedAriaLabel"
    >
        <div class="flex flex-col items-center">
            <label class="text-[10px] font-black uppercase tracking-tight text-brutal-fg mb-0.5">
                {{ t('datePicker.hour') }}
            </label>
            <select
                :value="currentHour"
                :disabled="disabled"
                :aria-label="t('datePicker.hour')"
                :class="selectClasses"
                @change="handleHourChange"
            >
                <option v-for="h in hourOptions" :key="h" :value="h">
                    {{ pad2(h) }}
                </option>
            </select>
        </div>
        <span class="font-black text-lg text-brutal-fg mt-3">:</span>
        <div class="flex flex-col items-center">
            <label class="text-[10px] font-black uppercase tracking-tight text-brutal-fg mb-0.5">
                {{ t('datePicker.minute') }}
            </label>
            <select
                :value="currentMinute"
                :disabled="disabled"
                :aria-label="t('datePicker.minute')"
                :class="selectClasses"
                @change="handleMinuteChange"
            >
                <option v-for="m in minuteOptions" :key="m" :value="m">
                    {{ pad2(m) }}
                </option>
            </select>
        </div>
        <template v-if="showSeconds">
            <span class="font-black text-lg text-brutal-fg mt-3">:</span>
            <div class="flex flex-col items-center">
                <label class="text-[10px] font-black uppercase tracking-tight text-brutal-fg mb-0.5">
                    {{ t('datePicker.second') }}
                </label>
                <select
                    :value="currentSecond"
                    :disabled="disabled"
                    :aria-label="t('datePicker.second')"
                    :class="selectClasses"
                    @change="handleSecondChange"
                >
                    <option v-for="s in secondOptions" :key="s" :value="s">
                        {{ pad2(s) }}
                    </option>
                </select>
            </div>
        </template>
    </div>
</template>
