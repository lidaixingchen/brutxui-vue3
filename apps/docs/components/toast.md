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

```vue
<script setup>
import { ToastContainer } from 'brutx-ui-vue'
</script>

<template>
    <router-view />
    <ToastContainer />
</template>
```

### 使用 useToast

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

### 自定义提示

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

### 悬停暂停

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

## 变体

| 变体 | 背景 | 图标 |
|------|------|------|
| `default` | `bg-brutal-bg` | `Zap` |
| `success` | `bg-brutal-success` | `CheckCircle` |
| `error` | `bg-brutal-destructive` | `AlertCircle` |
| `warning` | `bg-brutal-accent` | `AlertTriangle` |
| `info` | `bg-brutal-secondary` | `Info` |

所有变体统一使用 `text-brutal-fg` 文字颜色和 `shadow-brutal-lg` 阴影。

## 尺寸

| 尺寸 | 宽度 |
|------|------|
| `sm` | `w-72` (288px) |
| `default` | `w-80` (320px) |
| `lg` | `w-96` (384px) |

## 数据类型

### ToastItem

```ts
interface ToastItem {
    id: string
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
    size?: 'sm' | 'default' | 'lg'
    title?: string
    description?: string
    duration?: number
}
```

### PromiseToastOptions

```ts
interface PromiseToastOptions<T> {
    loading: string                                        // loading 状态文本
    success: string | ((data: T) => string)                // 成功文本或格式化函数
    error: string | ((error: Error) => string)             // 错误文本或格式化函数
    duration?: number                                      // 成功/错误后显示时长
    loadingVariant?: 'default' | 'success' | 'error' | 'warning' | 'info'  // loading 状态变体
    successVariant?: 'default' | 'success' | 'error' | 'warning' | 'info'  // 成功状态变体
    errorVariant?: 'default' | 'success' | 'error' | 'warning' | 'info'    // 错误状态变体
}
```

## 组合式函数

### useToast

```ts
import { useToast } from 'brutx-ui-vue'

const {
    toasts,          // Ref<ToastItem[]> - 响应式提示列表
    addToast,        // (toast: Omit<ToastItem, 'id'>) => string
    removeToast,     // (id: string) => void
    clearToasts,     // () => void
    clearAllTimers,  // () => void
    success,         // (title: string, description?: string) => string
    error,           // (title: string, description?: string) => string
    warning,         // (title: string, description?: string) => string
    info,            // (title: string, description?: string) => string
    promise,         // <T>(promise: Promise<T> | (() => Promise<T>), options: PromiseToastOptions<T>) => Promise<T>
} = useToast()
```

#### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `toasts` | `Ref<ToastItem[]>` | 响应式提示列表 |
| `addToast` | `(toast: Omit<ToastItem, 'id'>) => string` | 添加自定义提示，返回提示 ID |
| `removeToast` | `(id: string) => void` | 移除指定提示 |
| `clearToasts` | `() => void` | 清除所有提示 |
| `clearAllTimers` | `() => void` | 清除所有定时器 |
| `success` | `(title: string, description?: string) => string` | 显示成功提示 |
| `error` | `(title: string, description?: string) => string` | 显示错误提示 |
| `warning` | `(title: string, description?: string) => string` | 显示警告提示 |
| `info` | `(title: string, description?: string) => string` | 显示信息提示 |
| `promise` | `<T>(promise: Promise<T> \| (() => Promise<T>), options: PromiseToastOptions<T>) => Promise<T>` | 自动追踪 Promise 状态 |

### provideToast

在应用根组件调用 `provideToast()` 提供 toast 实例，子组件中 `useToast()` 会自动注入该实例。

```vue
<!-- App.vue -->
<script setup>
import { provideToast } from 'brutx-ui-vue'

provideToast()
</script>
```

> 注意：若未调用 `provideToast()`，`useToast()` 会回退到共享单例并输出警告。

### Promise Toast

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

## Props

### Toast

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'success' \| 'error' \| 'warning' \| 'info'` | `'default'` | 提示类型 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `title` | `string` | — | 标题文本 |
| `description` | `string` | — | 描述文本 |
| `duration` | `number` | `5000` | 显示时长（毫秒），设为 `0` 则不自动关闭 |
| `pauseOnHover` | `boolean` | `true` | 鼠标悬停时暂停倒计时与进度条动画，移出后从剩余时间继续 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'xl'` | 主图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

### ToastContainer

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right' \| { x: number; y: number; anchor?: string }` | `'bottom-right'` | 显示位置 |
| `stack` | `{ maxVisible?: number; gap?: number; expandDirection?: 'up' \| 'down' }` | `{ maxVisible: 5, gap: 12, expandDirection: 'down' }` | 堆叠配置 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `close` | — | 提示关闭时触发（动画完成后） |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 自定义内容，渲染在标题和描述下方 |

## 可访问性

- **键盘操作**：支持 `Escape` 关闭当前提示
- **ARIA 属性**：Toast 容器使用 `role="status"` 和 `aria-live="polite"` 通知屏幕阅读器
- **动效降级**：尊重 `prefers-reduced-motion` 系统设置，自动禁用或简化动画
