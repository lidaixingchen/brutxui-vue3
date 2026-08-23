---
title: Switch 开关
description: 开关选择器组件，用于快捷切换 true/false 布尔值状态。
---

# Switch 开关

基于 reka-ui 的 Switch 原语构建的新粗野主义风格机械切换开关，采用 3D 立体键帽、冲压导轨凹槽与工控通断刻印，支持 v-model。

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
        <Label>飞行模式</Label>
    </div>
</template>
```

### 工控铭牌刻印 (I / O Marks)

开启 `showLabels` 可在导轨内呈现高对比度等宽工控通断刻印（`I` / `O`），纯视觉呈现且带 `aria-hidden`，对屏幕阅读器零噪音。

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const power = ref(true)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch v-model="power" show-labels />
        <Label>设备主电源</Label>
    </div>
</template>
```

### 机械形态 (Shape)

支持标准机械滑块 `slider` 与工控翘板 `rocker` 形态，与颜色主题 `variant` 正交解耦。

```vue
<script setup>
import { ref } from 'vue'
import { Switch } from 'brutx-ui-vue'

const val1 = ref(false)
const val2 = ref(true)
</script>

<template>
    <div class="flex items-center gap-4">
        <Switch v-model="val1" shape="slider" variant="primary" />
        <Switch v-model="val2" shape="rocker" variant="accent" show-labels />
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
| `modelValue` | `boolean \| null` | — | 当前值，支持 `v-model`（受控模式） |
| `defaultValue` | `boolean` | — | 非受控模式下的初始选中状态 |
| `defaultChecked` | `boolean` | — | `defaultValue` 的别名（非受控模式初始选中状态） |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger'` | `'default'` | 颜色变体 |
| `shape` | `'slider' \| 'rocker'` | `'slider'` | 机械外观形态变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `showLabels` | `boolean` | `false` | 是否在导轨内呈现工控 I/O 通断铭牌刻印 |
| `ariaLabel` | `string` | locale 默认值（`switch.toggle`） | 无障碍标签文本 |
| `sound` | `boolean` | `false` | 显式开启切换时的继电器吸合音效 |
| `class` | `string` | `undefined` | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `(value: boolean)` | 值变化时触发 |

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 切换开关状态
- **ARIA 属性**：自动管理 `role="switch"`、`aria-checked`；默认通过 locale 提供 `aria-label`
- **焦点管理**：可通过 Tab 键聚焦，使用 `--brutal-ring` 令牌显示可见聚焦环
- **铭牌隔离**：`showLabels` 工控刻印打上 `aria-hidden="true"`，不干扰屏幕阅读器

