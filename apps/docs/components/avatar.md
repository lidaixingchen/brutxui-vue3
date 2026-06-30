---
title: Avatar 头像
description: 头像组件，支持图片、回退文字以及多种形状和尺寸的粗野主义边框。
---

# Avatar 头像

新粗野主义风格的头像组件，用于显示用户头像图片，支持回退显示。

## 预览

<ComponentPreview>
  <AvatarDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="avatar" />

## 用法

```vue
<script setup>
import { Avatar, AvatarImage, AvatarFallback } from 'brutx-ui-vue'
</script>

<template>
    <Avatar size="default" shape="square">
        <AvatarImage src="/avatar.jpg" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
    </Avatar>
</template>
```

## 尺寸

| 尺寸 | 大小 |
|------|------|
| `sm` | `h-8 w-8`（32px） |
| `default` | `h-10 w-10`（40px） |
| `lg` | `h-14 w-14`（56px） |
| `xl` | `h-20 w-20`（80px） |

## 形状

| 形状 | 说明 |
|------|------|
| `square` | 无圆角（默认） |
| `rounded` | 使用 `--brutal-radius` 令牌 |

```vue
<script setup>
import { Avatar, AvatarFallback } from 'brutx-ui-vue'
</script>

<template>
    <Avatar size="lg" shape="rounded">
        <AvatarFallback>JD</AvatarFallback>
    </Avatar>
</template>
```

## 变体

控制头像根容器与 `AvatarFallback` 的背景色，通过 provide/inject 下发给子组件。

| 变体 | 根容器背景 | 回退背景 |
|------|------------|----------|
| `default` | `bg-brutal-muted` | `bg-brutal-muted` |
| `primary` | `bg-brutal-primary/20` | `bg-brutal-primary` |
| `secondary` | `bg-brutal-secondary/20` | `bg-brutal-secondary` |
| `accent` | `bg-brutal-accent/20` | `bg-brutal-accent` |

```vue
<script setup>
import { Avatar, AvatarFallback } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex items-center gap-4">
        <Avatar size="lg" variant="default">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar size="lg" variant="primary">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar size="lg" variant="secondary">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar size="lg" variant="accent">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
    </div>
</template>
```

## 回退行为

当图片加载失败时，`AvatarFallback` 会自动显示：

```vue
<script setup>
import { Avatar, AvatarImage, AvatarFallback } from 'brutx-ui-vue'
</script>

<template>
    <Avatar>
        <AvatarImage src="/broken-url.jpg" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
    </Avatar>
</template>
```

## 状态

在头像右下角渲染状态小圆点（`w-3 h-3 rounded-full border-3 border-brutal-bg`）。`status="none"`（默认）时不渲染。

| 状态 | 颜色 | 说明 |
|------|------|------|
| `online` | `bg-brutal-success` | 在线（绿色） |
| `offline` | `bg-brutal-muted` | 离线（灰色） |
| `busy` | `bg-brutal-destructive` | 忙碌（红色） |
| `none` | — | 不渲染（默认） |

```vue
<script setup>
import { Avatar, AvatarFallback } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex items-center gap-4">
        <Avatar size="lg" status="online">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar size="lg" status="offline">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar size="lg" status="busy">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
    </div>
</template>
```

## Props

### Avatar

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 颜色变体，下发给 `AvatarFallback` |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | 尺寸 |
| `shape` | `'square' \| 'rounded'` | `'square'` | 形状 |
| `status` | `'online' \| 'offline' \| 'busy' \| 'none'` | `'none'` | 右下角状态圆点 |
| `class` | `string` | — | 附加类名 |

### AvatarImage

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | `string` | — | 图片地址 |
| `alt` | `string` | — | 替代文本 |
| `class` | `string` | — | 附加类名 |

### AvatarFallback

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 附加类名 |

## Slots

**Avatar Slots:**

| 插槽 | 说明 |
|------|------|
| `default` | 默认插槽，用于放置 `AvatarImage` 和 `AvatarFallback` 子组件 |

**AvatarFallback Slots:**

| 插槽 | 说明 |
|------|------|
| `default` | 默认插槽，用于放置回退内容（文字或图标） |

## Accessibility

- 状态圆点使用 `role="status"` 和 `aria-label` 属性，支持屏幕阅读器
- 状态标签通过国际化（i18n）提供本地化文本：
  - `online` → "在线"
  - `offline` → "离线"
  - `busy` → "忙碌"
