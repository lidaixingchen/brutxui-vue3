---
title: Testimonial Card 评价卡片
description: 新粗野主义风格的用户评价卡片，包含头像、引文图标、评价文本、作者信息和验证徽标。
---

# Testimonial Card 评价卡片

新粗野主义风格的用户评价卡片，包含头像、引文图标、评价文本、作者信息和验证徽标。

## 预览

<ComponentPreview>
  <TestimonialCardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="testimonial-card" />

## 用法

```vue
<script setup>
import TestimonialCard from '@/components/ui/testimonial-card/TestimonialCard.vue'
</script>

<template>
    <TestimonialCard
        quote="这款产品彻底改变了我们的工作流程。"
        author="张明"
        role="产品经理"
    />
</template>
```

### 多卡片布局

```vue
<script setup>
import TestimonialCard from '@/components/ui/testimonial-card/TestimonialCard.vue'

const testimonials = [
    { quote: 'Great product!', author: 'Alice', role: 'CEO' },
    { quote: 'Highly recommended.', author: 'Bob', role: 'CTO' },
    { quote: 'Love the design.', author: 'Carol', role: 'Designer' },
]
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TestimonialCard
            v-for="(t, i) in testimonials"
            :key="i"
            :quote="t.quote"
            :author="t.author"
            :role="t.role"
        />
    </div>
</template>
```

## Props

### TestimonialCard

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `quote` | `string` | locale: `testimonialCard.defaultQuote` | 评价内容 |
| `author` | `string` | locale: `testimonialCard.defaultAuthor` | 作者姓名 |
| `role` | `string` | locale: `testimonialCard.defaultRole` | 作者职位 |
| `class` | `string` | — | 自定义样式类 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ---- | ---- |
| `actions` | — | 卡片底部操作区域 |

## 可访问性

- **ARIA 属性**：引文图标使用 `aria-hidden` 隐藏装饰性元素
- **焦点管理**：卡片内容按逻辑顺序排列，确保屏幕阅读器正确朗读
