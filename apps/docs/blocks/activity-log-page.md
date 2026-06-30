---
title: Activity Log Page 活动日志页
description: 带有表格、类型徽标和分页的活动日志页面区块。
---

# Activity Log Page 活动日志页

新粗野主义风格的活动日志页面，包含表格视图、类型徽标和分页组件。适用于展示系统操作记录、审计日志等场景。

## 预览

<ComponentPreview>
  <ActivityLogPageDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="activity-log-page" />

## 用法

```vue
<script setup>
import ActivityLogPage from '@/components/ui/activity-log-page/ActivityLogPage.vue'

const activities = [
    {
        id: '1',
        action: 'User Login',
        user: 'admin',
        timestamp: '2024-01-15 10:00',
        type: 'info',
    },
    {
        id: '2',
        action: 'Config Update',
        user: 'system',
        timestamp: '2024-01-15 09:30',
        details: 'Rate limit changed',
        type: 'warning',
    },
    {
        id: '3',
        action: 'Deploy Failed',
        user: 'ci-bot',
        timestamp: '2024-01-15 09:00',
        details: 'Build timeout',
        type: 'error',
    },
]

function handleEntryClick(id: string) {
    console.log('Entry clicked:', id)
}
</script>

<template>
    <ActivityLogPage
        :activities="activities"
        @entry-click="handleEntryClick"
    />
</template>
```

## 数据类型

```ts
interface ActivityEntry {
    id: string
    action: string
    user: string
    timestamp: string
    details?: string
    type: 'info' | 'warning' | 'error' | 'success'
}
```

## Props

### ActivityLogPage

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `activityLogPage.defaultTitle` | 页面标题 |
| `activities` | `ActivityEntry[]` | `[]` | 活动日志数据 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `entry-click` | `[id: string]` | 点击日志条目时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `header` | — | 自定义页面标题区域 |
| `default` | — | 自定义主内容区域（替换表格和分页） |
| `footer` | — | 页面底部内容 |

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 触发条目点击
- **ARIA 属性**：表格使用语义化 `<table>` 标记，分页控件使用 `aria-label` 标识
- **焦点管理**：可交互元素支持 Tab 键导航
- **动效降级**：尊重 `prefers-reduced-motion` 系统设置，自动禁用或简化动画（如适用）
