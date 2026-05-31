<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'

interface CalendarProps {
    modelValue?: Date | Date[] | null
    isRange?: boolean
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<CalendarProps>(), {
    isRange: false,
    disabled: false,
})

const emit = defineEmits<{
    'update:modelValue': [value: Date | Date[] | null]
}>()

const rootClasses = computed(() =>
    cn(
        'p-2 sm:p-3',
        'bg-[#FFFEF0] dark:bg-gray-900 text-black dark:text-gray-100',
        'border-2 sm:border-3 border-brutal',
        'shadow-brutal',
        'w-fit max-w-full overflow-x-auto',
        props.class
    )
)

function onDayClick(day: { id: number; date: Date }) {
    if (props.disabled) return
    if (props.isRange) {
        emit('update:modelValue', day.date as unknown as Date[])
    } else {
        emit('update:modelValue', day.date)
    }
}
</script>

<template>
    <VCalendar
        :model-value="modelValue"
        :is-range="isRange"
        :disabled="disabled"
        :class="rootClasses"
        :attributes="[]"
        trim-weeks
        :first-day-of-week="1"
        @dayclick="onDayClick"
    >
        <template #default="{ page }">
            <div class="vc-header flex items-center justify-between mb-2">
                <div class="vc-title font-black text-xs sm:text-sm tracking-tight uppercase text-black dark:text-gray-100">
                    {{ page.monthLabel }} {{ page.yearLabel }}
                </div>
            </div>
        </template>
        <template #day-content="{ day }">
            <div
                class="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-100 hover:bg-[#DDA0DD] hover:text-black hover:font-bold cursor-pointer border border-black/10 dark:border-white/10"
                :class="{
                    'bg-brutal-primary text-black font-black border-2 border-brutal shadow-brutal-sm': day.isSelected && !day.isInRange,
                    'bg-brutal-accent text-black': day.isInRange && !day.isStart && !day.isEnd,
                    'bg-brutal-secondary text-black font-black border-2 border-brutal shadow-brutal-sm': day.isStart || day.isEnd,
                    'bg-brutal-secondary text-black font-black border-2 border-brutal': day.isToday,
                    'text-gray-400 dark:text-gray-600 opacity-40': day.isOutside,
                    'opacity-40 cursor-not-allowed': day.isDisabled,
                }"
            >
                {{ day.label }}
            </div>
        </template>
    </VCalendar>
</template>
