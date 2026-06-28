---
title: Command 命令面板
description: 命令面板组件，支持键盘快捷键、分组过滤和快捷指令执行。
---

# Command 命令面板

新粗野主义风格的命令面板组件，用于搜索和导航。基于 reka-ui 的 Listbox 原语构建，内置搜索过滤功能。

## 预览

<ComponentPreview>
  <CommandDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="command" />

## 用法

```vue
<script setup>
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from 'brutx-ui-vue'
</script>

<template>
    <Command>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
                <CommandItem value="calendar">Calendar</CommandItem>
                <CommandItem value="search">Search Emoji</CommandItem>
                <CommandItem value="calculator">Calculator</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
                <CommandItem value="profile">
                    Profile
                    <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem value="billing">
                    Billing
                    <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem value="settings">
                    Settings
                    <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
            </CommandGroup>
        </CommandList>
    </Command>
</template>
```

## 搜索过滤

`CommandInput` 输入的文本会自动过滤 `CommandItem`，匹配逻辑基于项目文本内容。当所有项目都被过滤掉时，`CommandEmpty` 会自动显示；当某个分组内所有项目都被过滤掉时，该分组会自动隐藏。

```vue
<Command>
    <CommandInput />
    <CommandList>
        <CommandEmpty />
        <CommandGroup heading="Suggestions">
            <CommandItem value="calendar">Calendar</CommandItem>
            <CommandItem value="search">Search Emoji</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Settings">
            <CommandItem value="profile">Profile</CommandItem>
        </CommandGroup>
    </CommandList>
</Command>
```

### 禁用内部过滤

当外部组件自行处理过滤逻辑时（如 Combobox、SearchWidget），可使用 `disable-filter` 禁用 Command 的内部搜索过滤，避免双重过滤冲突：

```vue
<Command disable-filter>
    <CommandInput v-model="searchQuery" />
    <CommandList>
        <CommandEmpty />
        <CommandGroup>
            <CommandItem
                v-for="item in filteredItems"
                :key="item.value"
                :value="item.value"
            >
                {{ item.label }}
            </CommandItem>
        </CommandGroup>
    </CommandList>
</Command>
```

## 命令对话框

使用 `CommandDialog` 实现模态命令面板：

```vue
<script setup>
import { ref } from 'vue'
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from 'brutx-ui-vue'

const open = ref(false)
</script>

<template>
    <button @click="open = true">Open Command Palette</button>
    <CommandDialog v-model:open="open">
        <CommandInput placeholder="Type a command..." />
        <CommandList>
            <CommandEmpty />
            <CommandGroup heading="Actions">
                <CommandItem value="new">New File</CommandItem>
                <CommandItem value="open">Open File</CommandItem>
            </CommandGroup>
        </CommandList>
    </CommandDialog>
</template>
```

## 键盘导航

组件内置键盘导航支持：

| 按键 | 行为 |
|------|------|
| `↑` / `↓` | 上下移动焦点 |
| `Enter` | 选中当前项 |
| `Esc` | 关闭对话框（CommandDialog 内） |

## 子组件

| 组件 | 说明 |
|------|------|
| `Command` | 根容器，管理过滤状态 |
| `CommandDialog` | 模态对话框包装器 |
| `CommandInput` | 搜索输入框，输入时自动过滤项目 |
| `CommandList` | 可滚动列表容器 |
| `CommandEmpty` | 无匹配结果时显示 |
| `CommandGroup` | 带标题的分组区域，过滤为空时自动隐藏 |
| `CommandItem` | 可选项，支持 `@select` 事件 |
| `CommandSeparator` | 分组之间的视觉分隔线 |
| `CommandShortcut` | 键盘快捷键提示 |

## Props

### Command

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | — |
| `disableFilter` | `boolean` | `false` | 禁用内部搜索过滤，适用于外部自行过滤的场景 |

### CommandInput

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `string` | — |
| `placeholder` | `string` | `t('command.placeholder')` |
| `class` | `string` | — |

### CommandItem

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `value` | `string` | — |
| `disabled` | `boolean` | — |
| `class` | `string` | — |

### CommandGroup

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `heading` | `string` | — |
| `class` | `string` | — |

### CommandList

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

### CommandEmpty

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

### CommandSeparator

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

### CommandShortcut

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

### CommandDialog

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `open` | `boolean` | `false` |
| `title` | `string` | `t('command.dialogTitle')` |
| `description` | `string` | `t('command.dialogDescription')` |
| `class` | `string` | — |

## 事件

### CommandInput

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `(value: string)` | 输入值变化时触发 |

### CommandItem

| 事件 | 参数 | 说明 |
|------|------|------|
| `select` | `(value: string)` | 选中项目时触发 |

### CommandDialog

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:open` | `(value: boolean)` | 对话框开关状态变化时触发 |
