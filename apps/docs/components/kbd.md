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

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | 按键颜色变体 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 按键尺寸 |
| `class` | `string \| undefined` | `undefined` | 自定义样式类，会与组件默认样式合并 |

### Events

该组件没有定义任何事件。

### Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 按键内容（文字或符号） |

### Expose

该组件没有暴露任何方法或属性。

## 常用按键符号参考

| 符号 | 含义 |
|------|------|
| `⌘` | Command (macOS) |
| `⌥` | Option/Alt (macOS) |
| `⇧` | Shift |
| `⌃` | Control |
| `⏎` | Enter/Return |
| `⌫` | Backspace |
| `⇥` | Tab |
| `⎋` | Escape |
