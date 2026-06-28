---
title: Scroll Area 滚动区域
description: 自定义滚动区域组件，提供符合新粗野主义外观的厚滚动条。
---

# Scroll Area 滚动区域

基于 reka-ui 的 ScrollArea 原语构建的新粗野主义风格滚动区域，带有自定义滚动条样式。

## 预览

<ComponentPreview>
  <ScrollAreaDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="scroll-area" />

## 用法

```vue
<script setup>
import { ScrollArea } from 'brutx-ui-vue'
</script>

<template>
    <ScrollArea class="h-72 w-48 border-3 border-brutal">
        <div class="p-4">
            <h4 class="mb-4 text-sm font-black leading-none">Tags</h4>
            <div class="space-y-1">
                <div v-for="tag in tags" :key="tag" class="text-sm font-medium">
                    {{ tag }}
                </div>
            </div>
        </div>
    </ScrollArea>
</template>
```

## 水平滚动

```vue
<script setup>
import { ScrollArea, ScrollBar } from 'brutx-ui-vue'
</script>

<template>
    <ScrollArea class="w-96 border-3 border-brutal">
        <div class="flex w-max space-x-4 p-4">
            <div v-for="artwork in artworks" :key="artwork" class="shrink-0">
                <div class="h-[250px] w-[200px] border-3 border-brutal bg-brutal-muted" />
            </div>
        </div>
        <ScrollBar orientation="horizontal" />
    </ScrollArea>
</template>
```

## 变体

控制滚动条边框与滑块颜色。设置在 `ScrollArea` 上会下发给默认垂直滚动条；手动添加的水平滚动条需在 `ScrollBar` 上单独设置。

| 变体 | 边框 | 滑块 |
|------|------|------|
| `default` | `border-brutal` | `bg-brutal-fg` |
| `primary` | `border-brutal-primary` | `bg-brutal-primary` |
| `accent` | `border-brutal-accent` | `bg-brutal-accent` |

```vue
<script setup>
import { ScrollArea } from 'brutx-ui-vue'

const tags = Array.from({ length: 20 }, (_, i) => `标签 ${i + 1}`)
</script>

<template>
    <ScrollArea variant="primary" class="h-72 w-48 border-3 border-brutal">
        <div class="p-4 space-y-1">
            <div v-for="tag in tags" :key="tag" class="text-sm font-medium">
                {{ tag }}
            </div>
        </div>
    </ScrollArea>
</template>
```

## 尺寸

控制滚动条粗细（通过 `--scroll-thickness` 令牌）。

| 尺寸 | 粗细 |
|------|------|
| `sm` | `0.5rem` |
| `default` | `0.75rem` |
| `lg` | `1rem` |

```vue
<script setup>
import { ScrollArea } from 'brutx-ui-vue'

const tags = Array.from({ length: 20 }, (_, i) => `标签 ${i + 1}`)
</script>

<template>
    <ScrollArea size="lg" class="h-72 w-48 border-3 border-brutal">
        <div class="p-4 space-y-1">
            <div v-for="tag in tags" :key="tag" class="text-sm font-medium">
                {{ tag }}
            </div>
        </div>
    </ScrollArea>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `ScrollArea` | 根可滚动容器 |
| `ScrollBar` | 自定义滚动条（默认垂直，支持水平） |

## Props

### ScrollArea

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'accent'` | `'default'` | 滚动条颜色变体，下发给内部 `ScrollBar` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 滚动条粗细，下发给内部 `ScrollBar` |
| `class` | `string` | — | 附加类名 |

### ScrollBar

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 方向 |
| `variant` | `'default' \| 'primary' \| 'accent'` | `'default'` | 滚动条颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 滚动条粗细 |
| `class` | `string` | — | 附加类名 |
