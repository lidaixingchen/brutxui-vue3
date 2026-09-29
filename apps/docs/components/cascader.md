---
title: Cascader 级联选择器
description: 新粗野主义风格的级联选择器，用于多层级关联数据的展示和选择，支持路径选择、单选、多选及键盘导航。
---

# Cascader 级联选择器

新粗野主义风格的级联选择器，支持嵌套选项级联选择、路径绑定（单选/多选）、父子节点关联状态自定义以及完整的键盘操作和无障碍支持。

## 预览

<ComponentPreview>
  <CascaderDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="cascader" />

## 用法

### 基础用法

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

## API 参考

<span id="cascader"></span>
<span id="事件"></span>

<ComponentApi name="cascader" />

## 数据类型

```ts
type CascaderValue = string | number

interface CascaderOption<T = unknown> {
    value: CascaderValue
    label: string
    children?: CascaderOption<T>[]
    disabled?: boolean
    data?: T
}
```

`CascaderOption` 支持泛型注入业务数据类型：`CascaderOption<MyData>[]` 中 `data` 字段将获得类型推断；默认 `unknown` 保持宽松语义。

## 导出类型

```ts
import type { CascaderOption, CascaderValue } from 'brutx-ui-vue'
```

## 可访问性

- **键盘操作**：
  - `ArrowDown` / `ArrowUp`：在当前选项列中上下移动聚焦，自动跳过 `disabled` 选项
  - `ArrowRight`：展开当前选项的子菜单列并聚焦首项
  - `ArrowLeft`：收起当前级子菜单，并退回到上一选项列
  - `Enter` / `Space`：确认选择或在多选下切换 Checkbox 勾选
  - `Escape`：关闭级联选择器下拉面板
- **ARIA 属性**：触发器使用 `role="combobox"` 配合 `aria-expanded` 与 `aria-disabled` 声明状态。下拉列表项设置 `role="menuitem"`
- **焦点管理**：展开时焦点自动流转至已选路径的最末一级选项；无选中值时不高亮任何项（`aria-activedescendant` 保持未定义），直到用户开始键盘导航，避免焦点仍在触发器时误报首个选项
- **动效降级**：下拉弹窗面板的过渡效果支持 `prefers-reduced-motion` 系统降级，在低动效设备上自动简化动效
