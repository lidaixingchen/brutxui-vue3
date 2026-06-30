---
title: Chart Section 图表区
description: 新粗野主义风格的图表展示区块，包含标签页切换视图，支持柱状图、折线图和饼图。
---

# Chart Section 图表区

新粗野主义风格的图表展示区块，包含标签页切换视图，支持柱状图、折线图和饼图。

## 预览

<ComponentPreview>
  <ChartSectionDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="chart-section" />

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

## 数据类型

```ts
interface ChartDataPoint {
    label: string
    value: number
}
```

## Props

### ChartSection

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `chartSection.defaultTitle` | 区块标题 |
| `subtitle` | `string` | locale: `chartSection.defaultSubtitle` | 区块副标题 |
| `chartType` | `'bar' \| 'line' \| 'pie'` | `'bar'` | 图表类型 |
| `data` | `ChartDataPoint[]` | `[]` | 图表数据 |
| `class` | `string` | — | 自定义样式类 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ---- | ---- |
| `header` | — | 自定义标题区域 |
| `default` | — | 自定义主内容区域（替换标签页和图表） |
| `footer` | — | 底部内容 |

## 可访问性

- **键盘操作**：支持 `Tab` 在标签页间导航，`Enter` / `Space` 切换图表类型
- **ARIA 属性**：标签页使用 `role="tablist"` 和 `aria-selected` 指示选中状态
- **焦点管理**：标签页切换后焦点保持在当前标签上
