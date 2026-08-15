<script setup lang="ts">
import { computed, useId } from 'vue'
import { SelectRoot, SelectValue } from 'reka-ui'
import SelectTrigger from '../select/SelectTrigger.vue'
import SelectContent from '../select/SelectContent.vue'
import SelectItem from '../select/SelectItem.vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { timePickerPanelVariants, timePickerTriggerVariants } from './date-picker-variants'

interface TimePickerProps {
    modelValue?: Date | null
    showSeconds?: boolean
    timeStep?: { hour?: number; minute?: number; second?: number }
    disabled?: boolean
    embedded?: boolean
    ariaLabel?: string
}

const props = withDefaults(defineProps<TimePickerProps>(), {
    modelValue: null,
    showSeconds: false,
    timeStep: () => ({ hour: 1, minute: 1, second: 1 }),
    disabled: false,
    embedded: false,
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: Date | null]
}>()

const { t } = useLocale()

function normalizeStep(step: number | undefined, max: number): number {
    const s = Math.floor(step ?? 1)
    return Number.isFinite(s) && s >= 1 ? Math.min(s, max) : 1
}

const hourStep = computed(() => normalizeStep(props.timeStep?.hour, 24))
const minuteStep = computed(() => normalizeStep(props.timeStep?.minute, 60))
const secondStep = computed(() => normalizeStep(props.timeStep?.second, 60))

const currentHour = computed(() => props.modelValue?.getHours() ?? 0)
const currentMinute = computed(() => props.modelValue?.getMinutes() ?? 0)
const currentSecond = computed(() => props.modelValue?.getSeconds() ?? 0)

function buildOptions(max: number, step: number, currentValue?: number): number[] {
    const options: number[] = []
    for (let i = 0; i < max; i += step) {
        options.push(i)
    }
    if (currentValue !== undefined && !options.includes(currentValue)) {
        // 保留原值插入而非就近对齐网格点：用于回显当前选中项（如 step=15 时分钟为 7），
        // 是刻意取舍——固定步长列表只约束可选项，不强制选项落在网格上
        options.push(currentValue)
        options.sort((a, b) => a - b)
    }
    return options
}

const hourOptions = computed(() => buildOptions(24, hourStep.value, currentHour.value))
const minuteOptions = computed(() => buildOptions(60, minuteStep.value, currentMinute.value))
const secondOptions = computed(() => buildOptions(60, secondStep.value, currentSecond.value))

function pad2(value: number): string {
    return value.toString().padStart(2, '0')
}

function ensureDate(): Date {
    // 校验 getTime() 有效性：Invalid Date 的 instanceof 判断会通过，
    // 但后续 setHours 会继续产出 NaN 时间
    if (props.modelValue instanceof Date && !Number.isNaN(props.modelValue.getTime())) {
        return new Date(props.modelValue.getTime())
    }
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
}

function handleHourChange(value: string) {
    if (props.disabled) return
    const date = ensureDate()
    date.setHours(parseInt(value, 10))
    emit('update:modelValue', date)
}

function handleMinuteChange(value: string) {
    if (props.disabled) return
    const date = ensureDate()
    date.setMinutes(parseInt(value, 10))
    emit('update:modelValue', date)
}

function handleSecondChange(value: string) {
    if (props.disabled) return
    const date = ensureDate()
    date.setSeconds(parseInt(value, 10))
    emit('update:modelValue', date)
}

const hourValue = computed(() => String(currentHour.value))
const minuteValue = computed(() => String(currentMinute.value))
const secondValue = computed(() => String(currentSecond.value))

const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('datePicker.timePlaceholder'))

const hourId = `time-picker-hour-${useId()}`
const minuteId = `time-picker-minute-${useId()}`
const secondId = `time-picker-second-${useId()}`

const rootClasses = computed(() => cn(timePickerPanelVariants({ embedded: props.embedded })))

const triggerClass = timePickerTriggerVariants()
const triggerIconClass = 'h-3 w-3'
const contentClass = 'max-h-48 min-w-[3rem]'
const itemClass = 'justify-center font-mono py-1.5 pl-6 pr-3'
const itemIndicatorClass = 'left-1 h-3 w-3'
const itemIconClass = 'h-3 w-3'
</script>

<template>
    <div
        :class="rootClasses"
        role="group"
        :aria-label="resolvedAriaLabel"
    >
        <div class="flex flex-col items-center">
            <label :for="hourId" class="text-[10px] font-black uppercase tracking-tight text-brutal-fg mb-0.5">
                {{ t('datePicker.hour') }}
            </label>
            <SelectRoot
                :model-value="hourValue"
                :disabled="disabled"
                @update:model-value="handleHourChange"
            >
                <SelectTrigger
                    :id="hourId"
                    size="sm"
                    :class="triggerClass"
                    :icon-class="triggerIconClass"
                    :aria-label="t('datePicker.hour')"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent :class="contentClass">
                    <SelectItem
                        v-for="h in hourOptions"
                        :key="h"
                        :value="String(h)"
                        :class="itemClass"
                        :indicator-class="itemIndicatorClass"
                        :icon-class="itemIconClass"
                    >
                        {{ pad2(h) }}
                    </SelectItem>
                </SelectContent>
            </SelectRoot>
        </div>
        <span class="font-black text-lg text-brutal-fg mt-3">:</span>
        <div class="flex flex-col items-center">
            <label :for="minuteId" class="text-[10px] font-black uppercase tracking-tight text-brutal-fg mb-0.5">
                {{ t('datePicker.minute') }}
            </label>
            <SelectRoot
                :model-value="minuteValue"
                :disabled="disabled"
                @update:model-value="handleMinuteChange"
            >
                <SelectTrigger
                    :id="minuteId"
                    size="sm"
                    :class="triggerClass"
                    :icon-class="triggerIconClass"
                    :aria-label="t('datePicker.minute')"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent :class="contentClass">
                    <SelectItem
                        v-for="m in minuteOptions"
                        :key="m"
                        :value="String(m)"
                        :class="itemClass"
                        :indicator-class="itemIndicatorClass"
                        :icon-class="itemIconClass"
                    >
                        {{ pad2(m) }}
                    </SelectItem>
                </SelectContent>
            </SelectRoot>
        </div>
        <template v-if="showSeconds">
            <span class="font-black text-lg text-brutal-fg mt-3">:</span>
            <div class="flex flex-col items-center">
                <label :for="secondId" class="text-[10px] font-black uppercase tracking-tight text-brutal-fg mb-0.5">
                    {{ t('datePicker.second') }}
                </label>
                <SelectRoot
                    :model-value="secondValue"
                    :disabled="disabled"
                    @update:model-value="handleSecondChange"
                >
                    <SelectTrigger
                        :id="secondId"
                        size="sm"
                        :class="triggerClass"
                        :icon-class="triggerIconClass"
                        :aria-label="t('datePicker.second')"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent :class="contentClass">
                        <SelectItem
                            v-for="s in secondOptions"
                            :key="s"
                            :value="String(s)"
                            :class="itemClass"
                            :indicator-class="itemIndicatorClass"
                            :icon-class="itemIconClass"
                        >
                            {{ pad2(s) }}
                        </SelectItem>
                    </SelectContent>
                </SelectRoot>
            </div>
        </template>
    </div>
</template>
