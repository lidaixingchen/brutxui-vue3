---
title: Carousel 轮播图
description: 基于 Embla Carousel 的高性能轮播组件，支持自动播放、循环、小圆点导航与新粗野主义视觉风格。
---

# Carousel 轮播图

由 Embla Carousel 驱动的触摸友好型轮播组件，具备流畅的物理滑动惯性，适用于图片画廊、产品展示、功能介绍等场景。

## 预览

<ComponentPreview>
  <CarouselDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="carousel" />

## 用法

```vue
<script setup>
import { Carousel, CarouselItem } from 'brutx-ui-vue'
</script>

<template>
    <Carousel :loop="true" :autoplay="true" :autoplay-delay="3000" size="md">
        <CarouselItem>
            <div class="w-full h-full flex items-center justify-center bg-brutal-primary border-3 border-brutal">
                幻灯片 1
            </div>
        </CarouselItem>
        <CarouselItem>
            <div class="w-full h-full flex items-center justify-center bg-brutal-secondary border-3 border-brutal">
                幻灯片 2
            </div>
        </CarouselItem>
    </Carousel>
</template>
```

## 尺寸

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸 |
| `md` | 中等尺寸 |
| `lg` | 大尺寸 |
| `full` | 全屏高度 |
| `default` | 默认尺寸 |

## 子组件

| 组件 | 说明 |
|------|------|
| `Carousel` | 轮播容器，管理滚动逻辑与导航控制 |
| `CarouselItem` | 单张幻灯片容器 |
| `CarouselEnhanced` | 增强版轮播，额外支持缩略图导航、自动播放指示器与视差动画 |

## 组合式函数

`Carousel` 组件内部逻辑已抽取为独立的 `useCarousel` 组合式函数，可单独使用以构建完全自定义的轮播 UI。它基于 `embla-carousel-vue` 封装，内置自动播放、循环控制、选中索引追踪，并自动遵守 `prefers-reduced-motion` 系统偏好（启用减少动效时会停止自动播放并禁用过渡动画）。

```ts
import { useCarousel } from 'brutx-ui-vue'
import type { UseCarouselOptions } from 'brutx-ui-vue'

const options: UseCarouselOptions = {
    loop: true,
    autoplay: true,
    autoplayDelay: 3000,
}

const {
    emblaRef,        // 绑定到轮播容器的 ref
    selectedIndex,   // 当前选中幻灯片索引
    scrollSnaps,     // 所有滚动停靠点
    canScrollPrev,   // 是否可向前滚动
    canScrollNext,   // 是否可向后滚动
    scrollPrev,      // 滚动到上一张
    scrollNext,      // 滚动到下一张
    scrollTo,        // 滚动到指定索引
    startAutoplay,   // 启动自动播放
    stopAutoplay,    // 停止自动播放
} = useCarousel(options)
```

### 选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loop` | `MaybeRefOrGetter<boolean \| undefined>` | `false` | 是否开启首尾循环滚动 |
| `autoplay` | `MaybeRefOrGetter<boolean \| undefined>` | `false` | 是否自动播放 |
| `autoplayDelay` | `MaybeRefOrGetter<number \| undefined>` | `3000` | 自动播放间隔（毫秒） |

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `emblaRef` | `Ref<HTMLElement \| undefined>` | 绑定到轮播容器的 ref（传给 `<template>` 中的容器元素） |
| `selectedIndex` | `Ref<number>` | 当前选中幻灯片索引 |
| `scrollSnaps` | `Ref<number[]>` | 所有可停靠的滚动位置 |
| `canScrollPrev` | `ComputedRef<boolean>` | 是否可向前滚动（非循环模式下到达首张时为 `false`） |
| `canScrollNext` | `ComputedRef<boolean>` | 是否可向后滚动（非循环模式下到达末张时为 `false`） |
| `scrollPrev()` | `() => void` | 滚动到上一张 |
| `scrollNext()` | `() => void` | 滚动到下一张 |
| `scrollTo(index)` | `(index: number) => void` | 滚动到指定索引 |
| `startAutoplay()` | `() => void` | 启动自动播放（受 `autoplay` 选项与减少动效偏好控制） |
| `stopAutoplay()` | `() => void` | 停止自动播放 |

> 提示：`useCarousel` 会在内部 `onMounted` 注册 Embla 事件、`onUnmounted` 清理监听与计时器，必须在 `setup` 顶层调用。

