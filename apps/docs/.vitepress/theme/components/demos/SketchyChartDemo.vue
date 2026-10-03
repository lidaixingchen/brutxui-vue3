<script setup lang="ts">
import { computed, type ComputedRef } from 'vue'
import { SketchyChart } from 'brutx-ui-vue/sketchy-chart'
import { useChartDemoLocale, type ChartDemoItem } from '@/theme/lib/sketchy-chart-demo'

const { text } = useChartDemoLocale()
const lineData: ComputedRef<ChartDemoItem[]> = computed((): ChartDemoItem[] => [
    { label: text('一月', 'January'), value: 30 },
    { label: text('二月', 'February'), value: -15 },
    { label: text('三月', 'March'), value: 45 },
    { label: text('四月', 'April'), value: 80 },
    { label: text('五月', 'May'), value: 0 },
    { label: text('六月', 'June'), value: 90 },
])

const barData: ComputedRef<ChartDemoItem[]> = computed((): ChartDemoItem[] => [
    { label: text('北区', 'North'), value: 18 },
    { label: text('南区', 'South'), value: -12 },
    { label: text('东区', 'East'), value: 0 },
    { label: text('西区', 'West'), value: 9 },
])

const pieData: ComputedRef<ChartDemoItem[]> = computed((): ChartDemoItem[] => [
    { label: text('桌面端', 'Desktop'), value: 45 },
    { label: text('移动端', 'Mobile'), value: 35 },
    { label: text('平板', 'Tablet'), value: 15 },
    { label: text('其他', 'Other'), value: 5 },
])
</script>

<template>
    <div class="w-full flex flex-col gap-8">
        <div>
            <SketchyChart :title="text('月度净变化', 'Monthly net change')" :description="text('单位：万元；零为基线。', 'Unit: CNY 10,000; zero is the baseline.')" type="line" :data="lineData" />
        </div>

        <div>
            <SketchyChart :title="text('地区订单净变化', 'Net order change by region')" :description="text('单位：笔；正负值分布在零基线两侧。', 'Unit: orders; positive and negative values lie on opposite sides of zero.')" type="bar" :data="barData" />
        </div>

        <div>
            <SketchyChart :title="text('设备访问占比', 'Device visit share')" :description="text('单位：次；占比由全部访问次数计算。', 'Unit: visits; shares use every category.')" type="pie" :data="pieData" />
        </div>
    </div>
</template>
