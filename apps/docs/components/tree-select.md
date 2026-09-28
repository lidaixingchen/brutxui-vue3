---
title: TreeSelect 树形选择器
description: 递归节点组件 TreeSelectNode 配合 Popover 的树形下拉选择器，支持单选、多选、搜索过滤和任意深度树结构。
---

# TreeSelect 树形选择器

新粗野主义风格的树形下拉选择组件，使用递归节点组件 `TreeSelectNode` 展示层级结构，配合 `Popover` 实现下拉交互。支持单选、多选、搜索过滤，适用于文件选择、分类选择、组织架构等场景。

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
import type { TreeNode } from 'brutx-ui-vue'

const nodes: TreeNode[] = [
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

### 多选模式

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

### 搜索过滤

启用 `searchable` 后，用户输入关键词可递归过滤树节点，匹配时保留祖先路径。

### 禁用节点

在 `TreeNode` 中设置 `disabled: true` 可禁用该节点的选择：

```ts
const nodes = [
    { id: '1', label: '可选节点' },
    { id: '2', label: '禁用节点', disabled: true },
]
```

### 受控展开

通过 `open` prop 和 `update:open` 事件可实现对下拉框展开状态的受控管理：

```vue
<script setup>
import { ref } from 'vue'
import { TreeSelect } from 'brutx-ui-vue'

const selected = ref(undefined)
const isOpen = ref(false)

function handleClose() {
    isOpen.value = false
}
</script>

<template>
    <TreeSelect
        v-model="selected"
        v-model:open="isOpen"
        :nodes="nodes"
    />
</template>
```

### 任意深度支持

组件使用递归渲染，支持任意深度的树结构，不限于两层。

## 变体

| 变体 | 说明 |
|------|------|
| `single` | 默认单选模式，`modelValue` 为 `string \| undefined` |
| `multiple` | 多选模式（设置 `multiple` prop），`modelValue` 为 `string[]` |

## 尺寸

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸触发器 |
| `default` | 默认尺寸触发器 |
| `lg` | 大尺寸触发器 |

## 数据类型

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

### TreeSelectLocale

组件使用 `useLocale` composable 支持国际化，可通过 `TreeSelectLocale` 自定义文本：

```ts
interface TreeSelectLocale {
    placeholder: string        // 触发器占位文本
    searchPlaceholder: string  // 搜索框占位文本
    search: string             // 搜索框 ARIA 标签
    emptyText: string          // 无结果提示文本
    selectedCount: string      // 多选超出 maxDisplay 时的计数文本，支持 {count} 插值
    clear: string              // 清除按钮 ARIA 标签
}
```

## API 参考

<span id="事件"></span>
<span id="方法-defineexpose"></span>

<ComponentApi name="tree-select" />

## 可访问性

- **键盘操作**：节点支持 `ArrowUp` / `ArrowDown` 导航；非叶节点支持 `ArrowRight` 展开 / `ArrowLeft` 折叠；`Home` / `End` 键跳转至首尾节点；清除按钮支持 `Enter` / `Space` 操作
- **ARIA 属性**：触发器使用 `role="combobox"` 和 `aria-expanded`；下拉列表使用 `role="tree"` 和 `role="treeitem"`；多选模式下添加 `aria-multiselectable`；禁用状态下使用 `aria-disabled`
- **焦点管理**：使用 roving tabindex 管理焦点；禁用节点设置 `tabindex="-1"`

## 通过 ref 使用组件状态

通过 `ref` 访问组件实例后可调用以下方法：

```vue
<script setup>
import { ref } from 'vue'
import { TreeSelect } from 'brutx-ui-vue'

const treeRef = ref(null)

function expandAll() {
    // 获取所有节点 ID 并展开
    const allIds = getAllNodeIds(nodes)
    treeRef.value.expandedIds = new Set(allIds)
}
</script>

<template>
    <TreeSelect ref="treeRef" v-model="selected" :nodes="nodes" />
    <button @click="expandAll">展开全部</button>
</template>
```

## 常见问题

**Q: 搜索过滤时为什么有些节点搜不到？**

A: 搜索过滤会递归匹配所有层级的节点。匹配到子节点时，其祖先路径会自动保留以确保可见性。如果搜索不到某个节点，请检查节点的 `label` 是否与搜索关键词匹配。搜索默认是大小写敏感的模糊匹配。

**Q: 单选和多选模式的 `modelValue` 类型不同，如何统一处理？**

A: 单选模式下 `modelValue` 为 `string | undefined`，多选模式下为 `string[]`。在 TypeScript 项目中，根据是否设置了 `multiple` 属性来确定类型。如果需要动态切换模式，建议使用条件类型或分别定义 ref 变量。

**Q: 下拉列表内容很多时如何控制显示高度？**

A: 使用 `maxHeight` 属性控制下拉列表的最大高度，默认为 `'15rem'`。当树节点超出最大高度时，列表会自动出现滚动条。可以传入任意有效的 CSS 高度值，如 `'200px'`、`'50vh'` 等。
