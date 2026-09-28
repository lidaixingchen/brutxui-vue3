---
title: Accordion 折叠面板
description: 折叠面板组件，用于在一个垂直堆叠的列表中展示和折叠内容。
---

# Accordion 折叠面板

可折叠的面板列表，适用于展示常见问题解答（FAQ）、详细条款或分步信息折叠。基于 Radix Vue 无头原语构建，支持多种粗野主义视觉变体。

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
| ------ | ------ |
| `default` | 默认带有黑粗边框和右下方偏移实心阴影 |
| `flat` | 仅带有黑粗边框，无任何投影效果 |
| `ghost` | 透明背景，无边框和阴影，简约展示 |
| `interactive` | 悬停时增强阴影与高亮，标题栏和面板保持原位 |

```vue
<template>
    <AccordionItem value="item" variant="interactive">
        <AccordionTrigger>交互式折叠子项</AccordionTrigger>
        <AccordionContent>悬停时增强阴影，展开时标题栏保持原位。</AccordionContent>
    </AccordionItem>
</template>
```

### 内容区域样式

`AccordionContent` 的样式会自动继承父级 `AccordionItem` 的 `variant`（通过 `provide`/`inject` 同步，无需手动指定）。所有变体共享基础类 `border-t-3 p-6 bg-brutal-bg text-brutal-fg`，边框颜色由各变体显式声明（避免 base 与变体的 border-color 类同时存在导致覆盖不可靠），再按下表叠加差异样式：

| 变体 | 内容区差异样式 | 视觉效果 |
| ------ | ---------------- | ---------- |
| `default` | `border-brutal` | 顶部黑色粗分隔线 + 默认背景色 |
| `flat` | `border-brutal bg-brutal-muted/30` | 背景替换为半透明静音色，呼应扁平化风格 |
| `ghost` | `border-transparent` | 顶部边框透明，整体更简约轻盈 |
| `interactive` | `border-brutal hover:bg-brutal-muted/20` | 鼠标悬停时内容区出现轻微高亮，增强交互反馈 |

> 说明：变体同时作用于 `AccordionItem`（容器）、`AccordionTrigger`（触发器）与 `AccordionContent`（内容区）三层，保持整体视觉一致。

## 子组件

| 组件 | 说明 |
| ------ | ------ |
| `Accordion` | 根容器，管理展开状态和模式 |
| `AccordionItem` | 单个面板子项，包含触发器和内容 |
| `AccordionTrigger` | 面板触发器，点击切换展开/折叠 |
| `AccordionContent` | 面板内容区域，展开时显示 |

## API 参考

<span id="accordion"></span>
<span id="accordionitem"></span>
<span id="accordiontrigger"></span>
<span id="accordioncontent"></span>
<span id="事件"></span>
<span id="插槽"></span>

<ComponentApi name="accordion" />

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 触发展开/折叠，方向键在面板间导航
- **ARIA 属性**：自动管理 `aria-expanded`、`aria-controls`、`role="region"` 等
- **焦点管理**：Tab 键聚焦触发器，焦点顺序与面板顺序一致
