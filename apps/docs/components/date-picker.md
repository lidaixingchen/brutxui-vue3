---
title: DatePicker 日期选择器
description: 新粗野主义风格的日期选择器组件族，支持单日期、日期范围、日期时间、周/月/年选择，基于 v-calendar 与 reka-ui Popover 构建。
---

# DatePicker 日期选择器

新粗野主义风格的日期选择器组件族，基于 v-calendar 与 reka-ui Popover 构建。提供 7 个可直接使用的选择器，以及可独立组合的日期面板和页脚。弹出式选择器共享触发器样式变体，TimePicker 使用独立的时间下拉框布局。

## 预览

<ComponentPreview>
  <DatePickerDemo />
</ComponentPreview>

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
import { DatePicker } from 'brutx-ui-vue/date-picker'

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
import { DatePicker } from 'brutx-ui-vue/date-picker'

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
import { DatePickerRange } from 'brutx-ui-vue/date-picker'

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
import { DateTimePicker } from 'brutx-ui-vue/date-picker'

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

`TimePicker` 基于 Select 组件组合小时、分钟和可选的秒下拉框，使用 `disabled`、`showSeconds`、`timeStep`、`embedded` 和 `ariaLabel` 配置。弹出日期选择器的 `open`、`readonly`、`clearable`、`size`、`variant`、`shortcuts`、`minDate`、`maxDate` 和 `displayFormat` 不属于其公开属性。

```vue
<script setup>
import { ref } from 'vue'
import { TimePicker } from 'brutx-ui-vue/date-picker'

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
import { WeekPicker } from 'brutx-ui-vue/date-picker'

const week = ref(null)
</script>

<template>
    <WeekPicker v-model="week" :week-starts-on="1" placeholder="选择周" />
</template>
```

`weekStartsOn`：`0` = 周日起始，`1` = 周一起始（默认）。选中任意日期后，`modelValue` 会自动对齐到当周起始日，并整周高亮。

> **注意**：`weekStartsOn` 默认值（`1`，周一起始）不随 `useLocale` 区域设置自动推导，是设计限制。ISO 8601 与中文地区习惯均为周一起始，若业务需要周日起始（如 en-US 习惯），请显式传入 `weekStartsOn: 0`。

### MonthPicker 月份选择

```vue
<script setup>
import { ref } from 'vue'
import { MonthPicker } from 'brutx-ui-vue/date-picker'

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
import { YearPicker } from 'brutx-ui-vue/date-picker'

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
import { DatePicker } from 'brutx-ui-vue/date-picker'

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

`displayFormat` 只影响输入框中的展示字符串，不改变 `modelValue`、`minDate`、`maxDate`、`shortcuts` 和事件参数的类型；这些公开 API 始终使用 `Date`、`[Date, Date]` 或 `null`。如需跨时区一致的日期时间语义，请在业务层传入已经标准化的 `Date`、时间戳或带时区偏移的完整 ISO 字符串后再转换为 `Date`，不要依赖浏览器对任意日期字符串的隐式解析。

## 子组件

| 组件 | 用途 |
|------|------|
| `DatePicker` | 单日期选择 |
| `DatePickerRange` | 日期范围选择（起止日期） |
| `DateTimePicker` | 日期 + 时间选择 |
| `TimePicker` | 纯时间选择（时/分/秒） |
| `WeekPicker` | 周选择（整周高亮） |
| `MonthPicker` | 月份选择 |
| `YearPicker` | 年份选择 |
| `DatePickerPanel` | 可独立嵌入的单日期面板 |
| `DatePickerRangePanel` | 可独立嵌入的日期范围面板 |
| `DateTimePickerPanel` | 组合日历与 TimePicker 的日期时间面板 |
| `WeekPickerPanel` | 将选中日期对齐到周起始日的周面板 |
| `MonthPickerPanel` | 按年份切换视图的月份网格 |
| `YearPickerPanel` | 支持自定义每页年份数量的年份网格 |
| `DatePickerPanelFooter` | 提供清除、确认按钮及对应事件的面板页脚 |

## 数据类型

```typescript
// 单日期快捷选项
interface DatePickerShortcut {
    label: string
    value: Date | (() => Date)
}

// 起止顺序固定的日期范围
type DateRange = readonly [Date, Date]

// 日期范围快捷选项
interface DatePickerRangeShortcut {
    label: string
    value: DateRange | (() => DateRange)
}
```

## 组合式函数

`DatePicker` 等组件的弹出面板触发、显示格式化、清除、确认等逻辑已抽取为独立的 `useDatePicker` 组合式函数，可在需要构建完全自定义触发器或日历面板时单独使用。它负责管理面板开关状态、显示值与 `modelValue` 的同步，并通过传入的 `emit` 触发 `open` / `close` / `change` / `update:modelValue` 事件。

```ts
import { useDatePicker } from 'brutx-ui-vue/useDatePicker'
import type { UseDatePickerOptions } from 'brutx-ui-vue/useDatePicker'

const props = defineProps<{ modelValue?: Date | null }>()

const emit = defineEmits<{
    'update:modelValue': [value: Date | null]
    'change': [value: Date | null]
    'open': []
    'close': []
}>()

