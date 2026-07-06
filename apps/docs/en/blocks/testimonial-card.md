---
title: Testimonial Card
description: Neo-Brutalist user testimonial card with avatar, quote icon, review text, author info, and verification badge.
translated: true
---

# Testimonial Card

A Neo-Brutalist user testimonial card featuring an avatar, quote icon, review text, author information, and a verification badge.

> `TestimonialCard` is marked as a legacy block. Compose new testimonial cards from `Card`, `Avatar`, `Badge`, and related primitives.

## Demo

<ComponentPreview>
  <TestimonialCardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="testimonial-card" />

## Usage

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

### Multi-Card Layout

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

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `quote` | `string` | locale: `testimonialCard.defaultQuote` | Testimonial content |
| `author` | `string` | locale: `testimonialCard.defaultAuthor` | Author name |
| `role` | `string` | locale: `testimonialCard.defaultRole` | Author role |
| `class` | `string` | — | Custom CSS class |

## Slots

| Slot | Scope | Description |
| ---- | ---- | ---- |
| `actions` | — | Action area at the bottom of the card |

## Accessibility

- **ARIA**: Quote icon uses `aria-hidden` to hide decorative elements
- **Focus Management**: Card content is arranged in logical order to ensure screen readers read correctly
