---
title: Empty State
description: 数据空状态占位区块，带有大图标、副标题和主操作按钮。
---

# Empty State 空状态

新粗野主义风格的空状态占位符，包含装饰性图标、标题、描述和操作按钮。

## 预览

<ComponentPreview>
  <EmptyStateDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="empty-state" />

## 用法

```vue
<script setup>
import EmptyState from '@/components/ui/empty-state/EmptyState.vue'
import { Server } from '@lucide/vue'

function handleAction() {
    console.log('Action clicked')
}
</script>

<template>
    <EmptyState
        title="No active deployments found"
        description="Get started by deploying your first application to the cloud."
        action-text="Deploy New App"
        :icon="Server"
        @action="handleAction"
    />
</template>
```

## 变体

### 自定义图标

```vue
<script setup>
import EmptyState from '@/components/ui/empty-state/EmptyState.vue'
import { Inbox } from '@lucide/vue'
</script>

<template>
    <EmptyState
        title="No messages yet"
        description="Your inbox is empty. Start a conversation."
        action-text="New Message"
        :icon="Inbox"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `emptyState.defaultTitle` | 标题文本 |
| `description` | `string` | — | 描述文本 |
| `actionText` | `string` | locale: `emptyState.defaultActionText` | 操作按钮文本 |
| `icon` | `Component` | `FolderOpen`（来自 @lucide/vue） | 装饰性图标 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `action` | — | 操作按钮点击时触发 |

## 可访问性

- **键盘操作**：操作按钮支持 `Tab` 聚焦，`Enter` / `Space` 触发点击
- **ARIA 属性**：图标通过 `aria-hidden` 隐藏，操作按钮提供明确的文本标签
- **焦点管理**：页面加载后焦点可自然流转至操作按钮
