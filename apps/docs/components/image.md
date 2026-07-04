---
title: Image 图片
description: 新粗野主义风格的图片组件，支持懒加载、备用图、大图预览与多种交互操作。
---

# Image 图片

新粗野主义风格的图片展示组件，支持 IntersectionObserver 懒加载、加载失败备用图、大图预览模态框（含放大/缩小/旋转/翻转/拖拽），以及粗边框硬阴影搭配斜线噪点的占位背景。

## 预览

<ComponentPreview>
  <ImageDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="image" />

## 用法

### 基础用法

传入 `src` 和 `alt` 即可使用，通过 `fit` 控制图片填充模式：

```vue
<script setup>
import { Image } from 'brutx-ui-vue'
</script>

<template>
    <Image src="/photo.jpg" alt="示例图片" fit="cover" class="w-64 h-48" />
</template>
```

### 懒加载

设置 `loading="lazy"` 后，组件会通过 IntersectionObserver 监听元素是否进入视口，仅在可见时才加载图片：

```vue
<template>
    <Image src="/large-photo.jpg" alt="懒加载图片" loading="lazy" class="w-full h-64" />
</template>
```

### 备用图

当主图加载失败时，自动切换到 `fallback` 指定的备用图片：

```vue
<template>
    <Image
        src="/broken-url.jpg"
        alt="测试备用图"
        fallback="/fallback.jpg"
        class="w-64 h-48"
    />
</template>
```

### 大图预览

启用 `preview` 并传入 `previewSrcList`，点击图片即可打开全屏预览模态框：

```vue
<script setup>
import { Image } from 'brutx-ui-vue'

const images = ['/photo1.jpg', '/photo2.jpg', '/photo3.jpg']
</script>

<template>
    <div class="flex gap-4">
        <Image
            v-for="img in images"
            :key="img"
            :src="img"
            :alt="img"
            :preview="true"
            :preview-src-list="images"
            class="w-32 h-32"
        />
    </div>
</template>
```

预览模态框内支持以下操作：
- 放大/缩小（通过工具栏按钮，倍率受 `zoomRate` 控制）
- 向左/向右旋转 90°
- 水平翻转
- 鼠标拖拽移动图片
- `ArrowLeft` / `ArrowRight` 切换上/下一张
- `Escape` 关闭预览
- 设置 `hideOnClickModal` 为 `true` 可点击遮罩关闭

### 自定义占位和错误插槽

通过 `placeholder` 和 `error` 插槽自定义加载中和加载失败的展示内容：

```vue
<template>
    <Image src="/photo.jpg" alt="自定义插槽示例" class="w-64 h-48">
        <template #placeholder>
            <div class="absolute inset-0 flex items-center justify-center bg-brutal-muted">
                <span class="font-bold">正在加载...</span>
            </div>
        </template>
        <template #error>
            <div class="absolute inset-0 flex items-center justify-center bg-brutal-destructive/10">
                <span class="text-brutal-destructive font-bold">图片加载失败</span>
            </div>
        </template>
    </Image>
</template>
```

## 数据类型

```ts
type ImageFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
```

| 值 | 说明 |
|------|------|
| `'fill'` | 拉伸填满容器，不保持宽高比 |
| `'contain'` | 保持宽高比缩放，确保图片完整显示 |
| `'cover'` | 保持宽高比缩放，填满容器（可能裁剪） |
| `'none'` | 保持原始尺寸 |
| `'scale-down'` | 类似 `contain`，但不会放大超过原始尺寸 |

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | — | 图片地址（必填） |
| `alt` | `string` | `''` | 替代文本 |
| `fit` | `'fill' \| 'contain' \| 'cover' \| 'none' \| 'scale-down'` | `'cover'` | 图片填充模式，对应 CSS `object-fit` |
| `previewSrcList` | `string[]` | `[]` | 预览图片列表，传入后支持在预览模态框中切换图片 |
| `initialIndex` | `number` | `0` | 预览时初始显示的图片索引 |
| `hideOnClickModal` | `boolean` | `false` | 是否点击遮罩层关闭预览 |
| `zoomRate` | `number` | `1.2` | 每次放大/缩小的倍率 |
| `preview` | `boolean` | `false` | 是否启用大图预览功能 |
| `fallback` | `string` | — | 加载失败时的备用图片地址 |
| `loading` | `'eager' \| 'lazy'` | `'eager'` | 加载模式，`lazy` 使用 IntersectionObserver 实现懒加载 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `load` | `event: Event` | 图片加载完成时触发 |
| `error` | `event: Event` | 图片加载失败时触发（备用图也失败时才触发） |
| `show` | — | 预览模态框打开时触发 |
| `close` | — | 预览模态框关闭时触发 |
| `switch` | `index: number` | 预览中切换图片时触发，参数为当前图片索引 |

## 插槽

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `placeholder` | — | 图片加载中显示的占位内容，不提供时使用默认斜线噪点背景 + "加载中..." 文字 |
| `error` | — | 图片加载失败时显示的内容，不提供时使用默认红色斜线背景 + "加载失败" 文字 |

## 可访问性

- **键盘操作**：预览模态框支持 `Escape` 关闭、`ArrowLeft` / `ArrowRight` 切换图片
- **ARIA 属性**：预览模态框中的关闭、上一张、下一张按钮均带有 `aria-label` 属性；始终建议提供有意义的 `alt` 文本，以便屏幕阅读器和图片加载失败时使用
- **焦点管理**：预览模态框使用 reka-ui 的 `FocusScope` 组件，启用 `trapped` 和 `loop` 模式，确保焦点不会逃逸到模态框之外

## 常见问题

**Q: 设置 `loading="lazy"` 后图片不显示？**

A: 懒加载依赖 IntersectionObserver，需要确保组件容器有确定的尺寸（通过 `class` 或父容器设定宽高）。如果容器尺寸为零，IntersectionObserver 不会触发回调。

**Q: 点击预览后如何切换图片？**

A: 需要同时传入 `previewSrcList` 数组。在预览模态框中，可通过左右箭头按钮、键盘方向键切换图片。如果 `previewSrcList` 只有一张或为空，切换按钮不会显示。

**Q: `fallback` 图片也加载失败会怎样？**

A: 当备用图也加载失败时，组件会进入错误状态，显示 `error` 插槽的内容（或默认的错误占位），并触发 `error` 事件。
