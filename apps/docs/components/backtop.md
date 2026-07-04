---
title: Backtop 回到顶部
description: 页面或局部区域内滚动的快速回到顶部组件，内置节流优化与经典硬阴影黑粗线框外观。
---

# Backtop 回到顶部

快速回到滚动视口顶部的辅助按钮，拥有粗野主义的厚重斜角硬投影和高亮黄配色。支持监听全局 window 滚动或指定的局部 DOM 节点滚动，提供 `useThrottle` 节流防护，防止由于短时间频繁派发 scroll 事件产生的 CPU 开销。

## 预览

<ComponentPreview>
  <BacktopDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="backtop" />

## 用法

### 基础全局用法

在页面中直接引入 `<Backtop>`。当全局视口向下滚动高度超过 200 像素时，按钮会自动以过渡动效浮现。

```vue
<script setup>
import { Backtop } from 'brutx-ui-vue'
</script>

<template>
    <!-- 默认监听全局 window 视口，在右下角展示 -->
    <Backtop :visibility-height="200" />
</template>
```

### 监听局部滚动容器

在具有 `overflow-y: auto` 的局部大内容容器内挂载回到顶部，通过 `target` 属性传入容器的选择器 ID 或者是 HTMLElement 引用。

```vue
<template>
    <div id="my-scroll-box" class="h-60 overflow-y-auto relative">
        <!-- 页面长文本内容 -->
        <div class="h-[800px]">...</div>
        
        <!-- target 绑定容器 selector -->
        <Backtop target="#my-scroll-box" :visibility-height="100" />
    </div>
</template>
```

### 改变偏置位置与色彩变体

通过 `right` 和 `bottom` 定位偏移量，并通过 `variant` 修改配色主题。

```vue
<template>
    <Backtop 
        :right="80" 
        :bottom="80" 
        variant="accent" 
        :visibility-height="150" 
    />
</template>
```

## Props

### Backtop

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visibilityHeight` | `number` | `200` | 滚动高度达到该数值（像素）后才展示回到顶部按钮 |
| `target` | `string \| HTMLElement` | `undefined` | 监听滚动高度并执行返回滚动的目标容器。为空时默认监听全局 `window` |
| `right` | `number` | `40` | 按钮距离视口/容器右侧的偏置距离（像素） |
| `bottom` | `number` | `40` | 按钮距离视口/容器底部的偏置距离（像素） |
| `variant` | `'primary' \| 'secondary' \| 'accent'` | `'primary'` | 配色变体款式（其中 primary 默认渲染粗野高亮黄） |
| `class` | `string` | `undefined` | 自定义传递给回到顶部按钮的额外 CSS 类名 |

## 事件

### Backtop

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `click` | `event: MouseEvent` | 点击按钮执行滚动回顶部时派发的点击事件事件，可通过绑定该事件加入自定义动作 |

## 可访问性

- **ARIA 属性**：按钮节点默认附带 `aria-label="Back to top"`，保证盲人读屏软件可以清晰解析其用途，交互响应良好。
- **平滑滚动**：在支持的客户端上使用平滑过渡动作 `{ top: 0, behavior: 'smooth' }` 回到顶部，若环境开启了“减弱动态效果”，滚动将自动回退为瞬间置顶，消除眩晕风险。
