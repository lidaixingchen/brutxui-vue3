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

### 带标签

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

### 禁用状态

```vue
<template>
    <Switch disabled />
</template>
```

### 自定义无障碍标签

Switch 默认通过 locale 提供 `aria-label`（中文为"开关"），确保屏幕阅读器能够正确朗读。当需要更具体的描述时，可通过 `ariaLabel` prop 自定义。未提供时回退到 `t('switch.toggle')`。

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const sync = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch v-model="sync" aria-label="自动同步数据" />
        <Label>自动同步</Label>
    </div>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `boolean` | — | 当前值，支持 `v-model` |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `ariaLabel` | `string` | locale 默认值（`switch.toggle`） | 无障碍标签文本 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `boolean` | 值变化时触发 |

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 切换开关状态
- **ARIA 属性**：自动管理 `role="switch"`、`aria-checked`；默认通过 locale 提供 `aria-label`
- **焦点管理**：可通过 Tab 键聚焦，使用 `--brutal-ring` 令牌显示可见聚焦环

## 样式定制

- **未选中**：`bg-brutal-bg` 背景，滑块在左侧
- **选中**：根据 variant 使用不同颜色（default: `bg-brutal-success`，primary: `bg-brutal-primary` 等），滑块向右平移
- **滑块**：`bg-brutal-fg` 搭配 `shadow-brutal-sm`，`rounded-brutal`
- **悬停**：阴影增大 `shadow-brutal-lg`，轻微偏移 `-translate-x-0.5 -translate-y-0.5`
- **按压**：向下位移 `translate-y-[var(--brutal-pressed-offset,2px)]`，阴影消失
- **禁用**：降低不透明度，显示禁止光标
- **聚焦**：使用 `--brutal-ring` 令牌显示可见聚焦环
