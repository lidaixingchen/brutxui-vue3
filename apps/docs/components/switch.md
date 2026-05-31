# Switch

基于 reka-ui 的 Switch 原语构建的新粗野主义风格切换开关，支持 v-model。

## 预览

<ComponentPreview>
  <div class="flex items-center gap-3">
    <div class="peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center border-3 border-brutal transition-colors duration-150 bg-brutal-success">
      <div class="pointer-events-none block h-5 w-5 bg-brutal-fg shadow-brutal-sm transition-transform duration-150 translate-x-5"></div>
    </div>
    <span class="text-sm font-bold">Enabled</span>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="switch" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import Switch from '@/components/ui/Switch.vue'
import Label from '@/components/ui/Label.vue'

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
import Switch from '@/components/ui/Switch.vue'
import Label from '@/components/ui/Label.vue'

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
import Switch from '@/components/ui/Switch.vue'
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
| `disabled` | `boolean` | — |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `boolean` |

## 样式

- **未选中**：`bg-brutal-bg` 背景，滑块在左侧
- **选中**：`bg-brutal-success` 背景，滑块向右平移
- **滑块**：`bg-brutal-fg` 搭配 `shadow-brutal-sm`
- **禁用**：降低不透明度，显示禁止光标
- **聚焦**：使用 `--brutal-ring` 令牌显示可见聚焦环
