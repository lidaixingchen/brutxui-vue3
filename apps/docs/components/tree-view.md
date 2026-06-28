---
title: TreeView 树形目录
description: 递归树形组件，支持节点展开折叠、单选、图标、自定义缩进，适合文件系统、分类层级等场景。
---

# TreeView 树形目录

可递归展开的层级数据可视化组件，内置文件夹 / 文件图标，支持键盘导航与受控单选状态。

## 预览

<ComponentPreview>
  <TreeViewDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="tree-view" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { TreeView } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const nodes: TreeNode[] = [
    {
        id: 'src',
        label: 'src',
        children: [
            { id: 'button', label: 'Button.vue' },
            { id: 'input', label: 'Input.vue' },
        ],
    },
    { id: 'pkg', label: 'package.json' },
]

const selected = ref(null)
</script>

<template>
    <TreeView
        v-model="selected"
        :nodes="nodes"
        :default-expanded="['src']"
    />
</template>
```

## TreeNode 类型

```ts
interface TreeNode {
    id: string       // 唯一标识
    label: string    // 显示文本
    icon?: string    // 节点图标
    children?: TreeNode[]  // 子节点（省略则为叶节点）
    data?: unknown   // 自定义附加数据
    disabled?: boolean  // 是否禁用（checkbox 模式下不可勾选）
}
```

## 选择模式

`selectionMode` 支持 `single`（默认，单选）与 `checkbox`（复选）两种模式。

- `single`：点击节点时通过 `v-model` 同步选中 id，仅单选。
- `checkbox`：每个节点前渲染 `Checkbox`，支持级联勾选——父节点勾选则所有子孙节点全部勾选；子孙节点部分勾选时父节点呈半选状态（`aria-checked="mixed"`）。勾选项通过 `v-model:checkedIds` 双向绑定。`disabled` 为 `true` 的节点不可勾选。

### 复选模式

```vue
<script setup>
import { ref } from 'vue'
import { TreeView } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const nodes: TreeNode[] = [
    {
        id: 'src',
        label: 'src',
        children: [
            { id: 'button', label: 'Button.vue' },
            { id: 'input', label: 'Input.vue', disabled: true },
        ],
    },
]

const checkedIds = ref<string[]>(['button'])
</script>

<template>
    <TreeView
        v-model:checked-ids="checkedIds"
        :nodes="nodes"
        selection-mode="checkbox"
        :default-expanded="['src']"
    />
</template>
```

## Props

### TreeView Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `nodes` | `TreeNode[]` | — | 树形数据源 |
| `modelValue` | `string \| null` | `null` | 当前选中节点的 id（v-model） |
| `selectionMode` | `'single' \| 'checkbox'` | `'single'` | 选择模式：单选或复选 |
| `checkedIds` | `string[]` | `[]` | 复选模式下勾选的节点 id 列表（v-model:checkedIds） |
| `defaultExpanded` | `string[]` | `[]` | 初始展开的节点 id 列表 |
| `class` | `string` | — | 根节点自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string \| null` | 选中节点 id 变更 |
| `update:checkedIds` | `string[]` | 勾选项变更（checkbox 模式） |
| `select` | `TreeNode` | 点击任意节点时触发 |
| `expand` | `(id: string, expanded: boolean)` | 展开 / 折叠节点时触发 |
| `check` | `(node: TreeNode, checked: boolean)` | 勾选 / 取消勾选节点时触发（checkbox 模式） |
