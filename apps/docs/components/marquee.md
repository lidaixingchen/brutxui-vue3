---
title: Marquee 跑马灯
description: 无限水平循环滚动的跑马灯横幅组件，支持 CSS 减少动态效果偏好并保持 SSR 水合结构稳定。
---

# Marquee 跑马灯

水平跑马灯组件，能够将文本、图片或任意卡片内容在水平轨道上进行无限无缝循环滚动。适合在营销页、Hero 引导区展示推荐标语或合作品牌。支持双向滚动、悬停暂停和边缘淡化效果，并通过 CSS 媒体查询自动适配系统动效偏好设置。

## 预览

<ComponentPreview>
  <MarqueeDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="marquee" />

## 用法

```vue
<script setup>
import { Marquee } from 'brutx-ui-vue'
</script>

<template>
    <Marquee :speed="20" fade>
        <span>⚡️ FAST AND FLUID</span>
        <span>💥 NEO-BRUTALISM</span>
        <span>🚀 VUE 3 + TAILWIND</span>
    </Marquee>
</template>
```

## 变体

通过 `variant` 属性控制跑马灯的背景色与文字色。

| 变体 | 说明 |
|------|------|
| `default` | 背景色背景，深色文字 |
| `primary` | 主色（珊瑚红）背景 |
| `accent` | 强调色（黄色）背景 |
| `muted` | 静音色（灰）背景 |

```vue
<Marquee variant="primary">
    <span>主色跑马灯</span>
</Marquee>
```

## 尺寸

通过 `size` 属性控制文字大小与内边距。

| 尺寸 | 说明 |
|------|------|
| `sm` | 小号文字，紧凑内边距 |
| `default` | 默认大小 |
| `lg` | 大号文字，宽松内边距 |

```vue
<Marquee size="lg">
    <span>大号跑马灯</span>
</Marquee>
```

## API 参考

<span id="marquee"></span>

<ComponentApi name="marquee" />
## 可访问性

- **动效降级**：组件尊重 `prefers-reduced-motion` 系统设置。启用“减少动态效果”时，CSS 会停止轨道动画并隐藏重复轨道；重复轨道仍保留在 DOM 中，以保证 SSR 与客户端水合的结构一致。重复轨道带有 `aria-hidden` 和 `inert`，不会重复暴露内容或交互元素。系统偏好切换时由 CSS 即时响应。

## 样式定制

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--speed` | `20s` | 单次循环动画时长，由 `speed` 属性自动设置 |
