# Slider

基于 reka-ui 的 Slider 原语构建的新粗野主义风格滑块，支持 v-model。

## 预览

<ComponentPreview>
  <div class="relative flex w-full touch-none select-none items-center max-w-sm">
    <div class="relative h-5 w-full grow overflow-hidden border-3 border-brutal bg-brutal-bg shadow-brutal-sm">
      <div class="absolute h-full bg-brutal-secondary" style="width: 60%"></div>
    </div>
    <div class="block h-6 w-6 rounded-full border-3 border-brutal bg-brutal-accent shadow-brutal-sm ml-[-6px]"></div>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="slider" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import Slider from '@/components/ui/Slider.vue'

const value = ref([50])
</script>

<template>
    <Slider v-model="value" :max="100" :step="1" />
</template>
```

## 范围滑块

```vue
<script setup>
import { ref } from 'vue'
import Slider from '@/components/ui/Slider.vue'

const range = ref([25, 75])
</script>

<template>
    <Slider v-model="range" :max="100" :step="1" />
</template>
```

## 带最小/最大值

```vue
<script setup>
import { ref } from 'vue'
import Slider from '@/components/ui/Slider.vue'

const value = ref([500])
</script>

<template>
    <Slider v-model="value" :min="0" :max="1000" :step="50" />
</template>
```

## 禁用状态

```vue
<script setup>
import { ref } from 'vue'
import Slider from '@/components/ui/Slider.vue'

const value = ref([50])
</script>

<template>
    <Slider v-model="value" disabled />
</template>
```

## 属性

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `number[]` | — |
| `defaultValue` | `number[]` | — |
| `min` | `number` | `0` |
| `max` | `number` | `100` |
| `step` | `number` | `1` |
| `disabled` | `boolean` | — |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `number[]` |

## 样式

- **轨道**：`border-3 border-brutal` 搭配 `shadow-brutal-sm`
- **范围**：`bg-brutal-secondary` 填充
- **滑块**：`bg-brutal-accent` 搭配 `border-3 border-brutal` 和 `shadow-brutal-sm`
- **悬停**：滑块放大
- **激活**：滑块缩小并显示抓取光标
