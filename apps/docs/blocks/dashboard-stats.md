---
title: Dashboard Stats
description: 统计卡片组区块，用于仪表盘中的关键指标展示。
---

# Dashboard Stats 仪表盘统计

新粗野主义风格的统计卡片组，展示关键业务指标和趋势变化。每个卡片支持趋势指示、图标配置、强调色自定义和可选进度条，自动适配响应式网格布局。

## 预览

<ComponentPreview>
  <DashboardStatsDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="dashboard-stats" />

## 用法

```vue
<script setup>
import DashboardStats from '@/components/ui/dashboard-stats/DashboardStats.vue'
import { Users, DollarSign, FolderOpen, TrendingUp } from '@lucide/vue'

const stats = [
    {
        title: 'Total Users',
        value: '1,234',
        description: 'Active users this month',
        change: '+12.5%',
        trend: 'up',
        icon: Users,
    },
    {
        title: 'Revenue',
        value: '$45.6K',
        description: 'Monthly revenue',
        change: '+8.2%',
        trend: 'up',
        icon: DollarSign,
    },
    {
        title: 'Active Projects',
        value: '89',
        description: 'Currently active',
        change: '-3.1%',
        trend: 'down',
        icon: FolderOpen,
    },
    {
        title: 'Conversion',
        value: '24.8%',
        description: 'Visitor to customer',
        change: '0%',
        trend: 'neutral',
        icon: TrendingUp,
    },
]
</script>

<template>
    <DashboardStats :stats="stats" />
</template>
```

## 数据类型

```ts
interface StatItem {
    title: string
    value: string
    description: string
    change: string
    trend: 'up' | 'down' | 'neutral'
    icon: Component
    accentColor?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'info'
    progress?: number
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `stats` | `StatItem[]` | `[]` | 统计数据数组 |
| `title` | `string` | locale: `dashboardStats.defaultTitle` | 卡片组标题 |
| `subtitle` | `string` | — | 卡片组副标题 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `stat-click` | `[index: number]` | 点击统计卡片时触发，参数为卡片索引 |

## 可访问性

- **键盘操作**：支持 `Tab` 在卡片间切换焦点，`Space` / `Enter` 触发点击事件
- **ARIA 属性**：统计卡片组使用 `role="region"` 或 `role="list"`，各卡片使用 `role="listitem"` 等语义化标记
- **焦点管理**：卡片可聚焦时显示清晰的焦点指示器
