---
title: Blog List Page
description: Neo-brutalist blog list page with search box, category tag filtering, article card grid, and pagination.
translated: true
---

# Blog List Page

A neo-brutalist blog list page featuring a search box, category tag filtering, article card grid, and pagination component.

## Demo

<ComponentPreview>
  <BlogListPageDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="blog-list-page" />

## Usage

```vue
<script setup>
import BlogListPage from '@/components/ui/blog-list-page/BlogListPage.vue'

const posts = [
    {
        title: 'Getting Started with BrutxUI',
        excerpt: 'An introduction to building with BrutxUI components.',
        author: 'Admin',
        date: '2024-01-15',
        category: 'Tech',
        slug: 'getting-started',
    },
    {
        title: 'Design Principles',
        excerpt: 'Exploring the neo-brutalist design philosophy.',
        author: 'Designer',
        date: '2024-01-10',
        category: 'Design',
        slug: 'design-principles',
    },
]

const categories = ['Tech', 'Design']

function handlePostClick(slug) {
    console.log('Post clicked:', slug)
}

function handleCategoryFilter(category) {
    console.log('Category filter:', category)
}
</script>

<template>
    <BlogListPage
        :posts="posts"
        :categories="categories"
        :page-size="6"
        @post-click="handlePostClick"
        @category-filter="handleCategoryFilter"
    />
</template>
```

## Data Types

```ts
interface BlogPost {
    title: string
    excerpt: string
    author: string
    date: string
    category: string
    slug: string
}
```

## Props

### BlogListPage

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `blogListPage.defaultTitle` | Page title |
| `posts` | `BlogPost[]` | `[]` | Article list |
| `categories` | `string[]` | `[]` | Category list |
| `pageSize` | `number` | `6` | Number of articles per page |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
| ---- | ---- | ---- |
| `postClick` | `[slug: string]` | Triggered when an article card is clicked |
| `categoryFilter` | `[category: string]` | Triggered when a category filter is toggled |

## Slots

| Slot | Scope | Description |
| ---- | ---- | ---- |
| `header` | — | Custom page title area |
| `default` | — | Custom main content area (replaces search, card grid, and pagination) |
| `footer` | — | Page bottom content |

## Accessibility

- **Keyboard**: Supports `Tab` to navigate between the search box, category buttons, and article cards
- **ARIA attributes**: Search box uses `role="search"`, category buttons use `aria-pressed` to indicate selected state
- **Focus management**: Focus stays on the pagination control after page switching
