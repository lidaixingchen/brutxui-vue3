---
title: Blog Card
description: Neo-Brutalist blog post preview card with category badge, title, excerpt, author avatar, and read more link.
translated: true
---

# Blog Card

A Neo-Brutalist blog post preview card featuring a category badge, title, excerpt, author avatar, and a "Read more" link.

> `BlogCard` is marked as a legacy block. Compose new article cards from `Card`, `Badge`, `Button`, and related primitives.

## Demo

<ComponentPreview>
  <BlogCardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="blog-card" />

## Usage

```vue
<script setup>
import BlogCard from '@/components/ui/blog-card/BlogCard.vue'

function handleReadMore() {
    console.log('Read more clicked')
}
</script>

<template>
    <BlogCard
        title="Getting Started with BrutxUI"
        excerpt="Learn how to build bold interfaces with our component library."
        author="John Doe"
        date="2026-06-01"
        category="Vue 3"
        @read-more="handleReadMore"
    />
</template>
```

### Multi-Card Layout

```vue
<script setup>
import BlogCard from '@/components/ui/blog-card/BlogCard.vue'

const posts = [
    { title: 'Post One', excerpt: 'First post excerpt...', author: 'Alice', date: '2026-06-01', category: 'Tutorial' },
    { title: 'Post Two', excerpt: 'Second post excerpt...', author: 'Bob', date: '2026-05-28', category: 'Guide' },
]
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BlogCard
            v-for="(post, i) in posts"
            :key="i"
            v-bind="post"
            @read-more="() => console.log(post.title)"
        />
    </div>
</template>
```

## Props

### BlogCard

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `blogCard.defaultTitle` | Post title |
| `excerpt` | `string` | locale: `blogCard.defaultExcerpt` | Post excerpt |
| `author` | `string` | `''` | Author name |
| `date` | `string` | `''` | Publication date |
| `category` | `string` | `''` | Category name |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
| ---- | ---- | ---- |
| `readMore` | — | Emitted when the "Read more" link is clicked |

## Slots

| Slot | Scope | Description |
| ---- | ---- | ---- |
| `actions` | — | Action area at the bottom of the card |

## Accessibility

- **Keyboard**: Supports `Tab` to focus the "Read more" link, `Enter` to navigate
- **ARIA**: Links use semantic `<a>` tags
- **Focus Management**: Card content is arranged in logical order
