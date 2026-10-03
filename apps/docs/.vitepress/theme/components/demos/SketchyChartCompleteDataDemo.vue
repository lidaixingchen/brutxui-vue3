<script setup lang="ts">
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { SketchyChart } from 'brutx-ui-vue/sketchy-chart'
import { Button } from 'brutx-ui-vue/button'
import { useChartDemoLocale, type ChartDemoItem } from '@/theme/lib/sketchy-chart-demo'

const { text } = useChartDemoLocale()
const CATEGORY_COUNT: number = 31
const DAILY_CHANGES: readonly number[] = [12, -8, 0, 16, -4, 9, 3]
const interactive: Ref<boolean> = ref(true)
const data: ComputedRef<ChartDemoItem[]> = computed((): ChartDemoItem[] =>
    Array.from({ length: CATEGORY_COUNT }, (_: unknown, index: number): ChartDemoItem => ({
        label: text(`第 ${index + 1} 天`, `Day ${index + 1}`),
        value: DAILY_CHANGES[index % DAILY_CHANGES.length]!,
    })))
</script>

<template>
    <div class="w-full space-y-4" data-chart-demo="complete">
        <Button type="button" variant="outline" :pressed="!interactive" @click="interactive = !interactive">
            {{ text('静态图形', 'Static chart') }}
        </Button>
        <SketchyChart
            :title="text('31 天净变化', 'Net change over 31 days')"
            :description="text('单位：笔；保留每日正值、负值与零。', 'Unit: transactions; positive, negative, and zero daily changes are retained.')"
            type="bar" :data="data" :interactive="interactive"
        />
    </div>
</template>