## 程序化控制

Carousel 通过 `defineExpose` 暴露了一组方法与状态，可通过组件 `ref` 在父组件中主动控制轮播的滚动与读取当前状态，无需自行接管 Embla 实例。

```vue
<script setup>
import { ref } from 'vue'
import { Carousel, CarouselItem } from 'brutx-ui-vue'

const carouselRef = ref()
</script>

<template>
    <Carousel ref="carouselRef" :loop="true">
        <CarouselItem v-for="i in 5" :key="i">
            <div class="w-full h-full flex items-center justify-center">幻灯片 {{ i }}</div>
        </CarouselItem>
    </Carousel>

    <div class="flex gap-2 mt-4">
        <button @click="carouselRef?.scrollPrev()">上一张</button>
        <button @click="carouselRef?.scrollNext()">下一张</button>
        <button @click="carouselRef?.scrollTo(0)">回到首张</button>
    </div>
</template>
```

### 暴露的 API

| 方法/属性 | 类型 | 说明 |
|-----------|------|------|
| `scrollPrev` | `() => void` | 滚动到上一张幻灯片 |
| `scrollNext` | `() => void` | 滚动到下一张幻灯片 |
| `scrollTo` | `(index: number) => void` | 滚动到指定索引的幻灯片 |
| `selectedIndex` | `ComputedRef<number>` | 当前选中幻灯片的索引（只读响应式） |
| `canScrollPrev` | `ComputedRef<boolean>` | 是否还可向前滚动；开启 `loop` 时恒为 `true`（只读响应式） |
| `canScrollNext` | `ComputedRef<boolean>` | 是否还可向后滚动；开启 `loop` 时恒为 `true`（只读响应式） |

> 注意：`selectedIndex`、`canScrollPrev`、`canScrollNext` 是响应式 `ComputedRef`，在 `<template>` 中直接使用时会自动解包；在 `<script setup>` 中读取需通过 `.value`。

## Props

### Carousel

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loop` | `boolean` | `false` | 是否开启首尾循环滚动 |
| `autoplay` | `boolean` | `false` | 是否自动播放 |
| `autoplayDelay` | `number` | `3000` | 自动播放间隔（毫秒） |
| `showArrows` | `boolean` | `true` | 是否显示左右切换箭头 |
| `showDots` | `boolean` | `true` | 是否显示底部导航圆点 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full' \| 'default'` | `'default'` | 轮播容器高度预设 |
| `class` | `string` | — | 根节点自定义样式类 |

### CarouselItem

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 单张幻灯片容器自定义样式类 |

## 插槽

### Carousel

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认插槽，用于放置 `CarouselItem` 组件 |

### CarouselItem

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认插槽，用于放置幻灯片内容 |

## CarouselEnhanced 增强版轮播

`CarouselEnhanced` 在 `Carousel` 的基础上增加了**缩略图导航**、**自动播放指示器**（进度条/圆点/分数）与**视差动画**效果，适用于图片画廊、产品展示等需要更丰富交互的场景。

### 预览

<ComponentPreview>
  <CarouselEnhancedDemo />
</ComponentPreview>

### 用法

```vue
<script setup>
import { CarouselEnhanced, CarouselItem } from 'brutx-ui-vue'
</script>

<template>
    <CarouselEnhanced
        :loop="true"
        :autoplay="true"
        :autoplay-delay="3000"
        size="md"
        :thumbnails="{ show: true, position: 'bottom', size: 'sm', gap: 8, highlightCurrent: true }"
        :autoplay-indicator="{ type: 'progress', position: 'top', pauseOnHover: true }"
        :parallax="{ enabled: true, scale: 1.05, opacity: true, duration: 400 }"
    >
        <CarouselItem v-for="slide in slides" :key="slide.label">
            <div class="w-full h-full flex items-center justify-center">{{ slide.label }}</div>
        </CarouselItem>
    </CarouselEnhanced>
</template>
```

### 基础 Props

继承 `Carousel` 的全部 Props（`loop`/`autoplay`/`autoplayDelay`/`showArrows`/`showDots`/`size`/`class`），以下为增强专有 Props：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `thumbnails` | `CarouselThumbnails` | `{ show: false, position: 'bottom', size: 'sm', gap: 8, highlightCurrent: true }` | 缩略图导航配置 |
| `autoplayIndicator` | `AutoplayIndicator` | — | 自动播放指示器配置 |
| `parallax` | `ParallaxEffect` | — | 视差动画配置 |

