# Combobox

新粗野主义风格的可搜索选择组件。提供单选（`Combobox`）和多选（`ComboboxMulti`）两种模式。

## 预览

<ComponentPreview>
  <div class="flex flex-col gap-4 max-w-sm">
    <div class="inline-flex items-center justify-between w-full border-3 border-brutal bg-transparent text-brutal-fg shadow-brutal font-semibold h-11 px-5 py-2 text-base">
      <span>Select option...</span>
      <span class="opacity-50">&#9650;&#9660;</span>
    </div>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="combobox" />

## 单选模式

```vue
<script setup>
import { ref } from 'vue'
import Combobox from '@/components/ui/Combobox.vue'

const selected = ref(undefined)

const options = [
    { value: 'vue', label: 'Vue' },
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
]
</script>

<template>
    <Combobox
        v-model="selected"
        :options="options"
        placeholder="Select a framework..."
        search-placeholder="Search frameworks..."
    />
</template>
```

## 多选模式

```vue
<script setup>
import { ref } from 'vue'
import ComboboxMulti from '@/components/ui/ComboboxMulti.vue'

const selected = ref([])

const options = [
    { value: 'vue', label: 'Vue' },
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
]
</script>

<template>
    <ComboboxMulti
        v-model="selected"
        :options="options"
        placeholder="Select frameworks..."
        :max-display="3"
    />
</template>
```

## ComboboxOption 类型

```ts
interface ComboboxOption {
    value: string
    label: string
    disabled?: boolean
}
```

## Props

### Combobox（单选）

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `options` | `ComboboxOption[]` | —（必填） |
| `modelValue` | `string \| undefined` | — |
| `placeholder` | `string` | `'Select option...'` |
| `searchPlaceholder` | `string` | `'Search...'` |
| `emptyText` | `string` | `'No results found.'` |
| `disabled` | `boolean` | `false` |
| `class` | `string` | — |

### ComboboxMulti（多选）

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `options` | `ComboboxOption[]` | —（必填） |
| `modelValue` | `string[]` | `[]` |
| `placeholder` | `string` | `'Select options...'` |
| `searchPlaceholder` | `string` | `'Search...'` |
| `emptyText` | `string` | `'No results found.'` |
| `disabled` | `boolean` | `false` |
| `maxDisplay` | `number` | `3` |
| `class` | `string` | — |

## 事件

### Combobox

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `string \| undefined` |

### ComboboxMulti

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `string[]` |
