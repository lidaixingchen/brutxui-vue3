---
title: Cascader 级联选择器
description: 新粗野主义风格的级联选择器，用于多层级关联数据的展示和选择，支持路径选择、单选、多选及键盘导航。
---

# Cascader 级联选择器

新粗野主义风格的级联选择器，支持嵌套选项级联选择、路径绑定（单选/多选）、父子节点关联状态自定义以及完整的键盘操作和无障碍支持。

## 预览

因为 VitePress 运行环境原因，此组件的预览可以在对应的 Demo 包中查阅。

## 安装

<InstallationTabs componentName="cascader" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Cascader } from 'brutx-ui-vue'

const options = [
    {
        value: 'zh',
        label: '中国',
        children: [
            {
                value: 'bj',
                label: '北京',
                children: [
                    { value: 'hd', label: '海淀' },
                    { value: 'cy', label: '朝阳' },
                ]
            },
            {
                value: 'sh',
                label: '上海',
            }
        ]
    },
    {
        value: 'us',
        label: '美国',
        children: [
            { value: 'ny', label: '纽约' },
            { value: 'ca', label: '加州' },
        ]
    }
]

const selected = ref([])
</script>

<template>
    <Cascader
        v-model="selected"
        :options="options"
        placeholder="选择地区"
        clearable
    />
</template>
```

### 多选模式

设置 `multiple` 可以启用多选，此时 `v-model` 绑定值为二维数组，包含所选的所有完整路径。在非 `checkStrictly` 状态下，勾选父节点会自动选中其所有子叶子节点。

```vue
<script setup>
import { ref } from 'vue'
import { Cascader } from 'brutx-ui-vue'

const selected = ref([]) // 二维数组，如 [['zh', 'bj', 'hd'], ['us', 'ny']]
</script>

<template>
    <Cascader
        v-model="selected"
        :options="options"
        multiple
        placeholder="选择多个地区"
    />
</template>
```

### 选择任意一级

默认情况下，只有叶子节点才能被最终选中。设置 `checkStrictly` 为 `true` 允许选中任意一级的节点（即父节点也可用作可绑定的值路径）。

```vue
<template>
    <Cascader
        v-model="selected"
        :options="options"
        check-strictly
        placeholder="选择任意级别"
    />
</template>
```

## API

### 属性 (Props)

| 属性名 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `options` | `CascaderOption[]` | `[]` | 级联数据列表 |
| `modelValue` | `CascaderValue[] \| CascaderValue[][]` | `[]` | 选中值，单选时为一维路径值数组，多选时为二维路径值数组 |
| `open` | `boolean` | `undefined` | 受控的展开状态 |
| `multiple` | `boolean` | `false` | 是否开启多选 |
| `clearable` | `boolean` | `false` | 是否可清空选择 |
| `checkStrictly` | `boolean` | `false` | 是否允许选择任意级别的节点（父子不关联） |
| `separator` | `string` | `' / '` | 选中项的路径分隔符 |
| `maxDisplay` | `number` | `2` | 多选模式下最多显示的标签数 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 触发器按钮的尺寸 |
| `placeholder` | `string` | `undefined` | 占位文本 |
| `disabled` | `boolean` | `false` | 是否禁用组件 |
| `dropdownClass` | `string` | `undefined` | 下拉菜单的自定义类名 |
| `class` | `string` | `undefined` | 触发器按钮的自定义类名 |
| `ariaLabel` | `string` | `undefined` | ARIA 无障碍标签 |

### 事件 (Events)

| 事件名 | 参数 | 说明 |
|---|---|---|
| `update:modelValue` | `CascaderValue[] \| CascaderValue[][]` | 绑定值更新 |
| `update:open` | `boolean` | 展开/关闭状态更新，配合 `open` 属性实现 `v-model:open` |
| `change` | `CascaderValue[] \| CascaderValue[][]` | 选中值变更事件 |
| `open-change` | `boolean` | 面板展开/收起事件 |

### 类型定义

```typescript
export type CascaderValue = string | number

export interface CascaderOption {
    value: CascaderValue
    label: string
    children?: CascaderOption[]
    disabled?: boolean
    data?: unknown
}
```

## 可访问性 (Accessibility)

- **键盘导航**：
  - `ArrowDown` / `ArrowUp`：在当前级联列中上下导航移动焦点。
  - `ArrowRight`：展开当前激活选项的子菜单。
  - `ArrowLeft`：收起子菜单，回到父选项级联列。
  - `Enter` / `Space`：触发选中，或者在有子菜单且不是 `checkStrictly` 时进行展开。
  - `Escape`：关闭下拉面板。
- **无障碍属性**：
  - 触发器使用 `role="combobox"` 配合 `aria-expanded` 与 `aria-disabled` 声明组件状态。
  - 列表项使用 `role="menuitem"`。
