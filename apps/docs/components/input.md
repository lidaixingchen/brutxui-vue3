---
title: Input 输入框
description: 单行文本输入框，带新粗野主义高亮外边框和自定义占位符。
---

# Input 输入框

新粗野主义风格的文本输入框，支持变体、尺寸和 v-model 双向绑定。

## 预览

<ComponentPreview>
  <InputDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="input" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('')
</script>

<template>
    <Input v-model="value" placeholder="Enter your name..." />
</template>
```

### 搭配 Label

```vue
<script setup>
import { ref } from 'vue'
import { Input, Label } from 'brutx-ui-vue'

const email = ref('')
</script>

<template>
    <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input id="email" v-model="email" type="email" placeholder="you@example.com" />
    </div>
</template>
```

### 禁用状态

```vue
<script setup>
import { Input } from 'brutx-ui-vue'
</script>

<template>
    <Input disabled placeholder="Disabled input" />
</template>
```

### 只读状态

通过 `readonly` 属性设置只读输入框。只读状态下输入框不可编辑但可聚焦选择文本，光标样式为 `cursor-default`，不会降低透明度（区别于 `disabled`）。

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('只读内容，可选中复制但不可编辑')
</script>

<template>
    <Input v-model="value" readonly />
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 标准边框 |
| `error` | 错误边框，聚焦时使用 Primary 阴影 |
| `success` | 成功边框，聚焦时使用 Secondary 阴影 |

## 尺寸

| 尺寸 | 高度 | 内边距 | 字体大小 |
|------|------|--------|----------|
| `sm` | `h-9` | `px-3 py-1` | `text-sm` |
| `default` | `h-11` | `px-4 py-2` | `text-base` |
| `lg` | `h-14` | `px-5 py-3` | `text-lg` |

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `HTMLInputType` ¹ | `'text'` | 输入框类型 |
| `modelValue` | `string` | — | v-model 绑定值 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 输入框变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 输入框尺寸 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `readonly` | `boolean` | `false` | 是否只读 |
| `placeholder` | `string` | — | 占位符文本 |
| `ariaLabel` | `string` | — | ARIA 标签 |
| `ariaLabelledby` | `string` | — | ARIA 标签引用 ID |
| `ariaDescribedby` | `string` | — | ARIA 描述引用 ID |
| `ariaInvalid` | `boolean` | — | ARIA 无效状态 |
| `ariaRequired` | `boolean` | — | ARIA 必填状态 |
| `class` | `string` | — | 自定义 CSS 类名 |

> ¹ `HTMLInputType` 为 `HTMLInputElement.type` 支持的所有标准类型联合：`'button' | 'checkbox' | 'color' | 'date' | 'datetime-local' | 'email' | 'file' | 'hidden' | 'image' | 'month' | 'number' | 'password' | 'radio' | 'range' | 'reset' | 'search' | 'submit' | 'tel' | 'text' | 'time' | 'url' | 'week'`

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string` | 值更新时触发 |

## 可访问性

通过 ARIA 属性增强输入框的无障碍可访问性，便于辅助技术（如屏幕阅读器）正确朗读：

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const email = ref('')
</script>

<template>
    <Input
        v-model="email"
        type="email"
        aria-label="邮箱地址"
        aria-required="true"
        aria-invalid="false"
        placeholder="you@example.com"
    />
</template>
```
