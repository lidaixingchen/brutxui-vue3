---
title: ColorPicker 颜色选择器
description: 新粗野主义风格的颜色选择器组件，支持 HEX/RGB/HSL 格式、透明度、预设颜色与历史记录。
---

# ColorPicker 颜色选择器

新粗野主义风格的颜色选择器组件，基于 reka-ui Popover 构建。支持 HEX/RGB/HSL 多种颜色格式、透明度通道、预设颜色调色板和本地存储的颜色历史记录。

## 预览

<ComponentPreview>
  <ColorPickerDemo />
</ComponentPreview>

颜色选择器提供饱和度/亮度选择区域、色相滑块、透明度滑块、HEX 输入框、预设颜色和历史记录。

## 安装

<InstallationTabs componentName="color-picker" />

## 用法

### 基础用法

```vue
<script setup>
import { ref } from 'vue'
import { ColorPicker } from 'brutx-ui-vue'

const color = ref(null)
</script>

<template>
    <ColorPicker v-model="color" placeholder="选择颜色" />
</template>
```

### 指定颜色格式

支持 `hex`（默认）、`rgb`、`hsl` 三种格式，`modelValue` 会以对应格式输出：

```vue
<script setup>
import { ref } from 'vue'
import { ColorPicker } from 'brutx-ui-vue'

const color = ref(null)
</script>

<template>
    <ColorPicker v-model="color" format="rgb" />
    <ColorPicker v-model="color" format="hsl" />
</template>
```

### 透明度通道

启用 `showAlpha` 后，面板会显示透明度滑块，输出值含 alpha 通道：

```vue
<template>
    <ColorPicker v-model="color" :show-alpha="true" />
</template>
```

### 预设颜色

内置 Tailwind CSS 默认调色板，也可自定义预设：

```vue
<script setup>
import { ref } from 'vue'
import { ColorPicker } from 'brutx-ui-vue'

const color = ref(null)
const presets = [
    '#FF6B6B',
    '#4ECDC4',
    '#FFE66D',
    '#EF476F',
    '#7FB069',
]
</script>

<template>
    <ColorPicker v-model="color" :presets="presets" :show-presets="true" />
</template>
```

预设也支持带标签的对象格式（可选 `disabled` 字段禁用单个色块）：

```vue
<script setup>
const presets = [
    { label: '珊瑚红', value: '#FF6B6B' },
    { label: '薄荷青', value: '#4ECDC4' },
    { label: '已废弃', value: '#999999', disabled: true },
]
</script>
```

### 颜色历史记录

启用 `showHistory` 后，用户选择的颜色会自动记录到历史，默认存储在 localStorage：

```vue
<template>
    <ColorPicker
        v-model="color"
        :show-history="true"
        :history-max="20"
        history-storage-key="my-app-color-history"
    />
</template>
```

### 可清除

```vue
<template>
    <ColorPicker v-model="color" :clearable="true" />
</template>
```

### 禁用状态

```vue
<template>
    <ColorPicker v-model="color" disabled />
</template>
```

### 尺寸

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸 |
| `default` | 默认尺寸 |
| `lg` | 大尺寸 |

```vue
<template>
    <ColorPicker v-model="color" size="sm" />
    <ColorPicker v-model="color" size="default" />
    <ColorPicker v-model="color" size="lg" />
</template>
```

## 数据类型

| 格式 | 示例 | 说明 |
|------|------|------|
| `hex` | `#FF6B6B` / `#FF6B6B80` | 十六进制（含 alpha 时追加两位） |
| `rgb` | `rgb(255, 107, 107)` / `rgba(255, 107, 107, 0.5)` | RGB 函数表示法 |
| `hsl` | `hsl(0, 100%, 71%)` / `hsla(0, 100%, 71%, 0.5)` | HSL 函数表示法 |

## 组合式函数

`ColorPicker` 组件的弹出面板触发、颜色格式归一化、清除、确认等逻辑已抽取为独立的 `useColorPicker` 组合式函数，可在需要构建完全自定义触发器或调色面板时单独使用。它负责管理面板开关状态、显示值与 `modelValue` 的同步、按目标格式归一化展示，并通过传入的 `emit` 触发 `open` / `close` / `change` / `update:modelValue` 事件。

```ts
import { useColorPicker } from 'brutx-ui-vue'
import type { UseColorPickerOptions } from 'brutx-ui-vue'

const emit = defineEmits<{
    'update:modelValue': [value: string | null]
    'change': [value: string | null]
    'open': []
    'close': []
}>()

const {
    open,                  // 面板是否打开
    displayValue,          // 面板内当前显示的值
    normalizedDisplay,     // 按目标格式归一化后的展示字符串
    swatchStyle,           // 触发器色块的内联样式
    handlePanelUpdate,     // 面板值更新回调
    handlePanelConfirm,    // 面板确认回调
    handlePanelClear,      // 面板清除回调
    handleClearClick,      // 触发器清除按钮点击回调
    handleTriggerKeydown,  // 触发器键盘事件回调
} = useColorPicker({
    modelValue,
    format: 'hex',
    showAlpha: false,
    disabled: false,
    emit,
})
```

