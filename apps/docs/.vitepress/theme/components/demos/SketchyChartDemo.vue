<script setup lang="ts">
import { SketchyChart } from 'brutx-ui-vue'

const lineData = [
    { label: '一月', value: 30 },
    { label: '二月', value: 65 },
    { label: '三月', value: 45 },
    { label: '四月', value: 80 },
    { label: '五月', value: 55 },
    { label: '六月', value: 90 },
]

const barData = [
    { label: 'Vue', value: 85 },
    { label: 'React', value: 72 },
    { label: 'Svelte', value: 60 },
    { label: 'Angular', value: 48 },
]

const pieData = [
    { label: '桌面端', value: 45 },
    { label: '移动端', value: 35 },
    { label: '平板', value: 15 },
    { label: '其他', value: 5 },
]
</script>

<template>
    <div class="flex flex-col gap-8">
        <div>
            <p class="text-sm font-bold mb-2">折线图</p>
            <SketchyChart type="line" :data="lineData" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">柱状图</p>
            <SketchyChart type="bar" :data="barData" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">饼图</p>
            <SketchyChart type="pie" :data="pieData" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">高抖动幅度 (sketchiness=8)</p>
            <SketchyChart type="line" :data="lineData" :sketchiness="8" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">关闭网格线 (grid=false)</p>
            <SketchyChart type="bar" :data="barData" :grid="false" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">自定义尺寸 (width=400, height=250)</p>
            <SketchyChart type="line" :data="lineData" :width="400" :height="250" />
        </div>
    </div>
</template>
