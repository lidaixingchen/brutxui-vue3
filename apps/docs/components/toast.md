---
title: Toast 轻提示
description: 全局通知气泡组件，支持成功、失败、信息等多种类型的通知分发。
---

# Toast 轻提示

新粗野主义风格通知提示系统，提供 `useToast` 组合式函数、5 种变体和 `ToastContainer` 用于渲染。

## 预览

<ComponentPreview>
  <ToastDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="toast" />

## 用法

### 1. 在应用中添加 ToastContainer

将 `ToastContainer` 放置在根 `App.vue` 中：

```vue
<script setup>
import { ToastContainer } from 'brutx-ui-vue'
</script>

<template>
    <router-view />
    <ToastContainer />
</template>
```

### 2. 使用 useToast 组合式函数

```vue
<script setup>
import { useToast } from 'brutx-ui-vue'

const { success, error, warning, info, addToast } = useToast()

function handleSave() {
    success('Saved!', 'Your changes have been saved.')
}

function handleError() {
    error('Error', 'Something went wrong. Please try again.')
}
</script>

<template>
    <button @click="handleSave">Save</button>
    <button @click="handleError">Trigger Error</button>
</template>
```

## 变体

| 变体 | 背景 | 文字 |
|------|------|------|
| `default` | `bg-brutal-bg` | `text-brutal-fg` |
| `success` | `bg-brutal-success` | `text-black` |
| `error` | `bg-brutal-destructive` | `text-white` |
| `warning` | `bg-brutal-accent` | `text-black` |
| `info` | `bg-brutal-secondary` | `text-black` |

## 尺寸

| 尺寸 | 宽度 |
|------|------|
| `sm` | `w-72` (288px) |
| `default` | `w-80` (320px) |
| `lg` | `w-96` (384px) |

## useToast API

```ts
const {
    toasts,       // Ref<ToastItem[]> - 响应式提示列表
    addToast,     // (toast: Omit<ToastItem, 'id'>) => string
    removeToast,  // (id: string) => void
    clearToasts,  // () => void
    success,      // (title: string, description?: string) => string
    error,        // (title: string, description?: string) => string
    warning,      // (title: string, description?: string) => string
    info,         // (title: string, description?: string) => string
    promise,      // <T>(promise: Promise<T>, options: PromiseToastOptions<T>) => Promise<T>
} = useToast()
```

## Promise Toast

自动追踪 Promise 状态，显示 loading → success/error 流程：

```vue
<script setup>
import { useToast } from 'brutx-ui-vue'

const { promise } = useToast()

async function handleSave() {
    await promise(saveData(), {
        loading: '保存中...',
        success: '保存成功！',
        error: '保存失败，请重试',
    })
}
</script>
```

### PromiseToastOptions

```ts
interface PromiseToastOptions<T> {
    loading: string                          // loading 状态文本
    success: string | ((data: T) => string)  // 成功文本或格式化函数
    error: string | ((error: Error) => string) // 错误文本或格式化函数
    duration?: number                        // 成功/错误后显示时长
    loadingVariant?: string                  // loading 状态变体
    successVariant?: string                  // 成功状态变体
    errorVariant?: string                    // 错误状态变体
}
```

## 自定义提示

```vue
<script setup>
import { useToast } from 'brutx-ui-vue'

const { addToast } = useToast()

function showCustomToast() {
    addToast({
        variant: 'warning',
        title: 'Warning',
        description: 'Your session will expire in 5 minutes.',
        duration: 10000,
    })
}
</script>
```

## 悬停暂停

`Toast` 默认启用 `pauseOnHover`（默认值 `true`）：鼠标移入提示时暂停倒计时与顶部进度条动画，移出后从剩余时间继续，便于用户阅读较长内容。设置 `:pause-on-hover="false"` 可禁用该行为。

> 注意：`pauseOnHover` 是 `<Toast>` 组件自身的 prop，不通过 `useToast` 的 `addToast` / `ToastItem` 传递。在自定义 `ToastContainer` 渲染 `<Toast>` 时直接绑定即可。

```vue
<script setup>
import { useToast, ToastContainer, Toast } from 'brutx-ui-vue'

const { toasts, addToast, removeToast } = useToast()
</script>

<template>
    <ToastContainer position="bottom-right">
        <Toast
            v-for="toast in toasts"
            :key="toast.id"
            :duration="toast.duration"
            :pause-on-hover="true"
            @close="removeToast(toast.id)"
        />
    </ToastContainer>

    <button @click="addToast({ title: '悬停我', description: '将鼠标移到提示上可暂停倒计时。', duration: 10000 })">
        显示可暂停提示
    </button>
</template>
```

## ToastItem 类型

```ts
interface ToastItem {
    id: string
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
    title?: string
    description?: string
    duration?: number
}
```

## Props

### Toast

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'success' \| 'error' \| 'warning' \| 'info'` | `'default'` | 提示类型 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `pauseOnHover` | `boolean` | `true` | 鼠标悬停时暂停倒计时与进度条动画，移出后从剩余时间继续 |
| `class` | `string` | — | 自定义样式类 |

### ToastContainer

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right' \| { x: number; y: number; anchor?: string }` | `'bottom-right'` | 显示位置 |
| `stack` | `{ maxVisible?: number; gap?: number; expandDirection?: 'up' \| 'down' }` | `{ maxVisible: 5, gap: 12, expandDirection: 'down' }` | 堆叠配置 |
| `class` | `string` | — | 自定义样式类 |
