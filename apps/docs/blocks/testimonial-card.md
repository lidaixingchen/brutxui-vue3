---
title: Testimonial Card
description: 用户评价推荐卡片，含头像、引文、署名和验证徽标。
---

# Testimonial Card

新粗野主义风格的用户评价卡片，包含头像、引文图标、评价文本、作者信息和验证徽标。

## 预览

<ComponentPreview>
  <div class="w-full max-w-lg border-3 border-brutal bg-brutal-bg shadow-brutal p-6">
    <div class="flex items-start gap-4">
      <div class="shrink-0 h-12 w-12 flex items-center justify-center bg-brutal-secondary border-3 border-brutal font-black text-lg">AJ</div>
      <div class="flex-1 min-w-0">
        <span class="text-3xl text-brutal-primary font-serif">&ldquo;</span>
        <p class="text-base font-bold leading-relaxed">This product has completely transformed our workflow.</p>
        <div class="mt-4 flex items-center gap-3">
          <div>
            <p class="font-black text-sm">Alex Johnson</p>
            <p class="text-xs text-brutal-muted-foreground font-medium">Product Manager</p>
          </div>
          <span class="px-2 py-0.5 bg-brutal-secondary border-2 border-brutal text-xs font-black">Verified</span>
        </div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block testimonial-card
```

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

## 多卡片布局

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

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `quote` | `string` | locale: `testimonialCard.defaultQuote` |
| `author` | `string` | locale: `testimonialCard.defaultAuthor` |
| `role` | `string` | locale: `testimonialCard.defaultRole` |
| `class` | `string` | — |

## 布局

TestimonialCard 包含：
- **头像**：Avatar 组件，从作者姓名提取首字母缩写
- **引文图标**：Quote 图标，主色渲染
- **评价文本**：加粗正文
- **作者信息**：姓名和职位
- **验证徽标**：secondary 变体 Badge
