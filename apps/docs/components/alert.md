# Alert

新粗野主义风格的警告组件，用于显示状态消息，支持 7 种颜色变体。

## 预览

<ComponentPreview>
  <div class="space-y-4 w-full">
    <div class="relative w-full p-4 border-3 border-brutal shadow-brutal bg-brutal-bg text-brutal-fg" role="alert">
      <p class="font-bold">Default Alert</p>
      <p class="text-sm mt-1">This is a default alert message.</p>
    </div>
    <div class="relative w-full p-4 border-3 border-brutal shadow-brutal bg-brutal-primary text-brutal-fg" role="alert">
      <p class="font-bold">Primary Alert</p>
      <p class="text-sm mt-1">This is a primary alert message.</p>
    </div>
    <div class="relative w-full p-4 border-3 border-brutal shadow-brutal bg-brutal-destructive text-white" role="alert">
      <p class="font-bold">Danger Alert</p>
      <p class="text-sm mt-1">Something went wrong. Please try again.</p>
    </div>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="alert" />

## 用法

```vue
<script setup>
import Alert from '@/components/ui/Alert.vue'
import AlertTitle from '@/components/ui/AlertTitle.vue'
import AlertDescription from '@/components/ui/AlertDescription.vue'
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
import Alert from '@/components/ui/Alert.vue'
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
import Alert from '@/components/ui/Alert.vue'
import AlertTitle from '@/components/ui/AlertTitle.vue'
import AlertDescription from '@/components/ui/AlertDescription.vue'
import { Terminal } from 'lucide-vue-next'
</script>

<template>
    <Alert variant="default">
        <Terminal class="h-5 w-5" />
        <AlertTitle>Terminal</AlertTitle>
        <AlertDescription>Run commands in your terminal.</AlertDescription>
    </Alert>
</template>
```

## Props

### Alert

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` |
| `class` | `string` | — |

### AlertTitle

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

### AlertDescription

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |
