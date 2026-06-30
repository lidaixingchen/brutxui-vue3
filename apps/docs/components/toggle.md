---
title: Toggle 切换
description: 独立切换按钮，用于表示启用/关闭或选中/未选中状态。
---

# Toggle 切换

基于 reka-ui 的 Toggle 原语构建的新粗野主义风格切换按钮，支持按下状态。

## 预览

<ComponentPreview>
  <ToggleDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="toggle" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Toggle } from 'brutx-ui-vue'
import { Bold, Italic, Underline } from '@lucide/vue'

const bold = ref(false)
const italic = ref(false)
const underline = ref(false)
</script>

<template>
    <div class="flex items-center gap-2">
        <Toggle v-model="bold" variant="default" size="default">
            <Bold class="h-4 w-4" />
        </Toggle>
        <Toggle v-model="italic" variant="default" size="default">
            <Italic class="h-4 w-4" />
        </Toggle>
        <Toggle v-model="underline" variant="default" size="default">
            <Underline class="h-4 w-4" />
        </Toggle>
    </div>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 带背景和小阴影，按下时为主色背景 |
| `outline` | 透明带边框，按下时为辅助色背景 |

## 尺寸

| 尺寸 | 高度 | 最小宽度 | 字体大小 |
|------|------|----------|----------|
| `sm` | `h-8` | `min-w-8` | `text-xs` |
| `default` | `h-10` | `min-w-10` | `text-sm` |
| `lg` | `h-12` | `min-w-12` | `text-sm` |

## Loading 状态

通过 `loading` prop 显示加载指示器（`Loader2` 旋转图标），此时按钮会自动禁用并设置 `aria-busy="true"`，适合异步操作场景。loading 期间原插槽内容会被替换为旋转图标。

```vue
<script setup>
import { Toggle } from 'brutx-ui-vue'
import { Bold } from '@lucide/vue'
</script>

<template>
    <Toggle loading aria-label="加粗">
        <Bold class="h-4 w-4" />
    </Toggle>
</template>
```

## 无障碍标签

Toggle 不会自动生成默认 `aria-label`。当插槽内容仅为图标时，建议通过 `ariaLabel` prop 提供可读文本，以便屏幕阅读器正确朗读按钮用途。

```vue
<script setup>
import { ref } from 'vue'
import { Toggle } from 'brutx-ui-vue'
import { Bold } from '@lucide/vue'

const bold = ref(false)
</script>

<template>
    <Toggle v-model="bold" aria-label="加粗">
        <Bold class="h-4 w-4" />
    </Toggle>
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `boolean` | — |
| `variant` | `'default' \| 'outline'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `disabled` | `boolean` | `false` |
| `loading` | `boolean` | `false` |
| `ariaLabel` | `string` | — |
| `class` | `string` | — |

## 事件

| 事件                 | 载荷      |
| -------------------- | --------- |
| `update:modelValue`  | `boolean` |

## 样式

- **未按下**：带背景和小阴影，悬停时上浮并增大阴影
- **按下**：主色/辅助色背景，无阴影，向下偏移（按下偏移量）
- **禁用**：降低不透明度，显示禁止光标
