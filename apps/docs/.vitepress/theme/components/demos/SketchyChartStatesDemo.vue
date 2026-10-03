<script setup lang="ts">
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { SketchyChart } from 'brutx-ui-vue/sketchy-chart'
import { Button } from 'brutx-ui-vue/button'
import { useChartDemoLocale, type ChartDemoItem } from '@/theme/lib/sketchy-chart-demo'

type DataState = 'single' | 'empty' | 'zero' | 'invalid' | 'negative' | 'tiny'
interface StateOption { value: DataState; label: string }
const { language, text } = useChartDemoLocale()
const state: Ref<DataState> = ref('single')
const options: ComputedRef<StateOption[]> = computed((): StateOption[] => [
    { value: 'single', label: text('单项', 'Single item') },
    { value: 'empty', label: text('空数组', 'Empty array') },
    { value: 'zero', label: text('全零', 'All zero') },
    { value: 'invalid', label: text('无效数值', 'Invalid number') },
    { value: 'negative', label: text('饼图负值', 'Negative pie value') },
    { value: 'tiny', label: text('极小比例', 'Tiny proportion') },
])
const data: ComputedRef<ChartDemoItem[]> = computed((): ChartDemoItem[] => {
    const first: string = text('类别甲', 'Category A')
    const second: string = text('类别乙', 'Category B')
    const cases: Record<DataState, ChartDemoItem[]> = {
        single: [{ label: first, value: 12 }],
        empty: [],
        zero: [{ label: first, value: 0 }, { label: second, value: 0 }],
        invalid: [{ label: first, value: 12 }, { label: second, value: NaN }],
        negative: [{ label: first, value: 12 }, { label: second, value: -3 }],
        tiny: [
            { label: text('极小项', 'Tiny item'), value: 1e-15 },
            { label: text('可见项', 'Visible item'), value: Number.MAX_VALUE },
        ],
    }
    return cases[state.value]
})
const scientific: ComputedRef<Intl.NumberFormat> = computed((): Intl.NumberFormat =>
    new Intl.NumberFormat(language.value, { notation: 'scientific' }))
function formatScientific(value: number): string { return scientific.value.format(value) }
</script>

<template>
    <div class="w-full space-y-4" data-chart-demo="states">
        <div class="flex flex-wrap gap-2">
            <Button
                v-for="option in options" :key="option.value" type="button" variant="outline"
                :pressed="state === option.value" @click="state = option.value"
            >
                {{ option.label }}
            </Button>
        </div>
        <SketchyChart
            :title="text('饼图数据状态', 'Pie data states')"
            :description="text('切换输入，比较图形、焦点入口与完整数据表。', 'Switch inputs to compare the graphic, focus entry, and complete table.')"
            type="pie" :data="data" :value-formatter="state === 'tiny' ? formatScientific : undefined"
        />
    </div>
</template>
