---
title: Combobox 组合框
description: 组合框（下拉搜索选择）组件，支持多选、单选，支持大数据量过滤。
---

# Combobox 组合框

新粗野主义风格的可搜索选择组件。提供单选（`Combobox`）和多选（`ComboboxMulti`）两种模式。

## 预览

<ComponentPreview>
  <ComboboxDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="combobox" />

## 单选模式

```vue
<script setup>
import { ref } from 'vue'
import { Combobox } from 'brutx-ui-vue'

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
import { ComboboxMulti } from 'brutx-ui-vue'

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
| `placeholder` | `string` | locale: `combobox.placeholder` |
| `searchPlaceholder` | `string` | locale: `combobox.searchPlaceholder` |
| `emptyText` | `string` | locale: `combobox.emptyText` |
| `disabled` | `boolean` | `false` |
| `loading` | `boolean` | `false` |
| `creative` | `boolean` | `false` |
| `ariaLabel` | `string` | — |
| `iconSize` | `IconSize` | `'default'` |
| `class` | `string` | — |

### ComboboxMulti（多选）

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `options` | `ComboboxOption[]` | —（必填） |
| `modelValue` | `string[]` | `[]` |
| `placeholder` | `string` | locale: `combobox.multiPlaceholder` |
| `searchPlaceholder` | `string` | locale: `combobox.searchPlaceholder` |
| `emptyText` | `string` | locale: `combobox.emptyText` |
| `disabled` | `boolean` | `false` |
| `loading` | `boolean` | `false` |
| `creative` | `boolean` | `false` |
| `ariaLabel` | `string` | — |
| `maxDisplay` | `number` | `3` |
| `iconSize` | `IconSize` | `'default'` |
| `class` | `string` | — |

## 事件

### Combobox

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `string \| undefined` |
| `create` | `[value: string]` |

### ComboboxMulti

| 事件 | 载荷 |
|------|------|
| `update:modelValue` | `string[]` |
| `create` | `[value: string]` |

## 加载状态

设置 `loading` 为 `true` 时，下拉列表底部显示 `Spinner`，适用于异步加载选项的场景。

```vue
<script setup>
import { ref } from 'vue'
import { Combobox } from 'brutx-ui-vue'

const loading = ref(false)
const options = ref([])

async function handleOpen() {
    loading.value = true
    options.value = await fetchOptions()
    loading.value = false
}
</script>

<template>
    <Combobox v-model="selected" :options="options" :loading="loading" />
</template>
```

## 创建选项

设置 `creative` 为 `true` 时，若搜索无匹配项且输入框非空，列表顶部显示「创建 '{query}'」选项（文本取自 locale `combobox.create`）。点击该项触发 `create` 事件，参数为当前搜索文本。

- `Combobox`：创建后关闭下拉。
- `ComboboxMulti`：创建后**不关闭**下拉，便于继续选择或创建多项。

```vue
<script setup>
import { ref } from 'vue'
import { Combobox, ComboboxMulti } from 'brutx-ui-vue'

const selected = ref(undefined)
const options = ref([
    { value: 'vue', label: 'Vue' },
    { value: 'react', label: 'React' },
])

function handleCreate(value) {
    options.value.push({ value: value.toLowerCase(), label: value })
    selected.value = value.toLowerCase()
}
</script>

<template>
    <Combobox
        v-model="selected"
        :options="options"
        creative
        @create="handleCreate"
    />
</template>
```
