---
title: Select 选择器
description: 选择器组件，可替代浏览器原生下拉，提供更好的无障碍支持。
---

# Select 选择器

基于 reka-ui 的 Select 原语构建的新粗野主义风格下拉选择框，完整支持子组件。

## 预览

<ComponentPreview>
  <SelectDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="select" />

## 用法

```vue
<script setup>
import { Select, SelectTrigger, SelectContent, SelectItem, SelectLabel } from 'brutx-ui-vue'
import { SelectGroup, SelectValue } from 'reka-ui'
</script>

<template>
    <Select>
        <SelectTrigger class="w-[280px]">
            <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
            <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="grape">Grape</SelectItem>
            </SelectGroup>
        </SelectContent>
    </Select>
</template>
```

### 自定义插槽与属性透传

默认插槽用于完全自定义选择器内容，不提供作用域参数。组合原子组件时，Select 接收表单 name、required 和 disabled；触发器的 id 及禁用状态应在插槽内容中直接绑定。

```vue
<script setup>
import { ref } from 'vue'
import { Select, SelectTrigger, SelectContent, SelectItem } from 'brutx-ui-vue'
import { SelectValue } from 'reka-ui'
const isDisabled = ref(false)
</script>

<template>
    <Select name="fruit" required :disabled="isDisabled">
        <SelectTrigger id="fruit-select" :disabled="isDisabled" class="w-[280px]">
            <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
    </Select>
</template>
```

### 自定义触发器（trigger 插槽）

如果你只想替换触发器的样式，同时保留一体化的 `options` 数据驱动渲染，可以使用具名插槽 `trigger`。内容下拉区域（`<SelectContent>`）仍由 `options` prop 驱动，无需重新实现：

```vue
<template>
    <Select
        v-model="selectedValue"
        :options="foodOptions"
    >
        <template #trigger>
            <SelectTrigger class="w-[280px] border-dashed">
                <SelectValue placeholder="请选择食物" />
            </SelectTrigger>
        </template>
    </Select>
</template>
```

> **注意**：`trigger` 插槽与 `default` 插槽互斥。使用 `default` 插槽时，全部内容由用户接管（需自行提供 `<SelectContent>`）；使用 `trigger` 插槽时，只替换触发器，`<SelectContent>` 仍由组件自动渲染。

### 一体化用法

除了使用原子组件拼装，还可以使用封装好的一体化 `Select` 组件，支持传入 `options` 数组并支持自动分组。

```vue
<script setup>
import { ref } from 'vue'
import { Select } from 'brutx-ui-vue'

const selectedValue = ref('')

const foodOptions = [
    { label: '苹果', value: 'apple', category: 'fruits', categoryName: '水果' },
    { label: '香蕉', value: 'banana', category: 'fruits', categoryName: '水果' },
    { label: '胡萝卜', value: 'carrot', category: 'vegetables', categoryName: '蔬菜' },
    { label: '土豆', value: 'potato', category: 'vegetables', categoryName: '蔬菜' },
    { label: '牛奶', value: 'milk' } // 未分组
]
</script>

<template>
    <!-- 基本用法 -->
    <Select
        v-model="selectedValue"
        :options="foodOptions"
        placeholder="选择你喜欢的食物"
        class="w-[280px]"
    />

    <!-- 自动分组用法 -->
    <Select
        v-model="selectedValue"
        :options="foodOptions"
        group-field="category"
        group-label="categoryName"
        placeholder="选择食物（分组）"
        class="w-[280px]"
    />
</template>
```

### 使用 v-model

```vue
<script setup>
import { ref } from 'vue'
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from 'brutx-ui-vue'
import { SelectValue } from 'reka-ui'

const selectedFruit = ref('')
</script>

<template>
    <Select v-model="selectedFruit">
        <SelectTrigger class="w-[280px]">
            <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
        </SelectContent>
    </Select>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Select` | 支持 options 数据源和插槽组合的一体化选择器，内部使用 Reka UI 原语 |
| `SelectRoot` | Reka UI 根原语，为原子组合提供选择器上下文（从 reka-ui 导入） |
| `SelectValue` | Reka UI 原语，显示当前值或占位文本（从 reka-ui 导入） |
| `SelectGroup` | Reka UI 原语，将选项组合为一个分组（从 reka-ui 导入） |
| `SelectTrigger` | 打开下拉菜单的按钮 |
| `SelectContent` | 下拉内容面板 |
| `SelectItem` | 可选项 |
| `SelectLabel` | 分组标签 |
| `SelectSeparator` | 视觉分隔线 |
| `SelectScrollUpButton` | 向上滚动指示器 |
| `SelectScrollDownButton` | 向下滚动指示器 |

## API 参考

<span id="select-一体化组件"></span>
<span id="select-原子组件"></span>
<span id="selecttrigger"></span>
<span id="selectcontent"></span>
<span id="selectitem"></span>
<span id="selectvalue"></span>
<span id="selectlabel"></span>
<span id="selectseparator"></span>
<span id="selectscrollupbutton"></span>
<span id="selectscrolldownbutton"></span>
<span id="selecttrigger-事件"></span>

<ComponentApi name="select" />

### Reka UI 原语

一体化 Select 的公开属性、事件和插槽列在上方。使用原子组合时，SelectRoot、SelectValue 等无头原语由 reka-ui 提供，应从 reka-ui 直接导入；其余属性与插槽契约由 Reka UI 定义。

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 打开下拉，`Escape` 关闭，方向键导航选项
- **ARIA 属性**：自动管理 `aria-expanded`、`aria-haspopup`、`aria-activedescendant` 等
- **焦点管理**：打开时焦点锁定在下拉列表内，关闭时恢复焦点到触发器
