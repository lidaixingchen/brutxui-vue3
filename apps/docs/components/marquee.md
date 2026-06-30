---
title: Marquee 跑马灯
description: 无限水平循环滚动的跑马灯横幅组件，粗犷动感的视觉表现非常契合新粗野主义风格。
---

# Marquee 跑马灯

水平跑马灯组件，能够将文本、图片或任意卡片内容在水平轨道上进行无限无缝循环滚动。适合在营销页、Hero 引导区展示推荐标语或合作品牌。

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

## 功能特性

- **双向滚动**：通过 `direction` 属性可以控制内容向左 (`left`) 或向右 (`right`) 滚动。
- **悬停暂停**：开启 `pauseOnHover` 属性后，鼠标悬停时滚动会自动暂停，方便用户阅读。
- **边缘淡化**：配置 `fade` 属性，会在组件左右两侧生成透明度渐变遮罩，使内容过渡更为柔和。

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

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `direction` | `'left' \| 'right'` | `'left'` | 跑马灯滚动方向 |
| `speed` | `number` | `20` | 单次循环所耗费的秒数（数值越小速度越快） |
| `pauseOnHover` | `boolean` | `false` | 鼠标悬停时是否暂停动画 |
| `fade` | `boolean` | `false` | 是否开启左右边缘淡入淡出遮罩效果 |
| `variant` | `'default' \| 'primary' \| 'accent' \| 'muted'` | `'default'` | 背景与文字颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 文字大小与内边距 |
| `class` | `string` | `""` | 容器的自定义 CSS 类 |

## 无障碍 / 动效降级

组件尊重 `prefers-reduced-motion` 系统设置。当用户启用"减少动态效果"时：

- 移除轨道的滚动动画（添加 `[animation:none]`），内容以静态形式展示。
- 不再渲染用于无缝衔接的重复轨道副本（`aria-hidden` 的镜像轨道），仅保留单份内容，避免视觉冗余。

该行为通过 `useReducedMotion` 组合式函数监听 `prefers-reduced-motion: reduce` 媒体查询实现，会随系统设置的切换实时响应，无需刷新页面。
