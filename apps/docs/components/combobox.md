---
title: Combobox 组合框
description: 组合框（下拉搜索选择）组件，支持多选、单选，支持大数据量过滤。
---

# Combobox 组合框

新粗野主义风格的可搜索选择组件。通过 `multiple` 属性切换单选和多选模式。

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
import { Combobox } from 'brutx-ui-vue'

const selected = ref([])

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
        multiple
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

- `Combobox`（单选）：创建后关闭下拉。
- `Combobox`（`multiple`）：创建后**不关闭**下拉，便于继续选择或创建多项。

```vue
<script setup>
import { ref } from 'vue'
import { Combobox } from 'brutx-ui-vue'

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

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options` | `ComboboxOption[]` | —（必填） | 选项列表 |
| `multiple` | `boolean` | `false` | 是否启用多选模式 |
| `modelValue` | `string \| string[] \| undefined` | 单选：`undefined`；多选：`[]` | 选中值，支持 v-model。多选模式下为 `string[]` |
| `open` | `boolean` | `undefined` | 下拉是否展开 |
| `placeholder` | `string` | locale: `combobox.placeholder` / `combobox.multiPlaceholder` | 占位符文本，根据模式自动切换 |
| `searchPlaceholder` | `string` | locale: `combobox.searchPlaceholder` | 搜索框占位符 |
| `emptyText` | `string` | locale: `combobox.emptyText` | 无匹配结果时的提示文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `creative` | `boolean` | `false` | 是否允许创建新选项 |
| `maxDisplay` | `number` | `3` | 多选模式下最多显示的选中标签数量 |
| `ariaLabel` | `string` | — | 无障碍标签 |
| `iconSize` | `IconSize` | `'default'` | 图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string \| string[] \| undefined` | 选中值变化时触发。单选模式下再次选择相同选项会取消选中（值变为 `undefined`）；多选模式下切换选中/取消选中对应选项 |
| `update:open` | `boolean` | 下拉展开/关闭状态变化时触发 |
| `create` | `string` | 点击「创建」选项时触发，参数为当前搜索文本 |

## 交互

选项遵循 Neo-Brutalist 视觉语言：

- **高亮上浮**：鼠标悬停或键盘 `↑` / `↓` 导航聚焦选项时，选项向左上方偏移（`-translate-x-0.5 -translate-y-0.5`）并显示大阴影（`shadow-brutal-lg`），形成「浮起」效果。两种触发方式共享同一视觉反馈，确保键盘用户与鼠标用户获得一致体验。
- **按下下沉**：点击选项时向下位移（`--brutal-pressed-offset`）并去除阴影，形成「按压」反馈。

> 上浮样式由共享变体 `brutalHighlightLift` 提供，与 `Select` 选项的 `brutalHoverLift` 保持视觉一致；区别在于触发机制——Combobox 绑定 `data-[highlighted=true]`（兼容键盘高亮），Select 绑定 `hover:`。

## 可访问性

- **键盘操作**：支持 `↑` / `↓` 上下移动焦点，`Enter` 选中当前项，`Escape` 关闭下拉
- **ARIA 属性**：通过 `ariaLabel` 属性提供无障碍标签

## 方法（defineExpose）

通过 `ref` 访问组件实例后可调用以下方法：

| 属性/方法 | 类型 | 说明 |
| --- | --- | --- |
| `open` | `Ref<boolean>` | 下拉面板是否展开 |
| `searchQuery` | `Ref<string>` | 当前搜索关键词 |
| `selectedValue` | `ComputedRef<string \| string[] \| undefined>` | 当前选中值（只读） |
| `focus` | `() => void` | 聚焦触发器 |

```vue
<script setup>
import { ref } from 'vue'
import { Combobox } from 'brutx-ui-vue'

const comboboxRef = ref(null)

function openDropdown() {
    comboboxRef.value?.open = true
}
</script>

<template>
    <Combobox ref="comboboxRef" v-model="selected" :options="options" />
    <button @click="openDropdown">Open</button>
</template>
```

## 常见问题

**Q: 单选模式下再次点击已选中的选项为什么没有反应？**

A: 在 `Combobox` 单选模式下，再次点击已选中的选项会取消选中（值变为 `undefined`）。这是设计行为，用于支持清除选择。如果不需要此行为，可以在父组件中监听 `update:modelValue` 事件，当值变为 `undefined` 时恢复为之前的值。

**Q: 如何实现异步加载选项？**

A: 将 `loading` 设为 `true` 显示加载状态，在数据加载完成后更新 `options` 并将 `loading` 设为 `false`。可以结合下拉展开事件来触发数据加载，避免一次性加载所有数据。

**Q: `creative` 模式下创建的新选项如何持久化？**

A: 组件本身不持久化创建的选项。需要在 `create` 事件的处理函数中手动将新选项添加到 `options` 数组中，并同步更新 `modelValue`。如需持久化存储，可在事件处理中调用后端接口或写入本地存储。
