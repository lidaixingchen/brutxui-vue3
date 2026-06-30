---
title: Kbd 键盘按键
description: 键盘按键样式组件，用于展示快捷键提示，配合 Command 组件使用效果极佳。
---

# Kbd 键盘按键

语义化的 `<kbd>` 封装组件，通过新粗野主义样式将快捷键从普通文本中视觉剥离，让文档和命令提示一目了然。

## 预览

<ComponentPreview>
  <KbdDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="kbd" />

## 用法

```vue
<script setup>
import { Kbd } from 'brutx-ui-vue'
</script>

<template>
    <!-- 单键 -->
    <Kbd>Enter</Kbd>

    <!-- 组合键 -->
    <div class="flex items-center gap-1">
        <Kbd>⌘</Kbd>
        <span>+</span>
        <Kbd>K</Kbd>
    </div>

    <!-- 尺寸 -->
    <Kbd size="sm">Esc</Kbd>
    <Kbd size="md">Tab</Kbd>
    <Kbd size="lg">Space</Kbd>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 中性背景，标准前景色文字 |
| `primary` | Primary（珊瑚色）背景，高对比前景色 |
| `secondary` | Secondary（薄荷青）背景 |
| `accent` | Accent（黄色）背景 |

```vue
<script setup>
import { Kbd } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex items-center gap-2">
        <Kbd variant="default">Esc</Kbd>
        <Kbd variant="primary">Enter</Kbd>
        <Kbd variant="secondary">Tab</Kbd>
        <Kbd variant="accent">Space</Kbd>
    </div>
</template>
```

## 尺寸

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸，适合内联紧凑场景 |
| `md` | 默认尺寸 |
| `lg` | 大尺寸，适合独立展示 |

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 按键颜色变体 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 按键尺寸 |
| `class` | `string \| undefined` | `undefined` | 自定义样式类，会与组件默认样式合并 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 按键内容（文字或符号） |

## 可访问性

- **语义化标记**：使用原生 `<kbd>` 元素渲染，屏幕阅读器可正确识别为键盘按键
- **视觉呈现**：通过粗野主义样式将按键从普通文本中视觉剥离，提升可读性
- **组合键展示**：支持通过多个 `<Kbd>` 组合展示快捷键，语义清晰
