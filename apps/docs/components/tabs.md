---
title: Tabs 标签页
description: 选项卡组件，提供按压切换动画和极高辨识度的激活状态边框。
---

# Tabs 标签页

基于 reka-ui 的 Tabs 原语构建的新粗野主义风格标签页导航组件。

## 预览

<ComponentPreview>
  <TabsDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="tabs" />

## 用法

```vue
<script setup>
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'brutx-ui-vue'
</script>

<template>
    <Tabs default-value="account">
        <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
            <p class="text-sm">Manage your account settings.</p>
        </TabsContent>
        <TabsContent value="password">
            <p class="text-sm">Change your password here.</p>
        </TabsContent>
    </Tabs>
</template>
```

## 垂直布局

通过 `Tabs` 的 `orientation` 属性设置垂直布局（`vertical`）。垂直布局下，`TabsList` 会自动切换为纵向排列（`flex-col`），适用于侧边栏导航等场景。

`orientation` 属性会通过依赖注入传递给子组件，因此 `TabsList` 无需单独设置即可自动适配方向。如需在单个 `TabsList` 上覆盖方向，可直接设置其 `orientation` 属性。

```vue
<script setup>
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'brutx-ui-vue'
</script>

<template>
    <Tabs default-value="general" orientation="vertical" class="flex gap-4">
        <TabsList>
            <TabsTrigger value="general">通用</TabsTrigger>
            <TabsTrigger value="security">安全</TabsTrigger>
            <TabsTrigger value="notifications">通知</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
            <p class="text-sm">通用设置选项。</p>
        </TabsContent>
        <TabsContent value="security">
            <p class="text-sm">安全设置选项。</p>
        </TabsContent>
        <TabsContent value="notifications">
            <p class="text-sm">通知设置选项。</p>
        </TabsContent>
    </Tabs>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Tabs` | 根组件（从 reka-ui 重新导出为 `TabsRoot`） |
| `TabsList` | 标签触发器容器 |
| `TabsTrigger` | 可点击的标签按钮 |
| `TabsContent` | 每个标签的内容面板 |

## Props

### Tabs

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `string` | — |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `class` | `string` | — |

### TabsTrigger

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `value` | `string` | —（必填） |
| `disabled` | `boolean` | — |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success'` | `'default'` |
| `class` | `string` | — |

### TabsContent

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `value` | `string` | —（必填） |
| `class` | `string` | — |

### TabsList

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `orientation` | `'horizontal' \| 'vertical'` | 继承自 `Tabs`，默认 `'horizontal'` |
| `class` | `string` | — |

## 无障碍

- 方向键在标签触发器之间导航
- 标签内容通过 ARIA 属性与其触发器关联
- 激活标签具有 `aria-selected="true"`
