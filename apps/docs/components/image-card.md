---
title: ImageCard 图像卡片
description: 拍立得相框式图像卡片，实体粗黑边框与硬投影承载实体感，内置宽高比锁定与高对比标签底栏。
---

# ImageCard 图像卡片

拍立得相框式的图像展示卡片：图片区以固定宽高比锁定几何，底部标签栏以主题色族实底 + 粗黑线隔断呈现工控档案标注。悬浮时整卡上浮（硬投影无模糊），遵循库统一交互语言。

## 预览

<ComponentPreview>
  <ImageCardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="image-card" />

## 用法

### 基础用法

```vue
<script setup>
import { ImageCard } from 'brutx-ui-vue'
</script>

<template>
    <ImageCard
        class="max-w-xs"
        src="/images/field-record.jpg"
        alt="外勤档案照片"
        title="Field Record 001"
        description="悬浮时整卡上浮，投影保持硬边。"
    />
</template>
```

### 宽高比与底栏色族

`aspect` 锁定图片区几何，`accent` 决定底栏色族。

```vue
<template>
    <ImageCard
        src="/images/archive.jpg"
        alt="归档资料"
        aspect="square"
        accent="destructive"
        title="Aspect Square"
    />
</template>
```

### 自定义底栏插槽

默认插槽替换标题/描述结构，可自由排布底栏内容。

```vue
<template>
    <ImageCard src="/images/archive.jpg" alt="归档资料">
        <div class="flex items-center justify-between font-mono text-xs font-bold uppercase">
            <span>Archive / 1998</span>
            <span>[ CONFIDENTIAL ]</span>
        </div>
    </ImageCard>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | `string` | *(必填)* | 图片地址 |
| `alt` | `string` | `''` | 图片替代文本，空字符串表示纯装饰图 |
| `aspect` | `'4/3' \| 'video' \| 'square'` | `undefined` | 图片区宽高比：`video` 为 16:9 |
| `accent` | `'primary' \| 'secondary' \| 'accent' \| 'destructive' \| 'success' \| 'info' \| 'muted'` | `undefined` | 底栏主题色族 |
| `title` | `string` | `undefined` | 底栏标题（等宽大写工控排版） |
| `description` | `string` | `undefined` | 底栏描述文本 |
| `class` | `ClassValue` | `undefined` | 自定义 CSS 类名 |

## Slots

| 插槽 | 说明 |
|------|------|
| `default` | 替换底栏默认的标题/描述结构 |

::: tip 无底栏形态
`title`、`description` 均未提供且无默认插槽内容时不渲染 `<figcaption>`，组件退化为纯图片相框。
:::

## 可访问性

- **图片替代文本**：信息性图片必须提供 `alt`；纯装饰图传空字符串使读屏跳过。
- **语义结构**：根元素为 `<figure>`、底栏为 `<figcaption>`，图片与说明保持原生语义关联。
- **动效降级**：悬浮上浮过渡为唯一动效，遵循全局 reduced-motion 策略。
