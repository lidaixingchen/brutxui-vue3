---
title: GlitchButton 故障效果按钮
description: 继承 Button 所有变体和尺寸的故障效果按钮，支持横向/纵向/双向撕裂、多种触发模式和动画速度控制。
---

# GlitchButton 故障效果按钮

新粗野主义风格的故障效果按钮，继承 Button 组件的所有变体和尺寸，在按钮文本上应用 CSS `clip-path` 故障动画效果。支持横向、纵向、双向三种撕裂方向。

## 预览

<ComponentPreview>
  <GlitchButtonDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="glitch-button" />

## 用法

```vue
<script setup>
import { GlitchButton } from 'brutx-ui-vue'
</script>

<template>
    <GlitchButton variant="primary" trigger="hover">
        点击我
    </GlitchButton>
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
| `horizontal` | 横向撕裂（默认）。切缝水平，文本切成上下横条，条带左右错位；按钮整体附加 `skewX` 倾斜 |
| `vertical` | 纵向撕裂。切缝垂直，文本切成左右竖条，条带上下错位；按钮整体附加 `skewY` 倾斜 |
| `both` | 双向撕裂。`::before` 走横向红、`::after` 走纵向蓝，两层叠加；**不应用**整体倾斜以避免过度动荡 |

```vue
<GlitchButton direction="horizontal" data-text="HORIZONTAL" trigger="click">HORIZONTAL</GlitchButton>
<GlitchButton direction="vertical" data-text="VERTICAL" trigger="click">VERTICAL</GlitchButton>
<GlitchButton direction="both" data-text="BOTH" trigger="click">BOTH</GlitchButton>
```

> **`data-text` 属性**：GlitchButton 的撕裂效果通过伪元素 `content: attr(data-text)` 复制文本实现，因此需要通过 `data-text` 属性传入与按钮内容一致的文本，否则伪元素复制层为空。这是与 GlitchText（自动从 `text` prop 绑定 `data-text`）的关键差异。

> `both` 模式下两个伪元素都覆盖在原文上，色块叠加可能降低可读性，按需选用。

## 按钮变体

GlitchButton 继承 Button 的所有变体：

| 变体 | 说明 |
|------|------|
| `default` | 默认样式 |
| `primary` | 主色调 |
| `secondary` | 辅助色 |
| `accent` | 强调色 |
| `danger` | 危险/错误 |
| `success` | 成功 |
| `outline` | 轮廓 |
| `ghost` | 幽灵 |
| `link` | 链接样式 |

## 尺寸

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸 |
| `default` | 默认尺寸 |
| `lg` | 大尺寸 |
| `xl` | 超大尺寸 |
| `icon` | 图标按钮 |

## 无障碍

- 当用户偏好 `prefers-reduced-motion: reduce` 时，自动禁用所有故障动画
- 监听 `prefersReducedMotion` 变化，实时响应用户偏好
- 支持 `disabled` 和 `loading` 状态

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | 按钮变体 |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'icon'` | `'default'` | 按钮尺寸 |
| `speed` | `'slow' \| 'medium' \| 'fast'` | `'medium'` | 故障动画速度 |
| `direction` | `'horizontal' \| 'vertical' \| 'both'` | `'horizontal'` | 撕裂方向（横向/纵向/双向） |
| `trigger` | `'hover' \| 'click' \| 'autoplay' \| 'none'` | `'hover'` | 动画触发时机 |
| `interval` | `number` | `3000` | 自动播放间隔 (ms)，最小 100 |
| `asChild` | `boolean` | `false` | 作为子组件渲染 |
| `loading` | `boolean` | `false` | 加载状态 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `class` | `string` | — | 外部类覆盖 |

## 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 按钮内容 |

## 暴露方法

| 方法 | 说明 |
|------|------|
| `play()` | 开始故障动画 |
| `stop()` | 停止故障动画 |

## 示例

### 自动播放模式

```vue
<GlitchButton trigger="autoplay" :interval="5000" speed="slow">
    自动故障效果
</GlitchButton>
```

### 加载状态

```vue
<GlitchButton :loading="true" variant="primary">
    提交中...
</GlitchButton>
```

### 图标按钮

```vue
<GlitchButton size="icon" variant="outline">
    <Icon name="settings" />
</GlitchButton>
```
