---
title: GlitchText 故障撕裂文本
description: CSS clip-path 驱动的故障撕裂文本效果，支持横向/纵向/双向撕裂、多种触发模式和速度变体。
---

# GlitchText 故障撕裂文本

新粗野主义风格的故障文本效果，利用 CSS `clip-path` 对伪元素进行分片，在触发时产生高频错位、色差（RGB 通道分离）和瞬间撕裂动效。支持横向、纵向、双向三种撕裂方向。

## 预览

<ComponentPreview>
  <GlitchTextDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="glitch-text" />

## 用法

```vue
<script setup>
import { GlitchText } from 'brutx-ui-vue'
</script>

<template>
    <GlitchText text="BRUTAL GLITCH" class="text-4xl" />
</template>
```

## 触发模式

| 模式 | 说明 |
|------|------|
| `hover` | 鼠标悬停时触发动画，离开后停止（默认） |
| `click` | 点击切换动画开/关 |
| `autoplay` | 组件挂载后自动循环播放，hover 时暂停 |
| `none` | 不自动触发，通过 `expose({ play(), stop() })` 供外部程序化控制 |

## 速度变体

| 速度 | CSS 变量值 |
|------|-----------|
| `slow` | `--glitch-duration: 800ms` |
| `medium` | `--glitch-duration: 300ms`（默认） |
| `fast` | `--glitch-duration: 100ms` |

## 撕裂方向

通过 `direction` prop 控制撕裂切缝与错位方向：

| 方向 | 说明 |
|------|------|
| `horizontal` | 横向撕裂（默认）。切缝水平，文本切成上下横条，条带左右错位，红蓝色分离沿水平方向 |
| `vertical` | 纵向撕裂。切缝垂直，文本切成左右竖条，条带上下错位，红蓝色分离沿垂直方向 |
| `both` | 双向撕裂。`::before` 走横向红、`::after` 走纵向蓝，两层叠加呈现更复杂的破碎效果 |

```vue
<GlitchText text="HORIZONTAL" direction="horizontal" trigger="click" />
<GlitchText text="VERTICAL" direction="vertical" trigger="click" />
<GlitchText text="BOTH" direction="both" trigger="click" />
```

> `both` 模式下两个伪元素都覆盖在原文上，色块叠加可能降低可读性，按需选用。

## 无障碍

- 组件设置了 `role="status"` 和 `aria-live="polite"`
- 当用户偏好 `prefers-reduced-motion: reduce` 时，CSS 媒体查询自动禁用所有故障动画

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | `string` | `''` | 要显示的文本内容（与默认插槽二选一） |
| `trigger` | `'hover' \| 'click' \| 'autoplay' \| 'none'` | `'hover'` | 动画触发时机 |
| `interval` | `number` | `3000` | 自动播放时的周期时间 (ms) |
| `speed` | `'slow' \| 'medium' \| 'fast'` | `'medium'` | 撕裂抖动的频率和速度 |
| `direction` | `'horizontal' \| 'vertical' \| 'both'` | `'horizontal'` | 撕裂方向（横向/纵向/双向） |
| `class` | `string` | — | 外部类覆盖 |

## 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 文本内容（优先于 `text` prop，允许内联样式化部分文本） |

## 暴露方法

| 方法 | 说明 |
|------|------|
| `play()` | 开始故障动画 |
| `stop()` | 停止故障动画 |
