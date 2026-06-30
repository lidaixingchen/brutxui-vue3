---
title: BeforeAfter 对比滑块
description: 拖拽对比滑块组件，用于在同一框架下展示两张图片的差异，提供清晰的拖拽滑块控制。
---

# BeforeAfter 对比滑块

新粗野主义风格的图片滑动对比组件。用于直观比对同一张图在修改前 (Before) 与修改后 (After) 的视觉差异。基于原生 `<input type="range">` 结合 CSS `clip-path` 遮罩构建，零依赖、触控友好。

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

### 垂直方向

通过 `orientation` 属性切换分割线方向。默认 `horizontal` 为左右拖拽；设置为 `vertical` 时，分割线变为水平方向上下拖拽，裁剪从下到上进行（`clip-path: inset(0 0 ...)`），手柄图标自动旋转 90 度。

```vue
<BeforeAfter
    :before="original"
    :after="modified"
    orientation="vertical"
    :default-value="50"
/>
```

## 变体

| 变体 | 说明 |
|------|------|
| `horizontal` | 默认方向，左右拖拽分割线 |
| `vertical` | 垂直方向，上下拖拽分割线，裁剪从下到上进行 |

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `before` | `string` | — | 左侧/底层原始图片的 URL (必填) |
| `after` | `string` | — | 右侧/表层对比图片的 URL (必填) |
| `beforeAlt` | `string` | locale: `beforeAfter.before` | 原始图片的 `alt` 属性 |
| `afterAlt` | `string` | locale: `beforeAfter.after` | 对比图片的 `alt` 属性 |
| `modelValue` | `number` | — | 分割线位置（v-model，0-100） |
| `defaultValue` | `number` | `50` | 初始状态下分割线所处的百分比位置 (0-100) |
| `disabled` | `boolean` | `false` | 是否禁用拖拽交互 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 分割线方向，vertical 时从下到上裁剪 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 拖拽手柄图标的尺寸 |
| `class` | `string` | `""` | 容器的自定义 CSS 类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `number` | 分割线位置变更 |

## 可访问性

- **键盘操作**：支持键盘方向键控制分割线位置；`disabled` 状态下禁用键盘交互
- **动效降级**：组件尊重 `prefers-reduced-motion` 系统设置。当用户启用"减少动态效果"时（通过 `useReducedMotion` 监听 `prefers-reduced-motion: reduce`）：
  - **移除滑块过渡**：分割线、拖拽手柄以及 `clip-path` 裁剪层不再应用过渡样式，拖动时位置变化即时生效，不带有缓动动画
  - **交互能力保留**：拖拽、键盘方向键、`disabled` 等行为完全不受影响，仅去除视觉过渡
  - **实时响应**：偏好切换后立即生效，无需重新挂载组件
  - 该机制通过一个响应式的 `motionTransition` 计算属性实现：在动效降级模式下返回空字符串，从而让相关元素跳过过渡样式

## 常见问题

**Q: 组件的技术方案是什么？**

A: 本组件基于原生浏览器 `<input type="range">` 结合 CSS 的 `clip-path` 遮罩构建，具有以下优势：
1. **触控友好**：在手机、平板等移动端设备上完美适配滑动手势
2. **零依赖**：不需要额外加载任何外部手势交互 JS 库，包体积近乎于零
3. **完美排版**：底层的 `clip-path: inset(...)` 裁剪方式不会破坏图片的宽高比，确保布局在多端始终对齐
4. **自适应比例**：容器根据图片实际尺寸自动计算 `aspect-ratio`，无需手动指定比例。图片加载前使用默认比例（水平 16:9，垂直 9:16）作为占位
