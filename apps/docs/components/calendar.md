---
title: Calendar 日历
description: 日历组件，支持日期选择与范围选择，结合新粗野主义边框与硬质阴影设计。
---

# Calendar 日历

新粗野主义风格的日历组件，基于 v-calendar DatePicker 构建，支持单日期和日期范围选择。

## 预览

<ComponentPreview>
  <ClientOnly>
    <CalendarDemo />
  </ClientOnly>
</ComponentPreview>

## 安装

<InstallationTabs componentName="calendar" />

**需要额外安装依赖：**

```bash
pnpm add v-calendar
```

## 用法

### 单日期选择

```vue
<script setup>
import { ref } from 'vue'
import { Calendar } from 'brutx-ui-vue'

const date = ref(null)
</script>

<template>
    <Calendar v-model="date" />
</template>
```

### 日期范围选择

```vue
<script setup>
import { ref } from 'vue'
import { Calendar } from 'brutx-ui-vue'

const dateRange = ref(null)
</script>

<template>
    <Calendar v-model="dateRange" :is-range="true" />
</template>
```

### 禁用状态

```vue
<template>
    <Calendar :disabled="true" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `Date \| Date[] \| null` | `undefined` | 选中的日期，支持 v-model 绑定。单日期模式为 `Date`，范围模式为 `[Date, Date]` |
| `isRange` | `boolean` | `false` | 是否启用日期范围选择模式 |
| `disabled` | `boolean` | `false` | 禁用日历，整体变半透明且不可交互 |
| `class` | `string` | `undefined` | 自定义 CSS 类名 |

## 事件

| 事件                     | 载荷                       | 说明                 |
| ------------------------ | -------------------------- | -------------------- |
| `update:modelValue`      | `Date \| Date[] \| null`   | 选中日期变化时触发   |

## 插槽

Calendar 组件通过 v-calendar 的 DatePicker 提供以下插槽，可用于自定义头部和日期单元格：

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `header-prev-button` | — | 自定义上一月导航按钮（默认显示 ChevronLeft 图标） |
| `header-title` | `{ title: string }` | 自定义头部标题（默认加粗大写显示） |
| `header-next-button` | — | 自定义下一月导航按钮（默认显示 ChevronRight 图标） |
| `day-content` | `{ day: object, dayProps: object, dayEvents: object }` | 自定义日期单元格内容 |

## 样式

Calendar 组件对所有日期单元格使用新粗野主义样式，通过覆盖 v-calendar 的 CSS 变量实现：

- **选中日期**：Primary 背景色，粗边框 + 硬质阴影
- **范围日期**：范围内使用 Accent 背景色
- **今天**：Secondary 背景色，粗边框
- **非当月日期**：降低透明度（opacity-40）
- **禁用状态**：整体半透明（opacity-50），禁止所有鼠标交互
- **导航按钮**：粗边框 + 硬质阴影，悬停时阴影增大，按下时位移反馈
- **星期标题**：粗体大写，底部粗边框分隔

组件内部覆盖了以下 v-calendar CSS 变量以适配 brutal 风格：

| 变量 | 覆盖值 | 用途 |
|------|--------|------|
| `--vc-rounded-full` | `var(--brutal-radius)` | 圆角（默认 9999px → 0px） |
| `--vc-highlight-solid-bg` | `var(--brutal-primary)` | 选中日期背景色 |
| `--vc-highlight-light-bg` | `var(--brutal-accent)` | 范围日期背景色 |
| `--vc-highlight-outline-bg` | `var(--brutal-bg)` | 轮廓模式背景色 |
| `--vc-highlight-outline-border` | `var(--brutal-border-color)` | 轮廓模式边框色 |
| `--vc-highlight-solid-content-color` | `var(--brutal-primary-foreground)` | 选中日期文字颜色 |
| `--vc-highlight-light-content-color` | `var(--brutal-accent-foreground)` | 范围日期文字颜色 |
| `--vc-highlight-outline-content-color` | `var(--brutal-fg)` | 轮廓模式文字颜色 |
