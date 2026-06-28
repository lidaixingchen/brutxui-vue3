---
title: Label 标签
description: 关联表单项的文本标签，支持禁用状态与点击聚焦特性。
---

# Label 标签

新粗野主义风格的标签组件，用于表单字段，支持变体。

## 预览

<ComponentPreview>
  <LabelDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="label" />

## 用法

```vue
<script setup>
import { Label, Input } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
    </div>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 标准前景色文字 |
| `error` | Destructive（红色）文字 |
| `success` | Success（绿色）文字 |
| `muted` | 柔和前景色文字 |

## 尺寸

| 尺寸 | 字体大小 | 行高 |
|------|----------|------|
| `sm` | `text-xs` | `leading-none` |
| `default` | `text-sm` | `leading-none` |
| `lg` | `text-base` | `leading-none` |

```vue
<script setup>
import { Label } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-wrap items-center gap-4">
        <Label size="sm">小号标签</Label>
        <Label size="default">默认标签</Label>
        <Label size="lg">大号标签</Label>
    </div>
</template>
```

## 必填标记

设置 `required` 属性后，标签末尾会自动渲染红色的 `*` 星号（标记为 `aria-hidden`），同时根元素会带上 `aria-required="true"` 以辅助无障碍工具识别必填项。

```vue
<script setup>
import { Label, Input } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-2">
        <Label for="username" required>用户名</Label>
        <Input id="username" placeholder="请输入用户名" />
    </div>
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `variant` | `'default' \| 'error' \| 'success' \| 'muted'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `required` | `boolean` | `false` |
| `for` | `string` | — |
| `class` | `string` | — |

## 无障碍

Label 组件渲染为 HTML `<label>` 元素。当使用 `for` 属性时，它会关联到匹配的表单控件，从而改善无障碍性和点击聚焦行为。
