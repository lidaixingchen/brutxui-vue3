---
title: DatePicker 日期选择器
description: 新粗野主义风格的日期选择器组件族，支持单日期、日期范围、日期时间、周/月/年选择，基于 v-calendar 与 reka-ui Popover 构建。
---

# DatePicker 日期选择器

新粗野主义风格的日期选择器组件族，基于 v-calendar 与 reka-ui Popover 构建。提供 7 个组件覆盖各种日期选择场景，所有组件共享统一的样式变体、国际化与无障碍支持。

## 预览

<ComponentPreview>
  <DatePickerDemo />
</ComponentPreview>

## 组件概览

| 组件 | 用途 |
|------|------|
| `DatePicker` | 单日期选择 |
| `DatePickerRange` | 日期范围选择（起止日期） |
| `DateTimePicker` | 日期 + 时间选择 |
| `TimePicker` | 纯时间选择（时/分/秒） |
| `WeekPicker` | 周选择（整周高亮） |
| `MonthPicker` | 月份选择 |
| `YearPicker` | 年份选择 |

## 安装

<InstallationTabs componentName="date-picker" />

**需要额外安装依赖：**

```bash
pnpm add v-calendar
```

## 用法

### DatePicker 单日期选择

```vue
<script setup>
import { ref } from 'vue'
import { DatePicker } from 'brutx-ui-vue'

const date = ref(null)
</script>

<template>
    <DatePicker v-model="date" placeholder="选择日期" />
</template>
```

### 带快捷选项

```vue
<script setup>
import { ref } from 'vue'
import { DatePicker } from 'brutx-ui-vue'

const date = ref(null)

const shortcuts = [
    { label: '今天', value: () => new Date() },
    { label: '明天', value: () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return d
    }},
    { label: '一周后', value: () => {
        const d = new Date()
        d.setDate(d.getDate() + 7)
        return d
    }},
]
</script>

<template>
    <DatePicker v-model="date" :shortcuts="shortcuts" :clearable="true" />
</template>
```

### DatePickerRange 日期范围选择

```vue
<script setup>
import { ref } from 'vue'
import { DatePickerRange } from 'brutx-ui-vue'

const dateRange = ref(null)
</script>

<template>
    <DatePickerRange
        v-model="dateRange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
    />
</template>
```

### DateTimePicker 日期时间选择

```vue
<script setup>
import { ref } from 'vue'
import { DateTimePicker } from 'brutx-ui-vue'

const dateTime = ref(null)
</script>

<template>
    <DateTimePicker
        v-model="dateTime"
        placeholder="选择日期时间"
        :show-seconds="true"
    />
</template>
```

`DateTimePicker` 支持时间步进配置：

```vue
<template>
    <DateTimePicker
        v-model="dateTime"
        :time-step="{ hour: 2, minute: 15, second: 10 }"
    />
</template>
```

### TimePicker 纯时间选择

```vue
<script setup>
import { ref } from 'vue'
import { TimePicker } from 'brutx-ui-vue'

const time = ref(null)
</script>

<template>
    <TimePicker v-model="time" :show-seconds="true" />
</template>
```

### WeekPicker 周选择

```vue
<script setup>
import { ref } from 'vue'
import { WeekPicker } from 'brutx-ui-vue'

const week = ref(null)
</script>

<template>
    <WeekPicker v-model="week" :week-starts-on="1" placeholder="选择周" />
</template>
```

`weekStartsOn`：`0` = 周日起始，`1` = 周一起始（默认）。选中任意日期后，`modelValue` 会自动对齐到当周起始日，并整周高亮。

### MonthPicker 月份选择

```vue
<script setup>
import { ref } from 'vue'
import { MonthPicker } from 'brutx-ui-vue'

const month = ref(null)
</script>

<template>
    <MonthPicker v-model="month" placeholder="选择月份" />
</template>
```

### YearPicker 年份选择

