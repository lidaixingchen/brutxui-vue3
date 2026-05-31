# Radio Group

基于 reka-ui 的 RadioGroup 原语构建的新粗野主义风格单选组，用于单项选择。

## 预览

<ComponentPreview>
  <div class="grid gap-2">
    <div class="flex items-center gap-3">
      <div class="h-6 w-6 border-3 border-brutal bg-brutal-bg flex items-center justify-center shadow-brutal-sm">
        <div class="h-3 w-3 bg-brutal-primary"></div>
      </div>
      <span class="text-sm font-bold">Option 1</span>
    </div>
    <div class="flex items-center gap-3">
      <div class="h-6 w-6 border-3 border-brutal bg-brutal-bg shadow-brutal-sm"></div>
      <span class="text-sm font-bold">Option 2</span>
    </div>
    <div class="flex items-center gap-3">
      <div class="h-6 w-6 border-3 border-brutal bg-brutal-bg shadow-brutal-sm"></div>
      <span class="text-sm font-bold">Option 3</span>
    </div>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="radio-group" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import RadioGroup from '@/components/ui/RadioGroup.vue'
import RadioGroupItem from '@/components/ui/RadioGroupItem.vue'
import Label from '@/components/ui/Label.vue'

const selected = ref('comfortable')
</script>

<template>
    <RadioGroup v-model="selected">
        <div class="flex items-center gap-3">
            <RadioGroupItem value="default" />
            <Label for="default">Default</Label>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="comfortable" />
            <Label for="comfortable">Comfortable</Label>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="compact" />
            <Label for="compact">Compact</Label>
        </div>
    </RadioGroup>
</template>
```

## 属性

### RadioGroup

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `string` | — |
| `defaultValue` | `string` | — |
| `class` | `string` | — |

### RadioGroupItem

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `value` | `string` | —（必填） |
| `disabled` | `boolean` | — |
| `class` | `string` | — |

## 事件

### RadioGroup

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `string` |

## 无障碍

- 方向键在单选项之间导航
- 空格键选中当前聚焦项
- 选中项使用 `aria-checked="true"`