### 选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `MaybeRefOrGetter<string \| null>` | `null` | 当前选中颜色（支持 v-model） |
| `format` | `MaybeRefOrGetter<'hex' \| 'rgb' \| 'hsl'>` | `'hex'` | 颜色格式 |
| `showAlpha` | `MaybeRefOrGetter<boolean>` | `false` | 是否支持透明度通道 |
| `disabled` | `MaybeRefOrGetter<boolean>` | `false` | 是否禁用 |
| `emit` | `ColorPickerEmit` | — | 触发事件的函数（必填，类型与组件 emits 一致） |

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `open` | `Ref<boolean>` | 面板是否打开 |
| `displayValue` | `Ref<string \| null>` | 面板内当前显示的值 |
| `normalizedDisplay` | `ComputedRef<string \| null>` | 按 `format` 归一化后的展示字符串（无法解析时为 `null`） |
| `swatchStyle` | `ComputedRef<{ backgroundColor: string }>` | 触发器色块的内联样式 |
| `handlePanelUpdate(value)` | `(value: string \| null) => void` | 面板值更新时调用，同步 `displayValue` 并触发 `update:modelValue` |
| `handlePanelConfirm(value)` | `(value: string \| null) => void` | 面板确认时调用，触发 `update:modelValue` / `change` 并关闭面板 |
| `handlePanelClear()` | `() => void` | 面板清除时调用，触发 `update:modelValue(null)` / `change(null)` |
| `handleClearClick(event)` | `(event: MouseEvent) => void` | 触发器清除按钮点击回调，阻止事件冒泡并清除 |
| `handleTriggerKeydown(event)` | `(event: KeyboardEvent) => void` | 触发器键盘事件回调，`Enter` / `Space` 打开面板（禁用时不响应） |

> 提示：`emit` 必须是符合 `ColorPickerEmit` 签名的函数（即组件 `defineEmits` 的返回值）。颜色解析与格式化由 `@/lib/color` 的 `parseColor` / `formatColor` 提供。

## 程序化控制

`ColorPicker` 通过 `defineExpose` 暴露 `open` 响应式引用，允许父组件程序化打开或关闭颜色面板。`open` 是与内部 Popover 双向绑定的 `Ref<boolean>`，可直接读写。

```vue
<script setup>
import { ref } from 'vue'
import { ColorPicker } from 'brutx-ui-vue'

const pickerRef = ref()
const color = ref(null)
</script>

<template>
    <ColorPicker ref="pickerRef" v-model="color" />

    <button @click="pickerRef?.open = true">打开面板</button>
    <button @click="pickerRef?.open = false">关闭面板</button>
</template>
```

### 暴露的 API

| 方法/属性 | 类型 | 说明 |
|-----------|------|------|
| `open` | `Ref<boolean>` | 面板开关状态，可读写；设为 `true` 打开，`false` 关闭 |

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string \| null` | `null` | 选中的颜色值，支持 v-model |
| `format` | `'hex' \| 'rgb' \| 'hsl'` | `'hex'` | 颜色格式 |
| `showAlpha` | `boolean` | `false` | 是否支持透明度通道 |
| `presets` | `string[] \| ColorPreset[]` | — | 预设颜色列表 |
| `showPresets` | `boolean` | `true` | 是否显示预设颜色 |
| `presetsLabel` | `string` | — | 预设区域标签文本 |
| `showHistory` | `boolean` | `true` | 是否显示颜色历史记录 |
| `historyMax` | `number` | `8` | 历史记录最大数量 |
| `historyStorageKey` | `string` | `'brutx-color-history'` | 历史记录 localStorage 键名 |
| `showInput` | `boolean` | `true` | 是否显示输入框 |
| `placeholder` | `string` | — | 占位符文本 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `clearable` | `boolean` | `false` | 是否可清除 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 输入框尺寸 |
| `name` | `string` | — | 表单字段名 |
| `id` | `string` | — | 组件 ID |
| `ariaLabel` | `string` | — | 无障碍标签 |
| `open` | `boolean` | — | 面板是否打开，支持 v-model:open 双向绑定 |
| `class` | `string` | — | 自定义类名 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string \| null` | 颜色变化时触发 |
| `change` | `string \| null` | 面板关闭且值变化时触发，也由确认/清除操作触发 |
| `open` | — | 面板打开时触发 |
| `close` | — | 面板关闭时触发 |
| `update:open` | `boolean` | 面板开关状态变化时触发，配合 v-model:open 使用 |

## 可访问性

### 触发器

| 按键 | 操作 |
|------|------|
| `Enter` / `Space` | 打开面板（禁用时不响应） |
| `Escape` | 关闭面板 |

### 饱和度/亮度区域

| 按键 | 操作 |
|------|------|
| `←` / `→` | 调整饱和度（步长 1，Shift 步长 10） |
| `↑` / `↓` | 调整亮度（步长 1，Shift 步长 10） |

### 色相滑块

| 按键 | 操作 |
|------|------|
| `←` / `→` | 调整色相（步长 1，Shift 步长 15） |

### 透明度滑块

| 按键 | 操作 |
|------|------|
| `←` / `→` | 调整透明度（步长 0.01，Shift 步长 0.1） |