```vue
<script setup>
import { ref } from 'vue'
import { YearPicker } from 'brutx-ui-vue'

const year = ref(null)
</script>

<template>
    <YearPicker v-model="year" placeholder="选择年份" />
</template>
```

### 禁用与只读

```vue
<template>
    <DatePicker v-model="date" disabled />
    <DatePicker v-model="date" readonly />
</template>
```

### 日期范围限制

```vue
<script setup>
import { ref } from 'vue'
import { DatePicker } from 'brutx-ui-vue'

const date = ref(null)
const minDate = new Date(2026, 0, 1)
const maxDate = new Date(2026, 11, 31)
</script>

<template>
    <DatePicker v-model="date" :min-date="minDate" :max-date="maxDate" />
</template>
```

### 自定义显示格式

支持 `YYYY`、`YY`、`MM`、`DD`、`HH`、`mm`、`ss`、`WW`（ISO 周数）token：

```vue
<template>
    <DatePicker v-model="date" display-format="YYYY/MM/DD" />
    <DateTimePicker v-model="dt" display-format="YYYY-MM-DD HH:mm:ss" />
    <WeekPicker v-model="week" display-format="YYYY-WW" />
    <YearPicker v-model="year" display-format="YY" />
</template>
```

## Props

### DatePicker

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | 选中的日期，支持 v-model |
| `mode` | `'date' \| 'week' \| 'month' \| 'year'` | `'date'` | 选择模式 |
| `displayFormat` | `string` | `'YYYY-MM-DD'` | 显示格式 |
| `valueFormat` | `'date' \| 'timestamp' \| string` | `'date'` | 值格式（自定义字符串作为 format） |
| `placeholder` | `string` | — | 占位符文本 |
| `minDate` | `Date` | — | 最小可选日期 |
| `maxDate` | `Date` | — | 最大可选日期 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `readonly` | `boolean` | `false` | 只读状态 |
| `clearable` | `boolean` | `false` | 是否可清除 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 输入框尺寸 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 输入框变体 |
| `shortcuts` | `DatePickerShortcut[]` | `[]` | 快捷选项 |
| `name` | `string` | — | 表单字段名 |
| `id` | `string` | — | 组件 ID |
| `ariaLabel` | `string` | — | 无障碍标签 |

### DatePickerRange

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `[Date, Date] \| null` | `null` | 选中的日期范围 |
| `displayFormat` | `string` | `'YYYY-MM-DD'` | 显示格式 |
| `valueFormat` | `'date' \| 'timestamp' \| string` | `'date'` | 值格式 |
| `startPlaceholder` | `string` | — | 开始日期占位符 |
| `endPlaceholder` | `string` | — | 结束日期占位符 |
| `separator` | `string` | — | 分隔符 |
| `minDate` | `Date` | — | 最小可选日期 |
| `maxDate` | `Date` | — | 最大可选日期 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `clearable` | `boolean` | `false` | 是否可清除 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 输入框尺寸 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 输入框变体 |
| `shortcuts` | `DatePickerRangeShortcut[]` | `[]` | 快捷选项 |

### DateTimePicker

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | 选中的日期时间 |
| `displayFormat` | `string` | `'YYYY-MM-DD HH:mm'` | 显示格式（showSeconds 时默认含 ss） |
| `timeFormat` | `string` | — | 时间格式 |
| `showSeconds` | `boolean` | `false` | 是否显示秒 |
| `timeStep` | `{ hour?: number; minute?: number; second?: number }` | — | 时间步进 |
| `placeholder` | `string` | — | 占位符文本 |
| `minDate` | `Date` | — | 最小可选日期 |
| `maxDate` | `Date` | — | 最大可选日期 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `readonly` | `boolean` | `false` | 只读状态 |
| `clearable` | `boolean` | `false` | 是否可清除 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 输入框尺寸 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 输入框变体 |
| `shortcuts` | `DatePickerShortcut[]` | `[]` | 快捷选项 |

