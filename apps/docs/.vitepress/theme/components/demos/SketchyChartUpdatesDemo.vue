<script setup lang="ts">
import { computed, onBeforeUnmount, ref, type ComputedRef, type Ref } from 'vue'
import { SketchyChart } from 'brutx-ui-vue/sketchy-chart'
import { Button } from 'brutx-ui-vue/button'
import { useChartDemoLocale, type ChartDemoItem } from '@/theme/lib/sketchy-chart-demo'

type ChartType = 'line' | 'bar' | 'pie'
type Category = 'a' | 'b' | 'c'
interface SourceItem { category: Category; value: number }
const UPDATE_DELAY_MS: number = 3000
const INITIAL_ITEMS: readonly SourceItem[] = [
    { category: 'a', value: 12 }, { category: 'b', value: 24 }, { category: 'c', value: 18 },
]
const REPLACEMENT_ITEMS: readonly SourceItem[] = [
    { category: 'a', value: 18 }, { category: 'b', value: 30 }, { category: 'c', value: 6 },
]
const NEXT_TYPE: Readonly<Record<ChartType, ChartType>> = { line: 'bar', bar: 'pie', pie: 'line' }
const { text } = useChartDemoLocale()
const items: Ref<SourceItem[]> = ref(INITIAL_ITEMS.map((item: SourceItem): SourceItem => ({ ...item })))
const type: Ref<ChartType> = ref('line')
const pending: Ref<boolean> = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const typeName: ComputedRef<string> = computed((): string => ({
    line: text('折线图', 'Line chart'), bar: text('柱状图', 'Bar chart'), pie: text('饼图', 'Pie chart'),
})[type.value])
const data: ComputedRef<ChartDemoItem[]> = computed((): ChartDemoItem[] => {
    const labels: Record<Category, string> = {
        a: text('类别甲', 'Category A'), b: text('类别乙', 'Category B'), c: text('类别丙', 'Category C'),
    }
    return items.value.map((item: SourceItem): ChartDemoItem => ({ label: labels[item.category], value: item.value }))
})
function cancelUpdate(): void {
    clearTimeout(timer)
    timer = undefined
    pending.value = false
}
function schedule(update: () => void): void {
    cancelUpdate()
    pending.value = true
    timer = setTimeout((): void => {
        update()
        timer = undefined
        pending.value = false
    }, UPDATE_DELAY_MS)
}
function replaceData(): void {
    schedule((): void => { items.value = REPLACEMENT_ITEMS.map((item: SourceItem): SourceItem => ({ ...item })) })
}
function reorderData(): void {
    schedule((): void => { items.value = [...items.value].reverse() })
}
function changeType(): void { schedule((): void => { type.value = NEXT_TYPE[type.value] }) }
function reset(): void {
    cancelUpdate()
    items.value = INITIAL_ITEMS.map((item: SourceItem): SourceItem => ({ ...item }))
    type.value = 'line'
}
onBeforeUnmount(cancelUpdate)
</script>

<template>
    <div class="w-full space-y-4" data-chart-demo="updates">
        <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" :disabled="pending" @click="replaceData">{{ text('延迟替换', 'Delayed replacement') }}</Button>
            <Button type="button" variant="outline" :disabled="pending" @click="reorderData">{{ text('延迟重排', 'Delayed reorder') }}</Button>
            <Button type="button" variant="outline" :disabled="pending" @click="changeType">{{ text('延迟切换类型', 'Delayed type change') }}</Button>
            <Button type="button" variant="outline" @click="reset">{{ text('恢复初始数据', 'Reset data') }}</Button>
        </div>
        <p class="text-sm" role="status">
            {{ pending ? text('已安排更新，请先用选择器读取末项。', 'Update scheduled. Read the last item with the slider first.') : text('可安排一次更新。当前类型：', 'Schedule an update. Current type: ') + typeName }}
        </p>
        <SketchyChart
            :title="text('动态分类统计', 'Dynamic category totals')"
            :description="text('单位：笔；更新后重新从第一项探索。', 'Unit: transactions; exploration restarts at the first item after updates.')"
            :type="type" :data="data"
        />
    </div>
</template>
