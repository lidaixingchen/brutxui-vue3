---
title: BrutalShape 图腾
description: 纯 SVG 矢量图腾装饰组件，内置爆炸多角星、工业图章、HUD 标定十字、8-Bit 像素与符号图腾五类共 22 个图腾。
---

# BrutalShape 图腾

以纯 SVG 内联渲染的粗野主义装饰图腾库，为卡片、标题、按钮等宿主元素提供压角贴纸、印章徽记与 HUD 标定视觉。全部图形走 `fill`/`stroke` 继承注入，默认引用语义令牌，自动联动主题预设与暗色模式。

## 预览

<ComponentPreview>
  <BrutalShapeDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="brutal-shape" />

## 用法

### 基础图腾

通过 `name` 选择图腾，`size` 控制渲染边长（px）。

```vue
<script setup>
import { BrutalShape } from 'brutx-ui-vue'
</script>

<template>
    <BrutalShape name="star-8" :size="44" />
</template>
```

### 配色与描边定制

`color` 与 `stroke` 接受任意 CSS 颜色值；将 `color` 设为 `transparent` 并加大 `strokeWidth` 可得到线框形态。

```vue
<template>
    <!-- 实底填充 + 硬描边 -->
    <BrutalShape name="lightning" :size="48" color="var(--brutal-primary)" stroke="var(--brutal-primary)" />

    <!-- 线框形态 -->
    <BrutalShape name="diamond" :size="48" color="transparent" stroke="var(--brutal-fg)" :stroke-width="6" />
</template>
```

### 压角贴纸

配合绝对定位实现贴纸压角效果。组件根已声明 `pointer-events-none`，不会干扰宿主交互。

```vue
<template>
    <div class="relative border-3 border-brutal p-6">
        <BrutalShape
            name="seal-badge"
            :size="52"
            class="absolute -right-4 -top-4 rotate-12"
        />
        <h4>Limited Edition</h4>
    </div>
</template>
```

## 图腾清单

| 分类 | 名称 |
|------|------|
| 爆炸多角星 Burst | `star-4` · `star-5` · `star-6` · `star-8` · `star-12` · `star-16` |
| 工业图章 Seal | `seal-saw-16` · `seal-cog-8` · `seal-scallop-8` · `seal-badge` |
| HUD 标定十字 Crosshair | `crosshair-plus` · `crosshair-target` · `crosshair-corner` |
| 8-Bit 像素 Pixel | `pixel-burst` · `pixel-heart` · `pixel-spark` |
| 符号图腾 Glyph | `lightning` · `heart` · `skull` · `thumb` · `diamond` |

传入未知名称时组件跳过渲染并在控制台输出警告。

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | *(必填)* | 图腾名称，见上方图腾清单 |
| `size` | `number \| string` | `32` | 渲染边长（px），viewBox 为 100 坐标系等比缩放 |
| `color` | `string` | `var(--brutal-accent)` | 填充色，默认联动语义令牌 |
| `stroke` | `string` | `var(--brutal-fg)` | 描边色 |
| `strokeWidth` | `number \| string` | `3` | 描边宽度（viewBox 100 坐标系单位） |
| `decorative` | `boolean` | `true` | 纯装饰标记：`true` 时对读屏隐藏（aria-hidden）；语义场景由父级提供文本替代 |

## 可访问性

- **装饰语义**：默认 `decorative` 对读屏隐藏；当图腾承担信息传达职责时传 `:decorative="false"` 并由父级提供文本替代。
- **交互无扰**：根元素 `pointer-events-none`，悬浮/点击事件完全穿透到宿主。
- **动效无关**：本体是静态矢量图形，旋转、缩放等变换由使用方通过类名控制，尊重全局 reduced-motion 策略。
