---
title: Switch 开关
description: 开关选择器组件，用于快捷切换 true/false 布尔值状态。
---

# Switch 开关

基于 reka-ui 的 Switch 原语构建的新粗野主义风格切换开关，支持 v-model。

## 预览

<ComponentPreview>
  <SwitchDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="switch" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const enabled = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch v-model="enabled" />
        <Label>Airplane mode</Label>
    </div>
</template>
```

## 带标签

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const notifications = ref(true)
</script>

<template>
    <div class="flex items-center justify-between">
        <Label for="notifications">Email notifications</Label>
        <Switch v-model="notifications" />
    </div>
</template>
```

## 禁用状态

```vue
<script setup>
import { Switch } from 'brutx-ui-vue'
</script>

<template>
    <Switch disabled />
</template>
```

## 属性

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `boolean` | — |
| `defaultValue` | `boolean` | — |
| `disabled` | `boolean` | `false` |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `boolean` |

## 样式

- **未选中**：`bg-brutal-bg` 背景，滑块在左侧
- **选中**：根据 variant 使用不同颜色（default: `bg-brutal-success`，primary: `bg-brutal-primary` 等），滑块向右平移
- **滑块**：`bg-brutal-fg` 搭配 `shadow-brutal-sm`，`rounded-brutal`
- **悬停**：阴影增大 `shadow-brutal`，轻微上移 `-translate-y-0.5`
- **按压**：向下位移 `translate-y-[var(--brutal-pressed-offset,2px)]`，阴影消失
- **禁用**：降低不透明度，显示禁止光标
- **聚焦**：使用 `--brutal-ring` 令牌显示可见聚焦环
