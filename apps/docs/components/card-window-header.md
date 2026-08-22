---
title: CardWindowHeader 窗口标题栏
description: 复古操作系统窗口标题栏，三色状态指示灯 + 等宽大写标题 + ASCII 窗口控制符，为卡片赋予机械终端窗口质感。
---

# CardWindowHeader 窗口标题栏

模拟复古操作系统的窗口标题栏：左侧三色状态指示灯、居中等宽大写标题、右侧 ASCII 风格窗口控制符。通常置于卡片容器顶部，与 `border-b` 分隔内容区，赋予「机械终端窗口」的工控质感。

## 预览

<ComponentPreview>
  <CardWindowHeaderDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="card-window-header" />

## 用法

### 基础用法

```vue
<script setup>
import { CardWindowHeader } from 'brutx-ui-vue'
</script>

<template>
    <div class="border-3 border-brutal shadow-brutal">
        <CardWindowHeader title="System Monitor v2.0" />
        <div class="p-4">窗口内容区…</div>
    </div>
</template>
```

### 自定义操作区

`actions` 插槽替换右侧默认控制符，可放置任意操作按钮。

```vue
<template>
    <CardWindowHeader title="Config Editor">
        <template #actions>
            <Button size="sm">SAVE</Button>
        </template>
    </CardWindowHeader>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | *(必填)* | 窗口标题（等宽大写工控排版） |
| `showControls` | `boolean` | `true` | 是否渲染右侧 ASCII 窗口控制符（纯装饰） |
| `class` | `string` | `undefined` | 自定义 CSS 类名 |

## Slots

| 插槽 | 说明 |
|------|------|
| `actions` | 右侧自定义操作区，存在时替换默认 ASCII 控制符 |

## 可访问性

- **装饰元素**：状态指示灯与 ASCII 控制符均标记 `aria-hidden`，不产生读屏噪音；标题文本是唯一语义内容。
- **动效无关**：本体为静态布局，无动画依赖，天然尊重 `prefers-reduced-motion`。
