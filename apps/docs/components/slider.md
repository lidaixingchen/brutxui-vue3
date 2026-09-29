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

## API 参考

<span id="事件"></span>

<ComponentApi name="slider" />

## 可访问性

- **键盘操作**：支持方向键调节值，`Home` / `End` 跳转最小/最大值
- **ARIA 属性**：自动管理 `aria-valuemin`、`aria-valuemax`、`aria-valuenow`、`aria-orientation` 等
- **焦点管理**：滑块可通过 Tab 键聚焦

## 方法（defineExpose）

通过 `ref` 访问组件实例后可调用 `setValue`，请求父组件更新滑块值：

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
