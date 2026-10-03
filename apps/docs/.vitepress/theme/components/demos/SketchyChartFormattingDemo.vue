<script setup lang="ts">
import { computed, type ComputedRef } from 'vue'
import { SketchyChart } from 'brutx-ui-vue/sketchy-chart'
import { useChartDemoLocale, type ChartDemoItem } from '@/theme/lib/sketchy-chart-demo'

const { language, text } = useChartDemoLocale()
const currency: ComputedRef<Intl.NumberFormat> = computed((): Intl.NumberFormat =>
    new Intl.NumberFormat(language.value, { style: 'currency', currency: 'CNY' }))
const changes: ComputedRef<ChartDemoItem[]> = computed((): ChartDemoItem[] => [
    { label: text('一月', 'January'), value: -1200 },
    { label: text('二月', 'February'), value: 0 },
    { label: text('三月', 'March'), value: 3200.5 },
])
const donations: ComputedRef<ChartDemoItem[]> = computed((): ChartDemoItem[] => [
    { label: text('教育', 'Education'), value: 1200 },
    { label: text('环境', 'Environment'), value: 600 },
    { label: text('其他', 'Other'), value: 0 },
])
function formatCurrency(value: number): string { return currency.value.format(value) }
</script>

<template>
    <div class="w-full space-y-8" data-chart-demo="formatting">
        <SketchyChart
            :title="text('月度净收入', 'Monthly net income')" :description="text('单位：人民币元', 'Unit: CNY')"
            type="bar" :data="changes" :value-formatter="formatCurrency"
        >
            <template #tooltip="{ label, formattedValue }">
                <p class="font-bold">{{ label }}</p>
                <p>{{ text('净收入：', 'Net income: ') }}{{ formattedValue }}</p>
            </template>
        </SketchyChart>
        <SketchyChart
            :title="text('捐款用途', 'Donation allocation')" :description="text('单位：人民币元；占比由原始金额计算。', 'Unit: CNY; shares are calculated from the original amounts.')"
            type="pie" :data="donations" :value-formatter="formatCurrency"
        >
            <template #tooltip="{ label, formattedValue, formattedPercentage }">
                <p class="font-bold">{{ label }}</p>
                <p>{{ formattedValue }} · {{ formattedPercentage }}</p>
            </template>
        </SketchyChart>
    </div>
</template>
