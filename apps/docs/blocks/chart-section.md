---
title: Chart Section
description: 带有标签页切换的图表展示区块，支持柱状图、折线图和饼图。
---

# Chart Section

新粗野主义风格的图表展示区块，包含标签页切换视图，支持柱状图、折线图和饼图。

## 预览

<ComponentPreview>
  <div class="w-full max-w-4xl mx-auto">
    <div class="mb-6">
      <h2 class="text-3xl font-black tracking-tight">Analytics</h2>
      <p class="mt-2 text-brutal-muted-foreground font-medium">Monthly performance overview</p>
    </div>
    <div class="flex border-3 border-brutal">
      <button class="flex-1 px-4 py-2 bg-brutal-primary text-brutal-fg font-black text-sm border-r-3 border-brutal">Bar</button>
      <button class="flex-1 px-4 py-2 bg-brutal-muted font-bold text-sm border-r-3 border-brutal">Line</button>
      <button class="flex-1 px-4 py-2 bg-brutal-muted font-bold text-sm">Pie</button>
    </div>
    <div class="border-3 border-t-0 border-brutal p-4">
      <div class="h-48 flex items-end gap-2">
        <div class="flex-1 bg-brutal-primary border-2 border-brutal" style="height:60%"></div>
        <div class="flex-1 bg-brutal-secondary border-2 border-brutal" style="height:80%"></div>
        <div class="flex-1 bg-brutal-accent border-2 border-brutal" style="height:45%"></div>
        <div class="flex-1 bg-brutal-primary border-2 border-brutal" style="height:90%"></div>
        <div class="flex-1 bg-brutal-secondary border-2 border-brutal" style="height:70%"></div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block chart-section
```

## 用法

```vue
<script setup>
import ChartSection from '@/components/ui/chart-section/ChartSection.vue'

const data = [
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 80 },
    { label: 'Mar', value: 45 },
    { label: 'Apr', value: 90 },
    { label: 'May', value: 70 },
]
</script>

<template>
    <ChartSection
        title="Analytics"
        subtitle="Monthly performance overview"
        chart-type="bar"
        :data="data"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `chartSection.defaultTitle` |
| `subtitle` | `string` | locale: `chartSection.defaultSubtitle` |
| `chartType` | `'bar' \| 'line' \| 'pie'` | `'bar'` |
| `data` | `ChartDataPoint[]` | `[]` |
| `class` | `string` | — |

### ChartDataPoint 接口

| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 数据点标签 |
| `value` | `number` | 数据点值 |

## 插槽

| 插槽 | 说明 |
|------|------|
| `header` | 自定义标题区域 |
| `default` | 自定义主内容区域（替换标签页和图表） |
| `footer` | 底部内容 |

## 布局

ChartSection 包含：
- **标题与副标题**：加粗标题和弱化副标题
- **标签页切换**：Bar / Line / Pie 三个标签，带有对应图标
- **图表卡片**：根据选中标签展示对应类型的 SketchyChart
