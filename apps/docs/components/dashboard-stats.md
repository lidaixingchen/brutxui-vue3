# Dashboard Stats

新粗野主义风格的仪表盘统计块，用于展示关键指标，支持趋势、图标和进度条。

## 预览

<ComponentPreview>
  <div class="w-full max-w-5xl mx-auto">
    <div class="mb-8">
      <h2 class="text-2xl font-black tracking-tight">Overview Performance</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="border-3 border-brutal bg-brutal-bg shadow-brutal p-5">
        <div class="pb-2 flex items-center justify-between">
          <span class="text-sm text-brutal-muted-foreground">Revenue</span>
          <div class="h-8 w-8 flex items-center justify-center border-3 border-brutal bg-brutal-primary">$</div>
        </div>
        <div class="pt-2">
          <div class="text-2xl font-black">$45,231</div>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-flex items-center border-3 border-brutal font-bold bg-brutal-success text-brutal-fg shadow-brutal-sm px-2 py-0.5 text-xs">+20.1%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="dashboard-stats" />

## 用法

```vue
<script setup>
import DashboardStats from '@/components/ui/DashboardStats.vue'
import { DollarSign, Users, Activity } from 'lucide-vue-next'

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

## StatItem 类型

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

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `stats` | `StatItem[]` | `[]` |
| `title` | `string` | `'Overview Performance'` |
| `subtitle` | `string` | — |
| `class` | `string` | — |

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