const {
    open,                  // 面板是否打开
    displayValue,          // 面板内当前显示的值（未确认前的临时值）
    formattedDisplay,      // 格式化后的展示字符串
    handlePanelUpdate,     // 面板值更新回调
    handlePanelConfirm,    // 面板确认回调
    handlePanelClear,      // 面板清除回调
    handleClearClick,      // 触发器清除按钮点击回调
    handleTriggerKeydown,  // 触发器键盘事件回调
} = useDatePicker({
    modelValue: () => props.modelValue ?? null,
    displayFormat: 'YYYY-MM-DD',
    disabled: false,
    readonly: false,
    emit,
})
```

### UseDatePickerOptions

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `MaybeRefOrGetter<Date \| null>` | `null` | 当前选中日期（支持 v-model） |
| `displayFormat` | `MaybeRefOrGetter<string>` | `'YYYY-MM-DD'` | 显示格式（支持 `YYYY`、`YY`、`MM`、`DD`、`HH`、`mm`、`ss`、`WW` token） |
| `disabled` | `MaybeRefOrGetter<boolean>` | `false` | 是否禁用 |
| `readonly` | `MaybeRefOrGetter<boolean>` | `false` | 阻止内部打开面板 |
| `openProp` | `MaybeRefOrGetter<boolean \| undefined>` | `undefined` | 受控面板开关；省略时使用内部状态 |
| `emitUpdateOpen` | `(value: boolean) => void` | — | 请求设置面板开关时调用，配合 openProp 同步受控状态 |
| `emit` | `DatePickerEmit` | — | 触发事件的函数（必填，类型与组件 emits 一致） |

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `open` | `Ref<boolean>` | 面板是否打开 |
| `displayValue` | `Readonly<Ref<Date \| null>>` | 面板内当前显示的值，对调用方只读 |
| `formattedDisplay` | `ComputedRef<string>` | 按 `displayFormat` 格式化后的字符串 |
| `handlePanelUpdate(value)` | `(value: Date \| null) => void` | 面板值更新时调用，同步 `displayValue` 并触发 `update:modelValue` |
| `handlePanelConfirm(value)` | `(value: Date \| null) => void` | 面板确认时调用，触发 `update:modelValue` / `change` 并关闭面板 |
| `handlePanelClear()` | `() => void` | 面板清除时调用，触发 `update:modelValue(null)` / `change(null)` |
| `handleClearClick(event)` | `(event: Event) => void` | 触发器清除按钮回调，阻止事件冒泡并清除值 |
| `handleTriggerKeydown(event)` | `(event: KeyboardEvent) => void` | 禁用或只读时阻止 Enter / Space 的默认操作；正常打开行为由触发原语处理 |

> 提示：`emit` 必须符合 `DatePickerEmit` 签名。请在 `setup()` 或受管理的 Vue effect scope 中调用，以便清理内部响应式监听。

## 程序化控制

`DatePicker`、`DateTimePicker`、`WeekPicker`、`MonthPicker`、`YearPicker` 通过 `defineExpose` 暴露 `open` 响应式引用，允许父组件程序化打开或关闭日期面板。`open` 是与内部 Popover 双向绑定的可读写引用；受控模式下写入会发出 `update:open`，由父组件更新 `open` 后生效。`readonly` 会阻止组件内部发起打开请求。

> 注意：`DatePickerRange` 和 `TimePicker` 未暴露 `open`。`DatePicker`、`DateTimePicker`、`WeekPicker`、`MonthPicker`、`YearPicker` 同时支持 `v-model:open` 双向绑定，推荐使用 `v-model:open` 替代直接操作 ref。

```vue
<script setup>
import { ref } from 'vue'
import { DatePicker } from 'brutx-ui-vue/date-picker'
import { Button } from 'brutx-ui-vue/button'

const pickerRef = ref()
const date = ref(null)
</script>

<template>
    <DatePicker ref="pickerRef" v-model="date" />

    <Button @click="pickerRef && (pickerRef.open = true)">打开面板</Button>
    <Button @click="pickerRef && (pickerRef.open = false)">关闭面板</Button>
</template>
```

<span id="methods"></span>

## API 参考

<span id="datepicker"></span>
<span id="datepickerrange"></span>
<span id="datetimepicker"></span>
<span id="timepicker"></span>
<span id="weekpicker"></span>
<span id="monthpicker"></span>
<span id="yearpicker"></span>

<span id="事件"></span>

<ComponentApi name="date-picker" />

## 可访问性

### 键盘导航

| 按键 | 操作 |
|------|------|
| `Enter` / `Space` | 打开面板 |
| `Escape` | 关闭面板 |
| `Tab` | 在输入框和面板间切换 |

## 常见问题

**Q: 安装后组件报错找不到 `v-calendar` 模块？**

A: `DatePicker` 组件依赖 `v-calendar`，属于额外依赖，需要手动安装：`pnpm add v-calendar`。安装后重启开发服务器即可正常运行。

**Q: `DatePickerRange` 为什么没有 `open` 属性？**

A: `DatePickerRange` 和 `TimePicker` 未暴露 `open` 响应式引用，不支持通过 `v-model:open` 双向绑定控制面板状态。如果需要程序化控制面板开关，请使用 `DatePicker`、`DateTimePicker`、`WeekPicker`、`MonthPicker` 或 `YearPicker`。

**Q: WeekPicker 选中日期后，为什么显示的周起始日与预期不符？**

A: `WeekPicker` 的 `weekStartsOn` 属性控制周起始日：`0` 表示周日起始，`1` 表示周一起始（默认）。选中任意日期后，`modelValue` 会自动对齐到当周的起始日。如果显示结果与预期不符，请检查 `weekStartsOn` 的设置是否符合业务需求。
