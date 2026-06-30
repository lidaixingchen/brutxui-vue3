---
title: FAQ Section
description: 常见问题折叠面板区块，含编号徽标和手风琴交互。
---

# FAQ Section 常见问题

新粗野主义风格的常见问题区块，包含标题、副标题和带编号徽标的手风琴折叠面板。

## 预览

<ComponentPreview>
  <FaqSectionDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="faq-section" />

## 用法

```vue
<script setup>
import FaqSection from '@/components/ui/faq-section/FaqSection.vue'

const items = [
    {
        question: 'What is BrutxUI?',
        answer: 'BrutxUI is a Neo-Brutalist UI component library for Vue 3.',
    },
    {
        question: 'How do I get started?',
        answer: 'Install via npm and import the components you need.',
    },
    {
        question: 'Is it free?',
        answer: 'Yes, BrutxUI is open source and free to use under the MIT license.',
    },
]

function handleItemClick(index) {
    console.log('FAQ item clicked:', items[index].question)
}
</script>

<template>
    <FaqSection
        title="常见问题"
        subtitle="查找您需要的答案"
        :items="items"
        @item-click="handleItemClick"
    />
</template>
```

## 数据类型

### FaqItem

```ts
interface FaqItem {
    question: string
    answer: string
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | locale: `faqSection.defaultTitle` | 区块标题 |
| `subtitle` | `string` | locale: `faqSection.defaultSubtitle` | 区块副标题 |
| `items` | `FaqItem[]` | `[]` | FAQ 问题列表 |
| `class` | `string` | — | 自定义 CSS 类名 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `item-click` | `[index: number]` | 点击 FAQ 项目时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `header` | — | 替换标题和副标题区域 |
| `default` | — | 替换手风琴列表区域 |
| `footer` | — | 替换/扩展区块底部 |

## 可访问性

<!-- TODO: 补充可访问性说明 -->

- 手风琴组件支持键盘导航（Enter/Space 展开/折叠）
- 每个问题项具有适当的 ARIA 属性（`aria-expanded`、`aria-controls`）
- 折叠面板内容对屏幕阅读器可见
