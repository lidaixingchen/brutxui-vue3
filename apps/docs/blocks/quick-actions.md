---
title: Quick Actions
description: 快捷操作面板，含图标按钮网格和标题徽标。
---

# Quick Actions 快捷操作

新粗野主义风格的快捷操作面板，包含标题徽标和图标按钮网格。

## 预览

<ComponentPreview>
  <QuickActionsDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="quick-actions" />

## 用法

```vue
<script setup>
import QuickActions from '@/components/ui/quick-actions/QuickActions.vue'
import { Plus, Upload, Search, Settings } from '@lucide/vue'

const actions = [
    { label: 'New Post', icon: Plus, variant: 'primary' },
    { label: 'Upload', icon: Upload, variant: 'secondary' },
    { label: 'Search', icon: Search, variant: 'outline' },
    { label: 'Settings', icon: Settings, variant: 'outline' },
]

function handleAction(index: number) {
    console.log('Action clicked:', actions[index].label)
}
</script>

<template>
    <QuickActions
        title="快捷操作"
        :actions="actions"
        @action-click="handleAction"
    />
</template>
```

## 数据类型

```ts
interface ActionItem {
    label: string
    icon: Component
    variant?: 'primary' | 'secondary' | 'outline' | 'danger'
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `quickActions.defaultTitle` | 面板标题 |
| `actions` | `ActionItem[]` | `[]` | 操作项数据 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `action-click` | `[index: number]` | 操作按钮点击时触发，参数为按钮索引 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `actions` | — | 操作网格下方操作区域 |

## 可访问性

- **键盘操作**：操作按钮支持 `Tab` 聚焦，`Enter` / `Space` 触发点击
- **ARIA 属性**：按钮自动添加 `aria-label`，图标通过 `aria-hidden` 隐藏
- **焦点管理**：支持键盘导航在操作按钮间切换焦点
