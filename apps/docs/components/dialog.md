---
title: Dialog 对话框
description: 模态对话框，支持焦点锁定、无障碍角色标记，硬边缘遮罩设计。
---

# Dialog 对话框

新粗野主义风格的模态对话框，基于 reka-ui 的 Dialog 原语构建。支持遮罩层、关闭按钮和可组合的子组件。

## 预览

<ComponentPreview>
  <DialogDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="dialog" />

## 用法

```vue
<script setup>
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Dialog>
        <DialogTrigger as-child>
            <Button variant="primary">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose as-child>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="primary">Save</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Dialog` | 根组件（从 reka-ui 的 `DialogRoot` 重新导出） |
| `DialogTrigger` | 打开对话框的按钮 |
| `DialogContent` | 带遮罩层的对话框内容面板 |
| `DialogHeader` | 头部容器 |
| `DialogFooter` | 底部容器，弹性布局 |
| `DialogTitle` | 对话框标题 |
| `DialogDescription` | 对话框描述文本 |
| `DialogClose` | 关闭按钮 |
| `DialogOverlay` | 背景遮罩层 |

## 尺寸变体

通过 `DialogContent` 的 `size` 属性控制对话框的最大宽度。默认值为 `default`（`max-w-lg`）。

| 尺寸 | 最大宽度 | 适用场景 |
|------|----------|----------|
| `sm` | `max-w-sm` | 确认框、简单提示 |
| `default` | `max-w-lg` | 标准表单、常规内容 |
| `lg` | `max-w-2xl` | 多列表单、详细设置 |
| `xl` | `max-w-4xl` | 复杂内容、数据展示 |
| `full` | `max-w-[calc(100vw-2rem)]` | 大幅内容、全屏式交互 |

```vue
<script setup>
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Dialog>
        <DialogTrigger as-child>
            <Button variant="primary">打开小型对话框</Button>
        </DialogTrigger>
        <DialogContent size="sm">
            <DialogHeader>
                <DialogTitle>确认删除</DialogTitle>
                <DialogDescription>此操作不可撤销，确定要继续吗？</DialogDescription>
            </DialogHeader>
        </DialogContent>
    </Dialog>
</template>
```

## Props

### DialogContent

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `showCloseButton` | `boolean` | `true` |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'full'` | `'default'` |
| `forceMount` | `boolean` | — |
| `class` | `string` | — |

### DialogHeader / DialogFooter / DialogTitle / DialogDescription

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

## DialogEnhanced 增强对话框

支持可拖拽和可调整大小的增强版对话框：

```vue
<script setup>
import { Dialog, DialogTrigger, DialogEnhanced, DialogHeader, DialogTitle } from 'brutx-ui-vue'
</script>

<template>
    <Dialog>
        <DialogTrigger>打开可拖拽对话框</DialogTrigger>
        <DialogEnhanced
            draggable
            resizable
            :min-width="300"
            :min-height="200"
            drag-handle=".dialog-header"
        >
            <DialogHeader class="dialog-header">
                <DialogTitle>可拖拽对话框</DialogTitle>
            </DialogHeader>
            <p>拖拽标题栏移动，拖拽边缘调整大小</p>
        </DialogEnhanced>
    </Dialog>
</template>
```

### DialogEnhanced Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `draggable` | `boolean` | `false` | 是否可拖拽 |
| `dragHandle` | `string \| HTMLElement` | — | 拖拽手柄（CSS 选择器或元素） |
| `bounds` | `'parent' \| 'viewport' \| { top, left, right, bottom }` | `'viewport'` | 拖拽边界 |
| `initialPosition` | `{ x: number; y: number }` | — | 初始位置 |
| `resizable` | `boolean` | `false` | 是否可调整大小 |
| `minWidth` | `number` | `200` | 最小宽度 |
| `minHeight` | `number` | `150` | 最小高度 |
| `maxWidth` | `number` | — | 最大宽度 |
| `maxHeight` | `number` | — | 最大高度 |
| `aspectRatio` | `number` | — | 宽高比锁定 |
| `showCloseButton` | `boolean` | `true` | 是否显示关闭按钮 |
| `forceMount` | `boolean` | — | 强制渲染 |
| `class` | `string` | — | 自定义样式类 |

## 无障碍

- 对话框打开时，焦点被限制在对话框内
- 按 `Escape` 关闭对话框
- 点击遮罩层关闭对话框
- 关闭按钮包含屏幕阅读器文本
- 拖拽时自动排除交互元素（Input、Button 等）
