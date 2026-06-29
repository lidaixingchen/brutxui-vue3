---
title: Accordion 折叠面板
description: 折叠面板组件，用于在一个垂直堆叠的列表中展示和折叠内容。
---

# Accordion 折叠面板

可折叠的面板列表，适用于展示常见问题解答（FAQ）、详细条款或分步信息折叠。

## 预览

<ComponentPreview>
  <AccordionDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="accordion" />

## 用法

```vue
<script setup>
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 'brutx-ui-vue'
</script>

<template>
    <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
            <AccordionTrigger>这里是面板标题 1</AccordionTrigger>
            <AccordionContent>
                这里是折叠面板内容 1。
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
            <AccordionTrigger>这里是面板标题 2</AccordionTrigger>
            <AccordionContent>
                这里是折叠面板内容 2。
            </AccordionContent>
        </AccordionItem>
    </Accordion>
</template>
```

## 变体

可以使用 `AccordionItem` 的 `variant` 属性来设置不同的粗野主义风格：

| 变体 | 说明 |
|------|------|
| `default` | 默认带有黑粗边框和右下方偏移实心阴影 |
| `flat` | 仅带有黑粗边框，无任何投影效果 |
| `ghost` | 透明背景，无边框和阴影，简约展示 |
| `interactive` | 在悬停时拥有阴影放大和位移，交互感更强 |

```vue
<template>
    <AccordionItem value="item" variant="interactive">
        <AccordionTrigger>交互式折叠子项</AccordionTrigger>
        <AccordionContent>Hover 看看！有悬停偏移效果。</AccordionContent>
    </AccordionItem>
</template>
```

### 内容区域样式

`AccordionContent` 的样式会自动继承父级 `AccordionItem` 的 `variant`（通过 `provide`/`inject` 同步，无需手动指定）。所有变体共享基础类 `border-t-3 border-brutal p-6 bg-brutal-bg text-brutal-fg`，再按下表叠加差异样式：

| 变体 | 内容区差异样式 | 视觉效果 |
|------|----------------|----------|
| `default` | （无附加样式） | 顶部黑色粗分隔线 + 默认背景色 |
| `flat` | `bg-brutal-muted/30` | 背景替换为半透明静音色，呼应扁平化风格 |
| `ghost` | `border-transparent` | 顶部边框透明，整体更简约轻盈 |
| `interactive` | `hover:bg-brutal-muted/20` | 鼠标悬停时内容区出现轻微高亮，增强交互反馈 |

> 说明：变体同时作用于 `AccordionItem`（容器）、`AccordionTrigger`（触发器）与 `AccordionContent`（内容区）三层，保持整体视觉一致。

## Props

### Accordion Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'single' \| 'multiple'` | — | 展开模式，单选或多选 |
| `collapsible` | `boolean` | `false` | 在 `type="single"` 模式下是否允许关闭全部子项 |
| `disabled` | `boolean` | `false` | 是否禁用整个折叠面板 |
| `modelValue` | `string \| string[]` | — | 当前选中的面板值 |

### AccordionItem Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | — | 唯一的标示值 (必填) |
| `variant` | `'default' \| 'flat' \| 'ghost' \| 'interactive'` | `'default'` | 视觉风格变体 |
| `disabled` | `boolean` | `false` | 是否禁用此子项 |
