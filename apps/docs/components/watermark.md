---
title: Watermark 水印
description: 网页平铺水印组件，用以对敏感机密信息区域进行安全平铺遮盖，内置防篡改防删除机制。
---

# Watermark 水印

在宿主元素上平铺文字或图案水印。组件拥有高安全性的防御防篡改机制，在用户尝试修改水印的 `style` 或物理从 DOM 树中移除水印节点时，会瞬间触发内置的 `MutationObserver` 监听，瞬间销毁脏节点并彻底重建。

## 预览

<ComponentPreview>
  <WatermarkDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="watermark" />

## 用法

### 基础文字水印

将敏感页面或机密内容包裹在 `<Watermark>` 中。

```vue
<script setup>
import { Watermark } from 'brutx-ui-vue'
</script>

<template>
    <Watermark content="机密信息，严禁外传">
        <div class="confidential-doc">
            <h3>核心机密数据</h3>
            <p>合作条款 details...</p>
        </div>
    </Watermark>
</template>
```

### 多行水印与字体/旋转定制

支持传入数组生成多行水印，并且可以控制倾斜角度、网格大小以及文字样式。

```vue
<template>
    <Watermark
        :content="['CONFIDENTIAL', 'DEPT 01']"
        :rotate="-15"
        :gap="[120, 120]"
        :font="{ color: 'rgba(239, 68, 68, 0.12)', fontSize: 16, fontWeight: 'bold' }"
    >
        <div class="content-box">
            <p>敏感段落数据示例...</p>
        </div>
    </Watermark>
</template>
```

## Props

### Watermark

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | `number` | `120` | 单个水印图形的宽度 |
| `height` | `number` | `64` | 单个水印图形的高度 |
| `rotate` | `number` | `-22` | 水印文本/图片的倾斜角度（逆时针旋转度数） |
| `zIndex` | `number` | `9` | 水印图层的 z-index 深度层级 |
| `image` | `string` | `undefined` | 水印图片的数据源 (DataURL / URL)，图片模式下文本内容不再生效 |
| `content` | `string \| string[]` | `''` | 水印的文本内容，支持数组形式排布多行文本 |
| `gap` | `[number, number]` | `[100, 100]` | 水印横纵向平铺的网格空隙间隔 (gapX, gapY) |
| `offset` | `[number, number]` | `[0, 0]` | 水印平铺在画布起始点的位移偏置量 (offsetX, offsetY) |
| `font` | `WatermarkFont` | *(见下方)* | 文本水印的字体及颜色样式配置 |

### WatermarkFont 类型定义

```typescript
interface WatermarkFont {
    color?: string       // 文本颜色，默认 'rgba(0, 0, 0, 0.15)'
    fontSize?: number    // 字体大小，默认 14
    fontWeight?: string  // 字体粗细，默认 'normal'
    fontStyle?: string   // 字体风格，默认 'normal'
    fontFamily?: string  // 字体族，默认 'sans-serif'
}
```

## 安全特性

- **Canvas 兼容兜底**：在不支持 Canvas 渲染的无浏览器测试环境（如 JSDOM）下，自动降级为生成纯矢量 SVG 的 Base64 水印图层，保障组件渲染通过。
- **防止恶意篡改**：采用基于 `MutationObserver` 的防篡改防火墙，一旦用户强行在 Devtools 中修改样式（如 `display: none`）或强制 `remove()` 节点，组件将拦截该变动，并在 50ms 内摧毁原位置垃圾，重新生成干净的 DOM 节点，保障高安全要求。
