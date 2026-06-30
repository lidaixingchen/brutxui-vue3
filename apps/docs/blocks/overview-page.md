---
title: Overview Page
description: 带有统计卡片和活动面板的仪表盘概览页面区块。
---

# Overview Page 概览页

新粗野主义风格的仪表盘概览页面，包含统计卡片网格和活动面板。适用于仪表盘首页，展示关键指标和近期动态。

## 预览

<ComponentPreview>
  <OverviewPageDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="overview-page" />

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

function handleStatClick(index: number) {
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

## 数据类型

```ts
interface OverviewStat {
    title: string
    value: string
    change: string
    trend: 'up' | 'down' | 'neutral'
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `overviewPage.defaultTitle` | 页面标题 |
| `stats` | `OverviewStat[]` | `[]` | 统计项数据 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `stat-click` | `[index: number]` | 统计卡片点击时触发，参数为卡片索引 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `header` | — | 自定义页面标题区域 |
| `default` | — | Recent Activity 卡片的内容区域 |
| `footer` | — | 页面底部内容 |

## 可访问性

- **键盘操作**：统计卡片支持 `Tab` 聚焦，`Enter` / `Space` 触发点击
- **ARIA 属性**：统计卡片自动添加 `role="button"` 和 `aria-label`
- **焦点管理**：支持键盘导航在统计卡片间切换焦点
