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

预设也支持带标签的对象格式：

```vue
<script setup>
const presets = [
    { label: '珊瑚红', value: '#FF6B6B' },
    { label: '薄荷青', value: '#4ECDC4' },
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

```vue
<template>
    <ColorPicker v-model="color" size="sm" />
    <ColorPicker v-model="color" size="default" />
    <ColorPicker v-model="color" size="lg" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string \| null` | `null` | 选中的颜色值，支持 v-model |
| `format` | `'hex' \| 'rgb' \| 'hsl'` | `'hex'` | 颜色格式 |
| `showAlpha` | `boolean` | `false` | 是否支持透明度通道 |
| `presets` | `string[] \| ColorPreset[]` | — | 预设颜色列表 |
| `showPresets` | `boolean` | `true` | 是否显示预设颜色 |
| `presetsLabel` | `string` | — | 预设区域标签文本 |
| `showHistory` | `boolean` | `false` | 是否显示颜色历史记录 |
| `historyMax` | `number` | `10` | 历史记录最大数量 |
| `historyStorageKey` | `string` | — | 历史记录 localStorage 键名 |
| `showInput` | `boolean` | `true` | 是否显示输入框 |
| `placeholder` | `string` | — | 占位符文本 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `clearable` | `boolean` | `false` | 是否可清除 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 输入框尺寸 |
| `name` | `string` | — | 表单字段名 |
| `id` | `string` | — | 组件 ID |
| `ariaLabel` | `string` | — | 无障碍标签 |
| `class` | `string` | — | 自定义类名 |

## 事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `update:modelValue` | `string \| null` | 颜色变化时触发 |
| `change` | `string \| null` | 面板关闭且值变化时触发 |
| `open` | — | 面板打开时触发 |
| `close` | — | 面板关闭时触发 |

## 颜色格式说明

| 格式 | 示例 | 说明 |
|------|------|------|
| `hex` | `#FF6B6B` / `#FF6B6B80` | 十六进制（含 alpha 时追加两位） |
| `rgb` | `rgb(255, 107, 107)` / `rgba(255, 107, 107, 0.5)` | RGB 函数表示法 |
| `hsl` | `hsl(0, 100%, 71%)` / `hsla(0, 100%, 71%, 0.5)` | HSL 函数表示法 |

## 键盘导航

| 按键 | 操作 |
|------|------|
| `Enter` / `Space` | 打开面板 |
| `Escape` | 关闭面板 |

## 样式

ColorPicker 遵循新粗野主义设计规范：

- **触发器**：`border-3 border-brutal` 粗边框 + `shadow-brutal` 硬质阴影，按压时位移反馈
- **颜色色块**：粗边框包裹当前选中颜色预览
- **弹出面板**：粗边框 + 大号硬质阴影（`shadow-brutal-lg`）
- **饱和度区域**：粗边框，可拖拽选择饱和度/亮度
- **滑块**：粗边框 + 硬质阴影，色相滑块显示彩虹渐变，透明度滑块显示棋盘格背景
- **预设/历史色块**：粗边框小方块，悬停时位移 + 阴影增大
- **输入框**：等宽字体，粗边框

所有颜色使用 `--brutal-*` CSS 变量，自动适配亮色/暗色主题。