### TimePicker

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | 选中的时间 |
| `showSeconds` | `boolean` | `false` | 是否显示秒 |
| `timeStep` | `{ hour?: number; minute?: number; second?: number }` | — | 时间步进 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `readonly` | `boolean` | `false` | 只读状态 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `ariaLabel` | `string` | — | 无障碍标签 |

### WeekPicker

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | 选中的周（对齐到周起始日） |
| `displayFormat` | `string` | `'YYYY-WW'` | 显示格式 |
| `valueFormat` | `'date' \| 'timestamp' \| string` | `'date'` | 值格式 |
| `weekStartsOn` | `0 \| 1` | `1` | 周起始日（0=周日，1=周一） |
| `placeholder` | `string` | — | 占位符文本 |
| `minDate` | `Date` | — | 最小可选日期 |
| `maxDate` | `Date` | — | 最大可选日期 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `readonly` | `boolean` | `false` | 只读状态 |
| `clearable` | `boolean` | `false` | 是否可清除 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 输入框尺寸 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 输入框变体 |
| `shortcuts` | `DatePickerShortcut[]` | `[]` | 快捷选项 |

### MonthPicker

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | 选中的月份 |
| `displayFormat` | `string` | `'YYYY-MM'` | 显示格式 |
| `valueFormat` | `'date' \| 'timestamp' \| string` | `'date'` | 值格式 |
| `placeholder` | `string` | — | 占位符文本 |
| `minDate` | `Date` | — | 最小可选日期 |
| `maxDate` | `Date` | — | 最大可选日期 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `readonly` | `boolean` | `false` | 只读状态 |
| `clearable` | `boolean` | `false` | 是否可清除 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 输入框尺寸 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 输入框变体 |

### YearPicker

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | 选中的年份 |
| `displayFormat` | `string` | `'YYYY'` | 显示格式 |
| `valueFormat` | `'date' \| 'timestamp' \| string` | `'date'` | 值格式 |
| `placeholder` | `string` | — | 占位符文本 |
| `minDate` | `Date` | — | 最小可选日期 |
| `maxDate` | `Date` | — | 最大可选日期 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `readonly` | `boolean` | `false` | 只读状态 |
| `clearable` | `boolean` | `false` | 是否可清除 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 输入框尺寸 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 输入框变体 |

## 事件

所有日期选择器组件共享以下事件：

| 事件 | 载荷 | 说明 |
|------|------|------|
| `update:modelValue` | `Date \| [Date, Date] \| null` | 值变化时触发 |
| `change` | `Date \| [Date, Date] \| null` | 面板关闭且值变化时触发 |
| `open` | — | 面板打开时触发 |
| `close` | — | 面板关闭时触发 |

## 快捷选项类型

```typescript
// 单日期快捷选项
interface DatePickerShortcut {
    label: string
    value: Date | (() => Date)
}

// 日期范围快捷选项
interface DatePickerRangeShortcut {
    label: string
    value: [Date, Date] | (() => [Date, Date])
}
```

## 键盘导航

| 按键 | 操作 |
|------|------|
| `Enter` / `Space` | 打开面板 |
| `Escape` | 关闭面板 |
| `Tab` | 在输入框和面板间切换 |

## 样式

所有日期选择器组件遵循新粗野主义设计规范：

- **触发器**：`border-3 border-brutal` 粗边框 + `shadow-brutal` 硬质阴影，按压时位移反馈
- **弹出面板**：粗边框 + 大号硬质阴影（`shadow-brutal-lg`）
- **日期单元格**：选中态使用 Primary 背景色 + 粗边框；今天使用 Secondary 背景色
- **周高亮**（WeekPicker）：Accent 背景色覆盖整周范围
- **快捷选项**：悬停时背景色变化 + 位移，选中态使用 Primary 背景
- **页脚按钮**：清除（默认背景）+ 确认（Primary 背景），均有按压反馈

组件内部覆盖了 v-calendar 的 CSS 变量以适配 brutal 风格，与 Calendar 组件保持一致。
