---
title: Dropdown Menu 下拉菜单
description: 下拉菜单组件，支持嵌套子菜单、复选菜单项、单选菜单项。
---

# Dropdown Menu 下拉菜单

新粗野主义风格的下拉菜单，基于 reka-ui 的 DropdownMenu 原语构建，支持菜单项、复选框、单选组、子菜单和快捷键。

## 预览

<ComponentPreview>
  <DropdownMenuDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="dropdown-menu" />

## 用法

```vue
<script setup>
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuShortcut,
} from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline">Open Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
```

## 复选框项

使用 `v-model` 绑定复选框状态，支持 `boolean` 和 `'indeterminate'` 两种值。

```vue
<script setup>
import { ref } from 'vue'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
} from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'

const showStatusBar = ref(true)
const showActivityBar = ref(false)
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline">View</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuCheckboxItem v-model="showStatusBar">
                Status Bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem v-model="showActivityBar">
                Activity Bar
            </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
```

## 单选项

```vue
<script setup>
import { ref } from 'vue'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioItem,
    DropdownMenuRadioGroup,
} from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'

const position = ref('bottom')
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline">Position</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuRadioGroup v-model="position">
                <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="left">Left</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
```

## 子菜单

```vue
<script setup>
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline">Open Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem>New Tab</DropdownMenuItem>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>More Tools</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuItem>Save Page</DropdownMenuItem>
                    <DropdownMenuItem>Developer Tools</DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuSub>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `DropdownMenu` | 根组件（reka-ui `DropdownMenuRoot` 的重新导出） |
| `DropdownMenuTrigger` | 打开菜单的按钮（reka-ui 重新导出） |
| `DropdownMenuContent` | 下拉内容面板 |
| `DropdownMenuItem` | 标准菜单项 |
| `DropdownMenuCheckboxItem` | 复选框菜单项 |
| `DropdownMenuRadioItem` | 单选菜单项 |
| `DropdownMenuRadioGroup` | 单选项分组（reka-ui 重新导出） |
| `DropdownMenuLabel` | 区域标签 |
| `DropdownMenuSeparator` | 视觉分隔线 |
| `DropdownMenuShortcut` | 键盘快捷键提示 |
| `DropdownMenuSub` | 子菜单容器（reka-ui 重新导出） |
| `DropdownMenuSubTrigger` | 子菜单触发器 |
| `DropdownMenuSubContent` | 子菜单内容 |
| `DropdownMenuGroup` | 菜单项分组（reka-ui 重新导出） |

## Props

### DropdownMenuContent

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `sideOffset` | `number` | `6` |
| `class` | `string` | — |

### DropdownMenuItem

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `inset` | `boolean` | — |
| `class` | `string` | — |

### DropdownMenuCheckboxItem

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `v-model` | `boolean \| 'indeterminate'` | — |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` |
| `class` | `string` | — |

### DropdownMenuRadioItem

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `value` | `string` | —（必填） |
| `class` | `string` | — |

### DropdownMenuLabel

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `inset` | `boolean` | — |
| `class` | `string` | — |

### DropdownMenuSeparator

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

### DropdownMenuShortcut

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

### DropdownMenuSubTrigger

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `inset` | `boolean` | — |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` |
| `class` | `string` | — |

### DropdownMenuSubContent

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

## Events

### DropdownMenuCheckboxItem

| 事件名               | 参数                                      | 说明                 |
| -------------------- | ----------------------------------------- | -------------------- |
| `update:modelValue`  | `(value: boolean \| 'indeterminate')`     | 复选框状态变化时触发 |

## Slots

以下自定义包装组件均提供默认插槽（`default`），用于渲染子内容：

- `DropdownMenuContent`
- `DropdownMenuItem`
- `DropdownMenuCheckboxItem`
- `DropdownMenuRadioItem`
- `DropdownMenuLabel`
- `DropdownMenuShortcut`
- `DropdownMenuSubTrigger`
- `DropdownMenuSubContent`
