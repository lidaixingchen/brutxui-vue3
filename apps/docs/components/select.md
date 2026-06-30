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

### Select

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
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 触发器尺寸 |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | 边框样式变体 |
| `errorMessage` | `string` | — | 错误消息文本，仅在 `variant="error"` 时显示 |
| `disabled` | `boolean` | `false` | 是否禁用 |
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
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 向下箭头图标尺寸 |

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 打开下拉，`Escape` 关闭，方向键导航选项
- **ARIA 属性**：自动管理 `aria-expanded`、`aria-haspopup`、`aria-activedescendant` 等
- **焦点管理**：打开时焦点锁定在下拉列表内，关闭时恢复焦点到触发器
