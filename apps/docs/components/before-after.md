---
title: BeforeAfter 对比滑块
description: 拖拽对比滑块组件，用于在同一框架下展示两张图片的差异，提供清晰的拖拽滑块控制。
---

# BeforeAfter 对比滑块

新粗野主义风格的图片滑动对比组件。用于直观比对同一张图在修改前 (Before) 与修改后 (After) 的视觉差异。

## 预览

<ComponentPreview>
  <BeforeAfterDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="before-after" />

## 用法

```vue
<script setup>
import { BeforeAfter } from 'brutx-ui-vue'

const original = '/images/before.jpg'
const modified = '/images/after.jpg'
</script>

<template>
    <BeforeAfter
        :before="original"
        :after="modified"
        :default-value="50"
    />
</template>
```

## 技术方案

本组件基于原生浏览器 `<input type="range">` 结合 CSS 的 `clip-path` 遮罩构建。它能带来以下显著优势：
1. **触控友好**：在手机、平板等移动端设备上完美适配滑动手势。
2. **零依赖**：不需要额外加载任何外部手势交互 JS 库，包体积近乎于零。
3. **完美排版**：底层的 `clip-path: inset(...)` 裁剪方式不会破坏图片的宽高比，确保布局在多端始终对齐。

## 方向

通过 `orientation` 属性切换分割线方向。默认 `horizontal` 为左右拖拽；设置为 `vertical` 时，分割线变为水平方向上下拖拽，裁剪从下到上进行（`clip-path: inset(0 0 ...)`），手柄图标自动旋转 90 度。

```vue
<BeforeAfter
    :before="original"
    :after="modified"
    orientation="vertical"
    :default-value="50"
/>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `before` | `string` | — | 左侧/底层原始图片的 URL (必填) |
| `after` | `string` | — | 右侧/表层对比图片的 URL (必填) |
| `beforeAlt` | `string` | locale: `beforeAfter.before` | 原始图片的 `alt` 属性 |
| `afterAlt` | `string` | locale: `beforeAfter.after` | 对比图片的 `alt` 属性 |
| `defaultValue` | `number` | `50` | 初始状态下分割线所处的百分比位置 (0-100) |
| `disabled` | `boolean` | `false` | 是否禁用拖拽交互 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 分割线方向，vertical 时从下到上裁剪 |
| `class` | `string` | `""` | 容器的自定义 CSS 类 |

## 无障碍 / 动效降级

组件尊重 `prefers-reduced-motion` 系统设置。当用户启用"减少动态效果"时（通过 `useReducedMotion` 监听 `prefers-reduced-motion: reduce`）：

- **移除滑块过渡**：分割线、拖拽手柄以及 `clip-path` 裁剪层不再应用 `transition-[left,top,clip-path] duration-100 ease-out` 过渡样式，拖动时位置变化即时生效，不带有缓动动画。
- **交互能力保留**：拖拽、键盘方向键、`disabled` 等行为完全不受影响，仅去除视觉过渡。
- **实时响应**：偏好切换后立即生效，无需重新挂载组件。

该机制通过一个响应式的 `motionTransition` 计算属性实现：在动效降级模式下返回空字符串，从而让相关元素跳过过渡样式。
