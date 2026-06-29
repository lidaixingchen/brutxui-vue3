---
title: Alert 提示
description: 新粗野主义风格的警告框组件，支持多种变体、状态色以及自定义图标。
---

# Alert 提示

新粗野主义风格的警告组件，用于显示状态消息，支持 7 种颜色变体。

## 预览

<ComponentPreview>
  <AlertDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="alert" />

## 用法

```vue
<script setup>
import { Alert, AlertTitle, AlertDescription } from 'brutx-ui-vue'
</script>

<template>
    <Alert variant="default">
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
    </Alert>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 标准背景色，前景色文字 |
| `primary` | Primary（珊瑚色）背景 |
| `secondary` | Secondary（薄荷青）背景 |
| `success` | Success（绿色）背景 |
| `warning` | Warning（黄色）背景 |
| `danger` | Destructive（红色）背景 |
| `info` | Info（蓝色）背景 |

```vue
<script setup>
import { Alert } from 'brutx-ui-vue'
</script>

<template>
    <Alert variant="success">Operation completed successfully.</Alert>
    <Alert variant="danger">Failed to save changes.</Alert>
    <Alert variant="info">A new version is available.</Alert>
</template>
```

## 带图标

Alert 支持通过 SVG 子元素放置图标。图标绝对定位于左侧：

```vue
<script setup>
import { Alert, AlertTitle, AlertDescription } from 'brutx-ui-vue'
import { Terminal } from '@lucide/vue'
</script>

<template>
    <Alert variant="default">
        <Terminal class="h-5 w-5" />
        <AlertTitle>Terminal</AlertTitle>
        <AlertDescription>Run commands in your terminal.</AlertDescription>
    </Alert>
</template>
```

## 可关闭提示

通过 `closable` 属性在提示框右上角渲染一个关闭按钮（使用 Button 组件 `variant="ghost" size="icon"`）。点击按钮会触发 `close` 事件。启用 `closable` 时，提示框会自动添加右侧内边距（`pr-12`）以避免内容与按钮重叠。

```vue
<script setup>
import { ref } from 'vue'
import { Alert, AlertTitle, AlertDescription } from 'brutx-ui-vue'

const visible = ref(true)

function handleClose() {
    visible.value = false
}
</script>

<template>
    <Alert v-if="visible" variant="info" closable @close="handleClose">
        <AlertTitle>可关闭的提示</AlertTitle>
        <AlertDescription>点击右上角的 × 按钮可以关闭此提示。</AlertDescription>
    </Alert>
</template>
```

## 操作按钮

通过 `action` 具名插槽在提示内容下方添加操作按钮区域。插槽内容会渲染在一个带间距的弹性布局容器中（`mt-3 flex items-center gap-2`）。

```vue
<script setup>
import { Alert, AlertTitle, AlertDescription, Button } from 'brutx-ui-vue'
</script>

<template>
    <Alert variant="warning">
        <AlertTitle>存储空间不足</AlertTitle>
        <AlertDescription>您的存储空间已使用 90%，请及时清理或升级。</AlertDescription>
        <template #actions>
            <Button variant="primary" size="sm">立即升级</Button>
            <Button variant="outline" size="sm">稍后提醒</Button>
        </template>
    </Alert>
</template>
```

## Props

### Alert

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` |
| `closable` | `boolean` | `false` |
| `class` | `string` | — |

### AlertTitle

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

### AlertDescription

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

## 事件

### Alert

| 事件 | 载荷 | 说明 |
|------|------|------|
| `close` | `[]` | 点击关闭按钮时触发 |

## 插槽

### Alert

| 插槽 | 说明 |
|------|------|
| `default` | 提示框主体内容 |
| `action` | 操作按钮区域，渲染在内容下方 |
