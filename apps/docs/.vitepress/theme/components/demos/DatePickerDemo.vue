<script setup lang="ts">
import { ref } from 'vue'
import {
    DatePicker,
    DatePickerRange,
    DateTimePicker,
    TimePicker,
    WeekPicker,
    MonthPicker,
    YearPicker,
} from 'brutx-ui-vue/date-picker'

const date = ref<Date | null>(null)
const dateRange = ref<[Date, Date] | null>(null)
const dateTime = ref<Date | null>(null)
const time = ref<Date | null>(null)
const week = ref<Date | null>(null)
const month = ref<Date | null>(null)
const year = ref<Date | null>(null)

const programmableDate = ref<Date | null>(null)
const pickerRef = ref<InstanceType<typeof DatePicker> | null>(null)

const shortcuts = [
    { label: '今天', value: () => new Date() },
    {
        label: '一周后',
        value: () => {
            const d = new Date()
            d.setDate(d.getDate() + 7)
            return d
        },
    },
]
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">DatePicker 单日期选择</p>
            <div class="flex flex-wrap items-center gap-3">
                <DatePicker v-model="date" :shortcuts="shortcuts" :clearable="true" />
                <span class="text-xs font-bold opacity-60">
                    {{ date ? date.toLocaleDateString() : '未选择' }}
                </span>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">DatePickerRange 日期范围</p>
            <DatePickerRange v-model="dateRange" />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">DateTimePicker 日期时间</p>
            <DateTimePicker v-model="dateTime" :show-seconds="true" />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">TimePicker 纯时间</p>
            <TimePicker v-model="time" :show-seconds="true" />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">WeekPicker 周选择</p>
            <WeekPicker v-model="week" :week-starts-on="1" />
        </div>

        <div class="flex flex-wrap gap-6">
            <div class="space-y-2">
                <p class="text-sm font-bold tracking-wide">MonthPicker 月份</p>
                <MonthPicker v-model="month" />
            </div>
            <div class="space-y-2">
                <p class="text-sm font-bold tracking-wide">YearPicker 年份</p>
                <YearPicker v-model="year" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">程序化控制（通过 ref 打开面板）</p>
            <p class="text-xs opacity-70 leading-relaxed">
                通过 <span class="font-mono font-black">pickerRef.open</span> 可在外部按钮中打开或关闭日期面板。
            </p>
            <div class="flex flex-wrap items-center gap-3">
                <DatePicker ref="pickerRef" v-model="programmableDate" :clearable="true" />
                <button
                    class="border-3 border-brutal bg-brutal-primary px-3 py-1 text-sm font-black text-brutal-bg shadow-brutal active:translate-y-[2px] active:shadow-none transition-all"
                    @click="pickerRef && (pickerRef.open = true)"
                >
                    打开面板
                </button>
                <button
                    class="border-3 border-brutal px-3 py-1 text-sm font-black shadow-brutal active:translate-y-[2px] active:shadow-none transition-all"
                    @click="pickerRef && (pickerRef.open = false)"
                >
                    关闭面板
                </button>
            </div>
        </div>
    </div>
</template>
