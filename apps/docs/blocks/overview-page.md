---
title: Overview Page
description: 带有统计卡片和活动面板的仪表盘概览页面区块。
---

# Overview Page

新粗野主义风格的仪表盘概览页面，包含统计卡片网格和活动面板。

## 预览

<ComponentPreview>
  <div class="w-full max-w-6xl mx-auto p-6">
    <h1 class="text-3xl font-black tracking-tight mb-8">Overview</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-4 bg-brutal-bg border-3 border-brutal shadow-brutal">
        <div class="text-sm font-bold text-brutal-fg">Revenue</div>
        <div class="text-2xl font-black mt-1">$12,500</div>
        <div class="text-xs font-bold text-brutal-success mt-1">+12.5%</div>
      </div>
      <div class="p-4 bg-brutal-bg border-3 border-brutal shadow-brutal">
        <div class="text-sm font-bold text-brutal-fg">Users</div>
        <div class="text-2xl font-black mt-1">1,234</div>
        <div class="text-xs font-bold text-brutal-success mt-1">+8.2%</div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <div class="bg-brutal-bg border-3 border-brutal shadow-brutal">
        <div class="p-4 border-b-3 border-brutal font-black">Recent Activity</div>
        <div class="p-4 text-sm font-medium text-brutal-muted-foreground">Activity items here</div>
      </div>
      <div class="bg-brutal-bg border-3 border-brutal shadow-brutal">
        <div class="p-4 border-b-3 border-brutal font-black">Quick Stats</div>
        <div class="p-4 space-y-3">
          <div class="flex items-center justify-between p-3 bg-brutal-muted border-3 border-brutal shadow-brutal-sm">
            <span class="font-bold text-sm">Revenue</span>
            <span class="font-black">$12,500</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block overview-page
```

## 用法

```vue
<script setup>
import OverviewPage from '@/components/ui/overview-page/OverviewPage.vue'

const stats = [
    {
        title: 'Revenue',
        value: '$12,500',
        change: '+12.5%',
        trend: 'up',
    },
    {
        title: 'Users',
        value: '1,234',
        change: '+8.2%',
        trend: 'up',
    },
    {
        title: 'Bounce Rate',
        value: '24.3%',
        change: '-2.1%',
        trend: 'down',
    },
    {
        title: 'Sessions',
        value: '5,678',
        change: '+0.5%',
        trend: 'neutral',
    },
]

function handleStatClick(index) {
    console.log('Stat clicked:', index)
}
</script>

<template>
    <OverviewPage
        :stats="stats"
        @stat-click="handleStatClick"
    >
        <!-- Recent Activity slot content -->
        <div class="space-y-2">
            <div class="text-sm font-medium">New user signed up</div>
            <div class="text-sm font-medium">Payment received</div>
        </div>
    </OverviewPage>
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `overviewPage.defaultTitle` |
| `stats` | `OverviewStat[]` | `[]` |
| `class` | `string` | — |

### OverviewStat 接口

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 统计项标题 |
| `value` | `string` | 统计值 |
| `change` | `string` | 变化描述 |
| `trend` | `'up' \| 'down' \| 'neutral'` | 趋势方向 |

## 事件

| 事件 | 载荷 |
|------|------|
| `statClick` | `[index: number]` |

## 插槽

| 插槽 | 说明 |
|------|------|
| `header` | 自定义页面标题区域 |
| `default` | Recent Activity 卡片的内容区域 |
| `footer` | 页面底部内容 |

## 布局

OverviewPage 包含：
- **标题**：加粗页面标题，可通过 `header` 插槽自定义
- **统计卡片网格**：DashboardStats 组件，展示所有统计项
- **双栏面板**：左侧为 Recent Activity 卡片（内容由 `default` 插槽提供），右侧为 Quick Stats 列表
- **Quick Stats**：每个统计项以行内卡片形式展示，支持点击交互
