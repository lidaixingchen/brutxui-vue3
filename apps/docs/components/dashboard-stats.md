---
title: Dashboard Stats 仪表盘统计
description: 仪表盘统计卡片，以大号数字、对比标签展示核心业务指标数据。
---

# Dashboard Stats 仪表盘统计

新粗野主义风格的仪表盘统计块，用于展示关键指标，支持趋势、图标和进度条。

## 预览

<ComponentPreview>
  <DashboardStatsDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="dashboard-stats" />

## 用法

```vue
<script setup>
import { DashboardStats } from 'brutx-ui-vue'
import { DollarSign, Users, Activity } from '@lucide/vue'

const stats = [
    {
        title: 'Revenue',
        value: '$45,231',
        description: 'Total revenue this month',
        change: '+20.1%',
        trend: 'up',
        icon: DollarSign,
        accentColor: 'primary',
        progress: 75,
    },
    {
        title: 'Users',
        value: '+2,350',
        description: 'New users this month',
        change: '+12.5%',
        trend: 'up',
        icon: Users,
        accentColor: 'secondary',
        progress: 60,
    },
    {
        title: 'Bounce Rate',
        value: '12.3%',
        description: 'Visitor bounce rate',
        change: '-2.1%',
        trend: 'down',
        icon: Activity,
        accentColor: 'destructive',
    },
]
</script>

<template>
    <DashboardStats
        title="Overview Performance"
        subtitle="Key metrics for this month"
        :stats="stats"
    />
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

## 强调色

每个统计项的 `accentColor` 属性控制图标背景和进度条颜色：

| 值 | 颜色 |
|----|------|
| `primary` | 珊瑚色（`--brutal-primary`） |
| `secondary` | 薄荷青（`--brutal-secondary`） |
| `accent` | 黄色（`--brutal-accent`） |
| `destructive` | 红色（`--brutal-destructive`） |
| `success` | 绿色（`--brutal-success`） |
| `info` | 蓝色（`--brutal-info`） |

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `stats` | `StatItem[]` | `[]` | 统计项数据数组 |
| `title` | `string` | 国际化默认值 | 标题文本 |
| `subtitle` | `string` | — | 副标题文本 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `stat-click` | `number` | 点击统计卡片时触发，参数为卡片索引 |

## 可访问性

- **键盘操作**：统计卡片支持键盘导航和 `Enter` / `Space` 触发点击
- **ARIA 属性**：卡片包含标题和描述的文本内容，对屏幕阅读器可访问