### CarouselThumbnails

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `show` | `boolean` | `false` | 是否显示缩略图 |
| `position` | `'bottom' \| 'left' \| 'right'` | `'bottom'` | 缩略图位置 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | 缩略图尺寸 |
| `gap` | `number` | `8` | 缩略图间距（像素） |
| `highlightCurrent` | `boolean` | `true` | 是否高亮当前缩略图 |

### AutoplayIndicator

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'progress' \| 'dots' \| 'fraction'` | —（必填） | 指示器类型：进度条 / 圆点 / 分数 |
| `position` | `'top' \| 'bottom'` | — | 指示器位置 |
| `pauseOnHover` | `boolean` | — | 鼠标悬停时暂停自动播放 |

### ParallaxEffect

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `false` | 是否启用视差动画 |
| `scale` | `number` | `1.1` | 幻灯片缩放比例 |
| `opacity` | `boolean` | `false` | 是否启用透明度过渡 |
| `duration` | `number` | `300` | 动画时长（毫秒） |
| `easing` | `string` | `'ease-out'` | CSS 缓动函数 |

### 暴露的 API

`CarouselEnhanced` 通过 `defineExpose` 暴露与 `Carousel` 相同的方法与状态，另增加自动播放控制：

| 方法/属性 | 类型 | 说明 |
|-----------|------|------|
| `scrollPrev` | `() => void` | 滚动到上一张幻灯片 |
| `scrollNext` | `() => void` | 滚动到下一张幻灯片 |
| `scrollTo` | `(index: number) => void` | 滚动到指定索引的幻灯片 |
| `selectedIndex` | `ComputedRef<number>` | 当前选中幻灯片的索引（只读响应式） |
| `canScrollPrev` | `ComputedRef<boolean>` | 是否还可向前滚动 |
| `canScrollNext` | `ComputedRef<boolean>` | 是否还可向后滚动 |
| `startAutoplay` | `() => void` | 启动自动播放 |
| `stopAutoplay` | `() => void` | 停止自动播放 |

### 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认插槽，用于放置 `CarouselItem` 组件 |
| `thumbnail` | `{ index: number, scrollTo: (index: number) => void }` | 自定义缩略图渲染；不提供时使用默认数字缩略图 |

## 可访问性

- **ARIA 属性**：左右箭头按钮均带有 `aria-label`；导航圆点按钮均带有 `aria-label`
- **焦点管理**：键盘焦点管理由 Embla 内置支持
- **动效降级**：组件尊重 `prefers-reduced-motion` 系统设置。当用户启用"减少动态效果"时（由内部 `useCarousel` 组合式函数通过 `useReducedMotion` 监听）：
  - **停止自动播放**：`autoplay` 不再触发，已有的定时器会被清除
  - **禁用过渡动画**：通过 `emblaApi.reInit({ duration: 0 })` 让幻灯片切换不再带有滑动惯性，直接跳转到位
  - **实时响应**：偏好变化时立即生效，无需重新挂载组件；恢复默认设置后会还原过渡时长并在 `autoplay` 开启时恢复播放

鼠标悬停暂停 / 离开恢复的交互逻辑在动效降级模式下依然保留，但因为 autoplay 已停止，悬停行为不会带来额外的副作用。

## 常见问题

**Q: 开启 `loop` 后为什么箭头按钮状态没有变化？**

A: 当 `loop` 设为 `true` 时，`canScrollPrev` 和 `canScrollNext` 始终为 `true`，因为循环模式下总是可以继续滚动。这是正常行为，箭头按钮会始终保持可用状态。

**Q: 自动播放在某些设备上不生效，是什么原因？**

A: 组件会自动遵守系统的"减少动态效果"偏好设置。如果用户在系统设置中启用了"减少动态效果"，自动播放将被禁用。此外，在页面不可见时自动播放也会暂停，切换回页面后会恢复。

**Q: 如何在轮播切换时执行自定义逻辑？**

A: 通过 `ref` 获取组件实例后，可以监听 `selectedIndex` 的变化。也可以使用 `useCarousel` 组合式函数自行构建轮播 UI，它暴露了完整的 Embla 事件接口，可以注册 `select`、`scroll` 等事件回调。
