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

设置 `creative` 为 `true` 时，若搜索无匹配项且输入框非空，列表顶部显示「创建 '{query}'」选项（文本取自 locale `combobox.create`）。点击该项触发 `create` 事件，参数为去除首尾空格后的搜索文本（显示与事件参数均使用 trim 后的查询，避免创建出带脏空格的 value/label）。

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

## API 参考

<span id="事件"></span>
<span id="方法-defineexpose"></span>

<ComponentApi name="combobox" />

## 交互

选项遵循 Neo-Brutalist 视觉语言：

- **高亮上浮**：鼠标悬停或键盘 `↑` / `↓` 导航聚焦选项时，选项向左上方偏移（`-translate-x-0.5 -translate-y-0.5`）并显示大阴影（`shadow-brutal-lg`），形成「浮起」效果。两种触发方式共享同一视觉反馈，确保键盘用户与鼠标用户获得一致体验。
- **按下盖影**：点击选项时向右下位移（`--brutal-shadow-offset-*`）并去除阴影，落回阴影位置形成「按压」反馈。

> 上浮样式由共享变体 `brutalHighlightLift` 提供，与 `Select` 选项的 `brutalHoverLift` 保持视觉一致；区别在于触发机制——Combobox 绑定 `data-[highlighted=true]`（兼容键盘高亮），Select 绑定 `hover:`。

## 可访问性

- **键盘操作**：支持 `↑` / `↓` 上下移动焦点，`Enter` 选中当前项，`Escape` 关闭下拉
- **ARIA 属性**：通过 `ariaLabel` 属性提供无障碍标签

## 程序化控制

通过 ref 获取组件实例后，可读取 API 参考中列出的状态，并调用焦点方法。

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
