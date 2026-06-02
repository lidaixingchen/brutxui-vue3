---
title: Dashboard Stats
description: 统计卡片组区块，用于仪表盘中的关键指标展示。
---

# Dashboard Stats

新粗野主义风格的统计卡片组，展示关键业务指标和趋势变化。

## 预览

<ComponentPreview>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="border-3 border-brutal bg-brutal-bg shadow-brutal p-4">
      <div class="text-sm font-bold text-brutal-muted-foreground">Total Users</div>
      <div class="text-2xl font-black mt-1">1,234</div>
      <div class="text-xs font-bold text-brutal-success mt-1">+12.5%</div>
    </div>
    <div class="border-3 border-brutal bg-brutal-bg shadow-brutal p-4">
      <div class="text-sm font-bold text-brutal-muted-foreground">Revenue</div>
      <div class="text-2xl font-black mt-1">$45.6K</div>
      <div class="text-xs font-bold text-brutal-success mt-1">+8.2%</div>
    </div>
    <div class="border-3 border-brutal bg-brutal-bg shadow-brutal p-4">
      <div class="text-sm font-bold text-brutal-muted-foreground">Active Projects</div>
      <div class="text-2xl font-black mt-1">89</div>
      <div class="text-xs font-bold text-brutal-destructive mt-1">-3.1%</div>
    </div>
    <div class="border-3 border-brutal bg-brutal-bg shadow-brutal p-4">
      <div class="text-sm font-bold text-brutal-muted-foreground">Conversion</div>
      <div class="text-2xl font-black mt-1">24.8%</div>
      <div class="text-xs font-bold text-brutal-accent mt-1">0%</div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block dashboard-stats
```

## 用法

```vue
<script setup>
import DashboardStats from '@/components/ui/dashboard-stats/DashboardStats.vue'
import { Users, DollarSign, FolderOpen, TrendingUp } from 'lucide-vue-next'

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

## StatItem 类型

```ts
interface StatItem {
    title: string
    value: string
    description?: string
    change?: string
    trend?: 'up' | 'down' | 'neutral'
    icon?: Component
}
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `stats` | `StatItem[]` | `[]` |
| `class` | `string` | — |

## 特性

- **趋势指示**：根据 `trend` 值显示不同颜色（up=成功色，down=危险色，neutral=强调色）
- **图标支持**：每个统计卡片可配置 Lucide 图标
- **响应式网格**：移动端单列，平板双列，桌面四列
- **变化百分比**：可选的 `change` 字段展示趋势变化
