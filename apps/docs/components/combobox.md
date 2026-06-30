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

## 用法

### 单选模式

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

### 多选模式

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

### 加载状态

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

### 创建选项

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

## 数据类型

```ts
interface ComboboxOption {
    value: string
    label: string
    disabled?: boolean
}
```

## Props

### Combobox（单选）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options` | `ComboboxOption[]` | —（必填） | 选项列表 |
| `modelValue` | `string \| undefined` | `undefined` | 选中值，支持 v-model |
| `open` | `boolean` | `undefined` | 下拉是否展开 |
| `placeholder` | `string` | locale: `combobox.placeholder` | 占位符文本 |
| `searchPlaceholder` | `string` | locale: `combobox.searchPlaceholder` | 搜索框占位符 |
| `emptyText` | `string` | locale: `combobox.emptyText` | 无匹配结果时的提示文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `creative` | `boolean` | `false` | 是否允许创建新选项 |
| `ariaLabel` | `string` | — | 无障碍标签 |
| `iconSize` | `IconSize` | `'default'` | 图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

### ComboboxMulti（多选）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options` | `ComboboxOption[]` | —（必填） | 选项列表 |
| `modelValue` | `string[]` | `[]` | 选中值数组，支持 v-model |
| `open` | `boolean` | `undefined` | 下拉是否展开 |
| `placeholder` | `string` | locale: `combobox.multiPlaceholder` | 占位符文本 |
| `searchPlaceholder` | `string` | locale: `combobox.searchPlaceholder` | 搜索框占位符 |
| `emptyText` | `string` | locale: `combobox.emptyText` | 无匹配结果时的提示文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `creative` | `boolean` | `false` | 是否允许创建新选项 |
| `ariaLabel` | `string` | — | 无障碍标签 |
| `maxDisplay` | `number` | `3` | 最多显示的选中标签数量 |
| `iconSize` | `IconSize` | `'default'` | 图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

## 事件

### Combobox

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string \| undefined` | 选中值变化时触发，再次选择相同选项会取消选中（值变为 `undefined`） |
| `update:open` | `boolean` | 下拉展开/关闭状态变化时触发 |
| `create` | `string` | 点击「创建」选项时触发，参数为当前搜索文本 |

### ComboboxMulti

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string[]` | 选中值变化时触发，切换选中/取消选中对应选项 |
| `update:open` | `boolean` | 下拉展开/关闭状态变化时触发 |
| `create` | `string` | 点击「创建」选项时触发，参数为当前搜索文本 |

## 可访问性

- **键盘操作**：支持 `↑` / `↓` 上下移动焦点，`Enter` 选中当前项，`Escape` 关闭下拉
- **ARIA 属性**：通过 `ariaLabel` 属性提供无障碍标签
