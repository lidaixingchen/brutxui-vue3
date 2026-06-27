---
title: GlitchButton 故障效果按钮
description: 继承 Button 所有变体和尺寸的故障效果按钮，支持多种触发模式和动画速度控制。
---

# GlitchButton 故障效果按钮

新粗野主义风格的故障效果按钮，继承 Button 组件的所有变体和尺寸，在按钮文本上应用 CSS `clip-path` 故障动画效果。

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
