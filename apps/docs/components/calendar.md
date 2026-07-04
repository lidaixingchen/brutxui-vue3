---
title: Calendar 日历
description: 日历组件，支持日期选择与范围选择，结合新粗野主义边框与硬质阴影设计。
---

# Calendar 日历

新粗野主义风格的日历组件，基于 v-calendar DatePicker 构建，支持单日期和日期范围选择。提供粗边框 + 硬质阴影的标志性 brutal 风格，以及选中态、范围态、今天高亮等视觉反馈。

## 预览

<ComponentPreview>
  <CalendarDemo />
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
import { Calendar } from 'brutx-ui-vue/calendar'

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
import { Calendar } from 'brutx-ui-vue/calendar'

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
| `events` | `CalendarEvent[]` | `[]` | 事件标记数据，在对应日期上显示事件指示器 |
| `eventRenderer` | `(event: CalendarEvent) => VNode \| string` | — | 自定义事件渲染函数，返回 VNode 或字符串 |
| `mode` | `'default' \| 'card'` | `'default'` | 事件显示模式：`default` 为圆点指示器 + Tooltip，`card` 为自适应高度卡片 + 胶囊徽章 |
| `class` | `string` | `undefined` | 自定义 CSS 类名 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `Date \| Date[] \| null` | 选中日期变化时触发 |

## 插槽

Calendar 组件通过 v-calendar 的 DatePicker 提供以下插槽，可用于自定义头部和日期单元格：

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `header-prev-button` | — | 自定义上一月导航按钮（默认显示 ChevronLeft 图标） |
| `header-title` | `{ title: string }` | 自定义头部标题（默认加粗大写显示） |
| `header-next-button` | — | 自定义下一月导航按钮（默认显示 ChevronRight 图标） |
| `day-content` | `{ day: object, dayProps: object, dayEvents: object }` | 自定义日期单元格内容 |

## 事件标记

通过 `events` 属性在日历上标记事件，支持两种显示模式。

### 数据类型

```ts
interface CalendarEvent {
    date: Date | string    // 事件日期
    title: string          // 事件标题
    [key: string]: unknown // 其他自定义字段
}
```

### default 模式

圆点指示器 + Tooltip，适合事件较少的场景：

```vue
<script setup>
import { Calendar } from 'brutx-ui-vue/calendar'

const events = [
    { date: '2025-07-15', title: '团队会议' },
    { date: '2025-07-20', title: '产品发布' },
    { date: '2025-07-20', title: '代码审查' },
]
</script>

<template>
    <Calendar :events="events" />
</template>
```

### card 模式

自适应高度卡片 + 胶囊徽章，适合事件较多的场景：

```vue
<script setup>
import { Calendar } from 'brutx-ui-vue/calendar'

const events = [
    { date: '2025-07-15', title: '团队会议' },
    { date: '2025-07-20', title: '产品发布' },
    { date: '2025-07-20', title: '代码审查' },
]
</script>

<template>
    <Calendar :events="events" mode="card" />
</template>
```

### 自定义事件渲染

通过 `eventRenderer` 自定义事件的渲染内容：

```vue
<script setup>
import { Calendar } from 'brutx-ui-vue/calendar'
import { h } from 'vue'

const events = [
    { date: '2025-07-15', title: '团队会议', color: 'red' },
    { date: '2025-07-20', title: '产品发布', color: 'blue' },
]

function renderEvent(event) {
    return h('span', { style: { color: event.color } }, event.title)
}
</script>

<template>
    <Calendar :events="events" :event-renderer="renderEvent" />
</template>
```

## 可访问性

- **键盘操作**：通过 v-calendar 内置支持，可使用方向键在日期间导航，`Enter` / `Space` 选择日期，`Escape` 关闭弹出面板（如有）
- **ARIA 属性**：v-calendar 自动为日期网格管理 `role="grid"`、`role="gridcell"` 等语义化属性
- **焦点管理**：导航按钮可通过 `Tab` 键聚焦，日期单元格支持方向键导航
