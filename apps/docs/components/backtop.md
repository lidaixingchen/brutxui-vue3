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

## API 参考

<span id="backtop"></span>
<span id="事件"></span>
<span id="backtop-1"></span>

<ComponentApi name="backtop" />

## 可访问性

- **键盘操作**：按钮支持 Tab 聚焦及 Enter、Space 激活。
- **ARIA 属性**：按钮使用 `backtop.backToTop` 本地化文案作为无障碍名称。
- **滚动行为**：激活后调用原生滚动 `{ top: 0, behavior: 'smooth' }`，实际滚动表现由浏览器处理。
