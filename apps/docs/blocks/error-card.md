---
title: Error Card 错误卡片
description: 错误状态卡片区块，带有警告提示、重试和关闭按钮。
---

# Error Card 错误卡片

新粗野主义风格的错误卡片，包含 Alert 危险提示、标题、描述以及重试/关闭操作按钮。

## 预览

<ComponentPreview>
  <ErrorCardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="error-card" />

## 用法

```vue
<script setup>
import ErrorCard from '@/components/ui/error-card/ErrorCard.vue'

function handleRetry() {
    console.log('Retry clicked')
}

function handleDismiss() {
    console.log('Dismiss clicked')
}
</script>

<template>
    <ErrorCard
        title="Something went wrong"
        description="An unexpected error occurred. Please try again."
        retry-text="Retry"
        @retry="handleRetry"
        @close="handleDismiss"
    />
</template>
```

### 自定义文本

```vue
<script setup>
import ErrorCard from '@/components/ui/error-card/ErrorCard.vue'
</script>

<template>
    <ErrorCard
        title="Upload Failed"
        description="Your file could not be uploaded. Check the format and try again."
        retry-text="Re-upload"
        @retry="retryUpload"
        @close="cancelUpload"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `errorCard.defaultTitle` | 错误标题 |
| `description` | `string` | locale: `errorCard.defaultDescription` | 错误描述 |
| `retryText` | `string` | locale: `errorCard.defaultRetryText` | 重试按钮文本 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `retry` | — | 点击重试按钮时触发 |
| `close` | — | 点击关闭按钮时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `actions` | — | 额外操作按钮区域 |

## 可访问性

- **键盘操作**：支持 `Tab` 在按钮间导航，`Enter` / `Space` 触发按钮操作
- **ARIA 属性**：Alert 组件使用 `role="alert"` 提示错误状态
- **焦点管理**：焦点顺序遵循文档流，按钮获得焦点时显示可见的焦点指示器
