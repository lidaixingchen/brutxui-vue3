---
title: Separator 分隔线
description: 分隔线组件，用于在粗野主义布局中进行模块化视觉分割。
---

# Separator 分隔线

新粗野主义风格的视觉分隔线，支持水平和垂直方向。

## 预览

<ComponentPreview>
  <SeparatorDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="separator" />

## 用法

```vue
<script setup>
import { Separator } from 'brutx-ui-vue'
</script>

<template>
    <div>
        <p class="text-sm font-medium">Content above</p>
        <Separator />
        <p class="text-sm font-medium">Content below</p>
    </div>
</template>
```

## 方向

### 水平（默认）

```vue
<script setup>
import { Separator } from 'brutx-ui-vue'
</script>

<template>
    <Separator orientation="horizontal" />
</template>
```

### 垂直

```vue
<script setup>
import { Separator } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex h-8 items-center gap-4">
        <span class="text-sm font-bold">Item 1</span>
        <Separator orientation="vertical" />
        <span class="text-sm font-bold">Item 2</span>
    </div>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 前景色（`bg-brutal-fg`） |
| `primary` | 主色（`bg-brutal-primary`） |
| `muted` | 静音色（`bg-brutal-muted`） |

```vue
<script setup>
import { Separator } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-2">
        <Separator variant="default" />
        <Separator variant="primary" />
        <Separator variant="muted" />
    </div>
</template>
```

## 尺寸

| 尺寸 | 粗细 |
|------|------|
| `sm` | `2px` |
| `default` | `var(--brutal-border-width, 3px)` |
| `lg` | `5px` |

```vue
<script setup>
import { Separator } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-2">
        <Separator size="sm" />
        <Separator size="default" />
        <Separator size="lg" />
    </div>
</template>
```

## 文字分隔线

当 `orientation="horizontal"` 且默认插槽有内容时，Separator 会渲染为居中文字分隔线：两侧为分隔线，中间为插槽内容。

```vue
<script setup>
import { Separator } from 'brutx-ui-vue'
</script>

<template>
    <Separator>章节标题</Separator>
</template>
```

文字分隔线同样支持 `variant` 与 `size`：

```vue
<script setup>
import { Separator } from 'brutx-ui-vue'
</script>

<template>
    <Separator variant="primary" size="lg">主色标题</Separator>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'muted'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 控制粗细 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 方向 |
| `decorative` | `boolean` | `true` | 是否为装饰性（无语义角色） |
| `class` | `string` | — | 附加类名 |

## 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 文字分隔线内容；仅在 `orientation="horizontal"` 且插槽有内容时渲染为居中文字分隔线 |

## 样式

- **粗细**：由 `size` 通过 `--sep-thickness` 令牌控制（`sm`=`2px`、`default`=`var(--brutal-border-width, 3px)`、`lg`=`5px`）
- **水平**：`h-[var(--sep-thickness)] w-full`
- **垂直**：`h-full w-[var(--sep-thickness)]`
- **颜色**：由 `variant` 控制 — `default`=`bg-brutal-fg`、`primary`=`bg-brutal-primary`、`muted`=`bg-brutal-muted`
- **文字分隔线**：容器 `flex items-center gap-3 w-full`，两侧分隔线使用 `flex-1`
