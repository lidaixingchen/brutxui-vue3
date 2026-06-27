---
title: TreeSelect 树形选择器
description: 基于 TreeView 和 Popover 的树形下拉选择器，支持单选、多选、搜索过滤和任意深度树结构。
---

# TreeSelect 树形选择器

新粗野主义风格的树形下拉选择组件，结合了 `TreeView` 的层级展示能力和 `Popover` 的下拉交互模式。支持单选、多选、搜索过滤，适用于文件选择、分类选择、组织架构等场景。

## 预览

<ComponentPreview>
    <TreeSelectDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="tree-select" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { TreeSelect } from 'brutx-ui-vue'
import type { TreeSelectTreeNode } from 'brutx-ui-vue'

const nodes: TreeSelectTreeNode[] = [
    {
        id: 'docs',
        label: '文档',
        children: [
            { id: 'guide', label: '指南' },
            { id: 'api', label: 'API 参考' },
        ],
    },
    {
        id: 'src',
        label: '源码',
        children: [
            {
                id: 'components',
                label: '组件',
                children: [
                    { id: 'button', label: 'Button.vue' },
                    { id: 'input', label: 'Input.vue' },
                ],
            },
            { id: 'utils', label: '工具函数' },
        ],
    },
]

const selected = ref(undefined)
</script>

<template>
    <TreeSelect
        v-model="selected"
        :nodes="nodes"
        placeholder="选择文件..."
        searchable
        clearable
    />
</template>
```

## 多选模式

```vue
<script setup>
import { ref } from 'vue'
import { TreeSelect } from 'brutx-ui-vue'

const selected = ref([])
</script>

<template>
    <TreeSelect
        v-model="selected"
        :nodes="nodes"
        multiple
        searchable
        clearable
        placeholder="选择多个文件..."
    />
</template>
```

## TreeNode 类型

```ts
interface TreeNode {
    id: string              // 唯一标识
    label: string           // 显示文本
    children?: TreeNode[]   // 子节点（省略则为叶节点）
    icon?: string           // 节点图标
    disabled?: boolean      // 是否禁用
    data?: unknown          // 自定义附加数据
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `nodes` | `TreeNode[]` | —（必填） | 树形数据源 |
| `modelValue` | `string \| string[]` | — | 选中值（单选为 string，多选为 string[]） |
| `multiple` | `boolean` | `false` | 是否支持多选 |
| `searchable` | `boolean` | `true` | 是否显示搜索框 |
| `placeholder` | `string` | locale: `treeSelect.placeholder` | 占位文本 |
| `searchPlaceholder` | `string` | locale: `treeSelect.searchPlaceholder` | 搜索框占位文本 |
| `emptyText` | `string` | locale: `treeSelect.emptyText` | 无结果时的提示文本 |
| `clearable` | `boolean` | `false` | 是否显示清除按钮 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 触发器尺寸 |
| `ariaLabel` | `string` | — | ARIA 标签 |
| `maxDisplay` | `number` | `3` | 多选模式下最多显示的标签数 |
| `maxHeight` | `string` | `'15rem'` | 下拉列表最大高度 |
| `dropdownClass` | `string` | — | 下拉列表自定义类名 |
| `class` | `string` | — | 触发器自定义类名 |

## 事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `update:modelValue` | `string \| string[] \| undefined` | 选中值变更 |
| `select` | `TreeNode \| TreeNode[] \| undefined` | 选中节点变更 |
| `open-change` | `boolean` | 下拉框展开/关闭 |

## 特性

### 搜索过滤

启用 `searchable` 后，用户输入关键词可递归过滤树节点，匹配时保留祖先路径。

### 任意深度支持

组件使用递归渲染，支持任意深度的树结构，不限于两层。

### 禁用节点

在 `TreeNode` 中设置 `disabled: true` 可禁用该节点的选择：

```ts
const nodes = [
    { id: '1', label: '可选节点' },
    { id: '2', label: '禁用节点', disabled: true },
]
```

### 国际化

组件使用 `useLocale` composable 支持国际化，可通过 `TreeSelectLocale` 自定义文本：

```ts
interface TreeSelectLocale {
    placeholder: string
    searchPlaceholder: string
    emptyText: string
    selectedCount: string
    clear: string
}
```

## 无障碍

- 触发器使用 `role="combobox"` 和 `aria-expanded`
- 下拉列表使用 `role="tree"` 和 `role="treeitem"`
- 多选模式下添加 `aria-multiselectable`
- 清除按钮支持键盘操作（Enter/Space）
- 禁用状态下使用 `aria-disabled` 和 `tabindex="-1"`
