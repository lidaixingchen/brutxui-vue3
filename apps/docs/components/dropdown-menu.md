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

### 基础用法

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

### 复选框项

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

### 单选项

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

### 子菜单

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

| 组件                       | 说明                                         |
| -------------------------- | -------------------------------------------- |
| `DropdownMenu`             | 根组件，reka-ui DropdownMenuRoot 的重新导出  |
| `DropdownMenuTrigger`      | 打开菜单的按钮，reka-ui 重新导出             |
| `DropdownMenuContent`      | 下拉内容面板                                 |
| `DropdownMenuItem`         | 标准菜单项                                   |
| `DropdownMenuCheckboxItem` | 复选框菜单项                                 |
| `DropdownMenuRadioItem`    | 单选菜单项                                   |
| `DropdownMenuRadioGroup`   | 单选项分组，reka-ui 重新导出                 |
| `DropdownMenuLabel`        | 区域标签                                     |
| `DropdownMenuSeparator`    | 视觉分隔线                                   |
| `DropdownMenuShortcut`     | 键盘快捷键提示                               |
| `DropdownMenuSub`          | 子菜单容器，reka-ui 重新导出                 |
| `DropdownMenuSubTrigger`   | 子菜单触发器                                 |
| `DropdownMenuSubContent`   | 子菜单内容                                   |
| `DropdownMenuGroup`        | 菜单项分组，reka-ui 重新导出                 |

## Props

### DropdownMenuContent

| 属性         | 类型     | 默认值 | 说明                       |
| ------------ | -------- | ------ | -------------------------- |
| `sideOffset` | `number` | `6`    | 菜单内容与触发器之间的间距 |
| `class`      | `string` | —      | 自定义样式类               |

### DropdownMenuItem

| 属性    | 类型      | 默认值 | 说明                                   |
| ------- | --------- | ------ | -------------------------------------- |
| `inset` | `boolean` | —      | 是否缩进显示（用于与子菜单触发器对齐） |
| `class` | `string`  | —      | 自定义样式类                           |

### DropdownMenuCheckboxItem

| 属性       | 类型                                                         | 默认值      | 说明         |
| ---------- | ------------------------------------------------------------ | ----------- | ------------ |
| `v-model`  | `boolean \| 'indeterminate'`                                 | —           | 复选框状态   |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'`       | `'default'` | 勾选图标尺寸 |
| `class`    | `string`                                                     | —           | 自定义样式类 |

### DropdownMenuRadioItem

| 属性    | 类型     | 默认值    | 说明         |
| ------- | -------- | --------- | ------------ |
| `value` | `string` | —（必填） | 单选项的值   |
| `class` | `string` | —         | 自定义样式类 |

### DropdownMenuLabel

| 属性    | 类型      | 默认值 | 说明         |
| ------- | --------- | ------ | ------------ |
| `inset` | `boolean` | —      | 是否缩进显示 |
| `class` | `string`  | —      | 自定义样式类 |

### DropdownMenuSeparator

| 属性    | 类型     | 默认值 | 说明         |
| ------- | -------- | ------ | ------------ |
| `class` | `string` | —      | 自定义样式类 |

### DropdownMenuShortcut

| 属性    | 类型     | 默认值 | 说明         |
| ------- | -------- | ------ | ------------ |
| `class` | `string` | —      | 自定义样式类 |

### DropdownMenuSubTrigger

| 属性       | 类型                                                         | 默认值      | 说明         |
| ---------- | ------------------------------------------------------------ | ----------- | ------------ |
| `inset`    | `boolean`                                                    | —           | 是否缩进显示 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'`       | `'default'` | 展开图标尺寸 |
| `class`    | `string`                                                     | —           | 自定义样式类 |

### DropdownMenuSubContent

| 属性    | 类型     | 默认值 | 说明         |
| ------- | -------- | ------ | ------------ |
| `class` | `string` | —      | 自定义样式类 |

## 事件

### DropdownMenuCheckboxItem

| 事件                | 参数                                  | 说明                 |
| ------------------- | ------------------------------------- | -------------------- |
| `update:modelValue` | `(value: boolean \| 'indeterminate')` | 复选框状态变化时触发 |

## 插槽

以下自定义包装组件均提供默认插槽（`default`），用于渲染子内容：

| 组件                       | 插槽      | 作用域 | 说明     |
| -------------------------- | --------- | ------ | -------- |
| `DropdownMenuContent`      | `default` | —      | 默认插槽 |
| `DropdownMenuItem`         | `default` | —      | 默认插槽 |
| `DropdownMenuCheckboxItem` | `default` | —      | 默认插槽 |
| `DropdownMenuRadioItem`    | `default` | —      | 默认插槽 |
| `DropdownMenuLabel`        | `default` | —      | 默认插槽 |
| `DropdownMenuShortcut`     | `default` | —      | 默认插槽 |
| `DropdownMenuSubTrigger`   | `default` | —      | 默认插槽 |
| `DropdownMenuSubContent`   | `default` | —      | 默认插槽 |

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 打开菜单，`Escape` 关闭菜单，方向键导航菜单项
- **ARIA 属性**：自动管理 `aria-expanded`、`aria-haspopup`、`role="menu"` 等无障碍属性
- **焦点管理**：打开时焦点锁定在菜单内，关闭时恢复焦点到触发器
- **子菜单导航**：支持通过方向键展开和导航子菜单
