# Toggle Group

基于 reka-ui 的 ToggleGroup 原语构建的新粗野主义风格切换按钮组，支持单选或多选。

## 预览

<ComponentPreview>
  <div class="inline-flex items-center gap-1 border-3 border-brutal bg-brutal-muted p-1">
    <button class="inline-flex items-center justify-center gap-2 text-sm font-black tracking-wide border-3 border-brutal rounded-brutal transition-all duration-150 h-8 px-2 min-w-8 text-xs bg-brutal-primary text-brutal-fg shadow-none translate-y-[2px]">B</button>
    <button class="inline-flex items-center justify-center gap-2 text-sm font-black tracking-wide border-3 border-brutal rounded-brutal transition-all duration-150 h-8 px-2 min-w-8 text-xs bg-brutal-bg text-brutal-fg shadow-brutal-sm hover:bg-brutal-muted">I</button>
    <button class="inline-flex items-center justify-center gap-2 text-sm font-black tracking-wide border-3 border-brutal rounded-brutal transition-all duration-150 h-8 px-2 min-w-8 text-xs bg-brutal-bg text-brutal-fg shadow-brutal-sm hover:bg-brutal-muted">U</button>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="toggle-group" />

## 用法

### 单选

```vue
<script setup>
import { ref } from 'vue'
import ToggleGroup from '@/components/ui/ToggleGroup.vue'
import ToggleGroupItem from '@/components/ui/ToggleGroupItem.vue'
import { Bold, Italic, Underline } from 'lucide-vue-next'

const selected = ref('bold')
</script>

<template>
    <ToggleGroup type="single" v-model="selected" variant="default">
        <ToggleGroupItem value="bold">
            <Bold class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic">
            <Italic class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline">
            <Underline class="h-4 w-4" />
        </ToggleGroupItem>
    </ToggleGroup>
</template>
```

### 多选

```vue
<script setup>
import { ref } from 'vue'
import ToggleGroup from '@/components/ui/ToggleGroup.vue'
import ToggleGroupItem from '@/components/ui/ToggleGroupItem.vue'
import { Bold, Italic, Underline } from 'lucide-vue-next'

const selected = ref(['bold'])
</script>

<template>
    <ToggleGroup type="multiple" v-model="selected" variant="default">
        <ToggleGroupItem value="bold">
            <Bold class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic">
            <Italic class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline">
            <Underline class="h-4 w-4" />
        </ToggleGroupItem>
    </ToggleGroup>
</template>
```

## 属性

### ToggleGroup

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `type` | `'single' \| 'multiple'` | —（必填） |
| `modelValue` | `string \| string[]` | — |
| `variant` | `'default' \| 'outline'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `disabled` | `boolean` | — |
| `class` | `string` | — |

### ToggleGroupItem

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `value` | `string` | —（必填） |
| `disabled` | `boolean` | — |
| `class` | `string` | — |

## 事件

### ToggleGroup

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `string \| string[]` |
