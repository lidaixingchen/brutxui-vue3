---
title: Slider 滑块
description: 滑动输入条组件，用于连续数值的区间调节或拖动输入。
---

# Slider 滑块

基于 reka-ui 的 Slider 原语构建的新粗野主义风格滑块，支持 v-model。

## 预览

<ComponentPreview>
  <SliderDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="slider" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const value = ref([50])
</script>

<template>
    <Slider v-model="value" :max="100" :step="1" />
</template>
```

### 范围滑块

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const range = ref([25, 75])
</script>

<template>
    <Slider v-model="range" :max="100" :step="1" />
</template>
```

### 带最小/最大值

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const value = ref([500])
</script>

<template>
    <Slider v-model="value" :min="0" :max="1000" :step="50" />
</template>
```

### 禁用状态

```vue
<template>
    <Slider v-model="value" disabled />
</template>
```

### 方向

通过 `orientation` 属性切换水平 (`horizontal`) 或垂直 (`vertical`) 布局，该属性透传给 reka-ui 原语。垂直模式需要为容器设定高度。

```vue
<template>
    <div class="h-48">
        <Slider v-model="value" orientation="vertical" />
    </div>
</template>
```

### 刻度标记

通过 `marks` 属性传入数值数组，会在轨道对应位置渲染刻度小标记。

```vue
<template>
    <Slider v-model="value" :marks="[0, 25, 50, 75, 100]" />
</template>
```

### 拖拽提示

开启 `showTooltip` 后，拖拽或悬停滑块时会在拇指附近显示当前值。

```vue
<template>
    <Slider v-model="value" show-tooltip />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `number[]` | — | 当前值，支持 `v-model` |
| `min` | `number` | `0` | 最小值 |
| `max` | `number` | `100` | 最大值 |
| `step` | `number` | `1` | 步长 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `ariaLabel` | `string` | — | 无障碍标签 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'success'` | `'default'` | 颜色变体 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 布局方向 |
| `marks` | `number[]` | — | 刻度标记数值数组 |
| `showTooltip` | `boolean` | `false` | 是否显示拖拽提示 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `number[]` | 值变化时触发 |

## 可访问性

- **键盘操作**：支持方向键调节值，`Home` / `End` 跳转最小/最大值
- **ARIA 属性**：自动管理 `aria-valuemin`、`aria-valuemax`、`aria-valuenow`、`aria-orientation` 等
- **焦点管理**：滑块可通过 Tab 键聚焦

## 方法（defineExpose）

通过 `ref` 访问组件实例后可调用以下方法：

| 属性/方法 | 类型 | 说明 |
| --- | --- | --- |
| `currentValue` | `ComputedRef<number[]>` | 当前滑块值（只读） |
| `setValue` | `(value: number[]) => void` | 设置滑块值 |

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const sliderRef = ref(null)
const value = ref([50])

function resetToCenter() {
    sliderRef.value?.setValue([50])
}
</script>

<template>
    <Slider ref="sliderRef" v-model="value" />
    <button @click="resetToCenter">Reset</button>
</template>
```
