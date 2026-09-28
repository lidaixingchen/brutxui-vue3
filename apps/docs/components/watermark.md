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

## API 参考

<span id="watermark"></span>

<ComponentApi name="watermark" />

### WatermarkFont 类型定义

```typescript
interface WatermarkFont {
    color?: string                  // 文本颜色，默认 'rgba(0, 0, 0, 0.15)'
    fontSize?: number | string      // 字体大小，支持数字或带单位字符串（如 14, '16px', '1.2rem'），默认 14
    fontWeight?: 'normal' | 'light' | 'weight' | 'bold' | number  // 字体粗细，默认 'normal'
    fontStyle?: 'normal' | 'italic' | 'oblique'                   // 字体风格，默认 'normal'
    fontFamily?: string             // 字体族，默认 'sans-serif'
}
```

## 安全特性

- **Canvas 兼容兜底**：在不支持 Canvas 渲染的无浏览器测试环境（如 JSDOM）下，自动降级为生成纯矢量 SVG 的 Base64 水印图层，保障组件渲染通过。
- **防止恶意篡改**：采用基于 `MutationObserver` 的防篡改防火墙，一旦用户强行在 Devtools 中修改样式（如 `display: none`）或强制 `remove()` 节点，组件将拦截该变动，并在 50ms 内摧毁原位置垃圾，重新生成干净的 DOM 节点，保障高安全要求。

## 可访问性

- **装饰层语义**：水印是装饰性背景层，不参与语义内容；建议结合 `aria-hidden` 与 `pointer-events-none` 使用，避免被辅助技术朗读或被指针事件拦截。
- **对比度考虑**：水印文本颜色（`--brutal-watermark-color` 等令牌）需与背景保持足够对比，但作为装饰层不承担信息传达职责，不强制 WCAG 文本对比。
- **动效降级**：防篡改重建、Canvas 绘制均无强制动效，尊重 `prefers-reduced-motion`。
