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
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from 'brutx-ui-vue'
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

当使用默认插槽来自定义装配原子组件时，为了保证表单验证（如必填项校验）和无障碍访问（A11y）正常工作，你需要把 `Select` 组件上绑定的 `id`、`name`、`required` 以及 `disabled` 等属性透传给内部的 `SelectTrigger` 组件。

你可以通过 `v-slot` 作用域插槽来接收并绑定这些属性：

```vue
<template>
    <Select
        id="my-select"
        name="fruit"
        required
        v-slot="{ id, name, required, disabled }"
    >
        <SelectTrigger
            :id="id"
            :name="name"
            :required="required"
            :disabled="disabled"
            class="w-[280px]"
        >
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
    SelectValue,
} from 'brutx-ui-vue'

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
| `Select` | 根组件（从 reka-ui 重新导出为 `SelectRoot`） |
| `SelectTrigger` | 打开下拉菜单的按钮 |
| `SelectContent` | 下拉内容面板 |
| `SelectItem` | 可选项 |
| `SelectValue` | 显示已选中的值 |
| `SelectGroup` | 选项分组 |
| `SelectLabel` | 分组标签 |
| `SelectSeparator` | 视觉分隔线 |
| `SelectScrollUpButton` | 向上滚动指示器 |
| `SelectScrollDownButton` | 向下滚动指示器 |

## Props

### Select (一体化组件)

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options` | `SelectOption[]` | `[]` | 选项数据源，每个选项包含 `label`, `value`, `disabled` 等属性 |
| `groupField` | `string` | — | 自动分组所依据的键名（如 `category`） |
| `groupLabel` | `string` | — | 分组显示名称在选项中对应的键名（如 `categoryName`），不提供时使用 `groupField` 的值 |
| `placeholder` | `string` | `'Select an option'` | 占位文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `required` | `boolean` | `false` | 是否必填 |
| `name` | `string` | — | 表单字段名称 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 触发器尺寸 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 边框样式变体 |
| `errorMessage` | `string` | — | 错误提示消息 |
| `clearable` | `boolean` | `false` | 是否显示清除按钮 |
| `position` | `'popper' \| 'item-aligned'` | `'popper'` | 下拉浮层定位方式 |
| `class` | `string` | — | 根组件（触发器）样式类 |
| `triggerClass` | `string` | — | 触发器自定义样式类 |
| `contentClass` | `string` | — | 下拉内容浮层样式类 |
| `itemVariant` | `'default' \| 'primary' \| 'secondary'` | `'default'` | 选项选中/激活变体 |

### Select (原子组件)

根组件，继承 reka-ui `SelectRoot` 的所有属性。常用属性如下：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | — | 选中的值，支持 `v-model` |
| `defaultValue` | `string` | — | 默认选中值 |
| `open` | `boolean` | — | 下拉框是否展开，支持 `v-model:open` |
| `defaultOpen` | `boolean` | `false` | 默认是否展开 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `required` | `boolean` | `false` | 是否必填 |
| `name` | `string` | — | 表单字段名称 |

### SelectTrigger

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 触发器尺寸 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 边框样式变体 |
| `errorMessage` | `string` | — | 错误消息文本，仅在 `variant="error"` 时显示 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `clearable` | `boolean` | `false` | 悬停时显示清除按钮 |
| `modelValue` | `string \| number \| null` | — | 当前选中值（用于清除功能） |
| `class` | `string` | — | 自定义样式类 |
| `iconClass` | `string` | — | 图标自定义样式类 |

### SelectContent

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `'popper' \| 'item-aligned'` | `'popper'` | 定位方式 |
| `class` | `string` | — | 自定义样式类 |

### SelectItem

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | —（必填） | 选项值 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `variant` | `'default' \| 'primary' \| 'secondary'` | `'default'` | 选项样式变体 |
| `class` | `string` | — | 自定义样式类 |
| `indicatorClass` | `string` | — | 选中指示器自定义样式类 |
| `iconClass` | `string` | — | 勾选图标自定义样式类 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 勾选图标尺寸 |

### SelectValue

显示已选中值的组件，继承 reka-ui `SelectValue` 的所有属性。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `placeholder` | `string` | — | 占位符文本 |

### SelectLabel

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |

### SelectSeparator

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |

### SelectScrollUpButton

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 向上箭头图标尺寸 |

### SelectScrollDownButton

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `class` | `string` | — | 自定义样式类 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 向下箭头图标尺寸 |

## SelectTrigger 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `clear` | — | 点击清除按钮时触发 |

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 打开下拉，`Escape` 关闭，方向键导航选项
- **ARIA 属性**：自动管理 `aria-expanded`、`aria-haspopup`、`aria-activedescendant` 等
- **焦点管理**：打开时焦点锁定在下拉列表内，关闭时恢复焦点到触发器
