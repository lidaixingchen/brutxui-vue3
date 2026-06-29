---
title: Textarea 文本域
description: 多行文本输入域，支持自适应高度或固定行高，硬边框外观。
---

# Textarea 文本域

新粗野主义风格多行文本输入框，支持变体、尺寸和 v-model。

## 预览

<ComponentPreview>
  <TextareaDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="textarea" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Textarea } from 'brutx-ui-vue'

const message = ref('')
</script>

<template>
    <Textarea v-model="message" placeholder="Type your message here..." />
</template>
```

### 变体

通过 `variant` 属性设置不同的边框样式：

```vue
<template>
    <Textarea variant="default" placeholder="Default variant" />
    <Textarea variant="error" placeholder="Error variant" />
    <Textarea variant="success" placeholder="Success variant" />
</template>
```

### 尺寸

通过 `size` 属性设置不同的尺寸：

```vue
<template>
    <Textarea size="sm" placeholder="Small size" />
    <Textarea size="default" placeholder="Default size" />
    <Textarea size="lg" placeholder="Large size" />
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 标准边框 |
| `error` | 危险色边框，主色聚焦阴影 |
| `success` | 成功色边框，辅助色聚焦阴影 |

## 尺寸

| 尺寸 | 内边距 | 字体大小 |
|------|--------|----------|
| `sm` | `px-3 py-2` | `text-sm` |
| `default` | `px-4 py-3` | `text-base` |
| `lg` | `px-5 py-4` | `text-lg` |

## 带标签

```vue
<script setup>
import { ref } from 'vue'
import { Textarea, Label } from 'brutx-ui-vue'

const bio = ref('')
</script>

<template>
    <div class="space-y-2">
        <Label for="bio">Bio</Label>
        <Textarea id="bio" v-model="bio" placeholder="Tell us about yourself..." />
    </div>
</template>
```

## 禁用状态

```vue
<script setup>
import { Textarea } from 'brutx-ui-vue'
</script>

<template>
    <Textarea disabled placeholder="Disabled textarea" />
</template>
```

## 只读状态

通过 `readonly` 属性设置只读文本域。只读状态下文本域不可编辑但可聚焦选择文本，光标样式为 `cursor-default`，不会降低透明度（区别于 `disabled`）。

```vue
<script setup>
import { ref } from 'vue'
import { Textarea } from 'brutx-ui-vue'

const content = ref('这是一段只读内容，用户可以选中和复制文本，但无法修改。适用于展示协议条款、历史记录等场景。')
</script>

<template>
    <Textarea v-model="content" readonly />
</template>
```

## 无障碍

通过 ARIA 属性增强文本域的无障碍可访问性，便于辅助技术（如屏幕阅读器）正确朗读：

```vue
<script setup>
import { ref } from 'vue'
import { Textarea } from 'brutx-ui-vue'

const bio = ref('')
</script>

<template>
    <Textarea
        v-model="bio"
        aria-label="个人简介"
        aria-required="true"
        aria-invalid="false"
        placeholder="请输入个人简介..."
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `string` | — |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `disabled` | `boolean` | `false` |
| `readonly` | `boolean` | `false` |
| `placeholder` | `string` | `t('textarea.placeholder')` |
| `ariaLabel` | `string` | — |
| `ariaLabelledby` | `string` | — |
| `ariaDescribedby` | `string` | — |
| `ariaInvalid` | `boolean` | — |
| `ariaRequired` | `boolean` | — |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `string` |

## 样式

Textarea 默认设置了 `resize-none`。如需允许调整大小，可通过自定义 class 覆盖：

```vue
<script setup>
import { Textarea } from 'brutx-ui-vue'
</script>

<template>
    <Textarea class="resize-y" placeholder="Resizable textarea" />
</template>
```
