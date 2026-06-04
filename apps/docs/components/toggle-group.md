---
title: Toggle Group 切换组
description: 切换按钮组，支持单选或多选组合，适合控制视图或排版。
---

# Toggle Group 切换组

基于 reka-ui 的 ToggleGroup 原语构建的新粗野主义风格切换按钮组，支持单选或多选。

## 预览

<ComponentPreview>
  <ToggleGroupDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="toggle-group" />

## 用法

### 单选

`type="single"` 时只能选中一个按钮，`modelValue` 为 `string`。

```vue
<script setup>
import { ref } from 'vue'
import { ToggleGroup, ToggleGroupItem } from 'brutx-ui-vue'
import { AlignLeft, AlignCenter, AlignRight } from '@lucide/vue'

const align = ref('left')
</script>

<template>
    <ToggleGroup type="single" v-model="align" variant="default">
        <ToggleGroupItem value="left">
            <AlignLeft class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center">
            <AlignCenter class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right">
            <AlignRight class="h-4 w-4" />
        </ToggleGroupItem>
    </ToggleGroup>
</template>
```

### 多选

`type="multiple"` 时可以同时选中多个按钮，`modelValue` 为 `string[]`。

```vue
<script setup>
import { ref } from 'vue'
import { ToggleGroup, ToggleGroupItem } from 'brutx-ui-vue'
import { Bold, Italic, Underline } from '@lucide/vue'

const styles = ref([])
</script>

<template>
    <ToggleGroup type="multiple" v-model="styles" variant="default">
        <ToggleGroupItem value="bold">
            <Bold class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic">
            <Italic class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline">
            <Underline class="h-4 w-4" />
        </ToggleGroupItem>
    </ToggleGroup>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 带背景和小阴影，按下时为主色背景 |
| `outline` | 透明带边框，按下时为辅助色背景 |

变体在 `ToggleGroup` 上设置，会通过 provide/inject 下发给所有 `ToggleGroupItem`，子项也可单独覆盖。

## 尺寸

| 尺寸 | 高度 | 最小宽度 | 字体大小 |
|------|------|----------|----------|
| `sm` | `h-8` | `min-w-8` | `text-xs` |
| `default` | `h-10` | `min-w-10` | `text-sm` |
| `lg` | `h-12` | `min-w-12` | `text-sm` |

## 属性

### ToggleGroup

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `type` | `'single' \| 'multiple'` | `'single'` |
| `modelValue` | `string \| string[]` | — |
| `defaultValue` | `string \| string[]` | — |
| `variant` | `'default' \| 'outline'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `disabled` | `boolean` | `false` |
| `class` | `string` | — |

### ToggleGroupItem

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `value` | `string` | —（必填） |
| `variant` | `'default' \| 'outline'` | 继承 ToggleGroup |
| `size` | `'sm' \| 'default' \| 'lg'` | 继承 ToggleGroup |
| `disabled` | `boolean` | `false`（继承 ToggleGroup） |
| `class` | `string` | — |

## 事件

### ToggleGroup

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `string \| string[]` |

## 样式

- **未按下**：带背景和小阴影，悬停时上浮并增大阴影
- **按下**：主色/辅助色背景，无阴影，向下偏移（pressed offset）
- **禁用**：降低不透明度，显示禁止光标
