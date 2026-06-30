---
title: Gallery Section 画廊区
description: 新粗野主义风格的画廊展示区块，包含轮播图组件和图片卡片。
---

# Gallery Section 画廊区

新粗野主义风格的画廊展示区块，包含轮播图组件和图片卡片。

## 预览

<ComponentPreview>
  <GallerySectionDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="gallery-section" />

## 用法

```vue
<script setup>
import GallerySection from '@/components/ui/gallery-section/GallerySection.vue'

const items = [
    {
        src: '/images/photo1.jpg',
        alt: 'Photo 1',
        caption: 'Mountain landscape',
    },
    {
        src: '/images/photo2.jpg',
        alt: 'Photo 2',
        caption: 'Ocean sunset',
    },
    {
        src: '/images/photo3.jpg',
        alt: 'Photo 3',
    },
]

function handleItemClick(index) {
    console.log('Item clicked:', index)
}
</script>

<template>
    <GallerySection
        title="Gallery"
        :items="items"
        @item-click="handleItemClick"
    />
</template>
```

## 数据类型

```ts
interface GalleryItem {
    src: string
    alt: string
    caption?: string
}
```

## Props

### GallerySection

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `gallerySection.defaultTitle` | 区块标题 |
| `items` | `GalleryItem[]` | `[]` | 图片列表 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `itemClick` | `[index: number]` | 点击图片时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ---- | ---- |
| `header` | — | 自定义标题区域 |
| `default` | — | 自定义主内容区域（替换轮播图） |
| `footer` | — | 底部内容 |

## 可访问性

- **键盘操作**：支持 `Tab` 聚焦轮播图，左右箭头键切换图片
- **ARIA 属性**：轮播图使用 `role="region"` 和 `aria-roledescription="carousel"`
- **焦点管理**：轮播图切换时焦点保持在控件上
- **动效降级**：尊重 `prefers-reduced-motion` 系统设置，自动禁用或简化轮播动画
