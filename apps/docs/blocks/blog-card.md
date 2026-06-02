---
title: Blog Card
description: 博客文章预览卡片，含分类徽标、标题、摘要、作者和阅读更多链接。
---

# Blog Card

新粗野主义风格的博客文章预览卡片，包含分类徽标、标题、摘要、作者头像和"阅读更多"链接。

## 预览

<ComponentPreview>
  <div class="w-full max-w-lg border-3 border-brutal bg-brutal-bg shadow-brutal">
    <div class="p-6 pb-2">
      <span class="inline-block px-2 py-0.5 bg-brutal-primary border-2 border-brutal text-xs font-black mb-2">Vue 3</span>
      <h3 class="text-lg font-black tracking-tight leading-snug">Getting Started with BrutxUI</h3>
    </div>
    <div class="p-6 pt-2">
      <p class="text-sm text-brutal-muted-foreground font-medium leading-relaxed">Learn how to build bold interfaces with our component library.</p>
      <div class="mt-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 flex items-center justify-center bg-brutal-secondary border-2 border-brutal text-xs font-black">JD</div>
          <span class="text-sm font-bold">John Doe</span>
        </div>
        <span class="text-xs text-brutal-muted-foreground font-medium">2026-06-01</span>
      </div>
      <button class="mt-3 text-sm font-bold text-brutal-primary cursor-pointer hover:underline">Read more</button>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block blog-card
```

## 用法

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

## 多卡片布局

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

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `blogCard.defaultTitle` |
| `excerpt` | `string` | locale: `blogCard.defaultExcerpt` |
| `author` | `string` | `''` |
| `date` | `string` | `''` |
| `category` | `string` | `''` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `readMore` | `[]` |

## 布局

BlogCard 包含：
- **分类徽标**（可选）：primary 变体 Badge
- **标题**：加粗、字距调整的标题
- **摘要**：弱化文本
- **作者信息**（可选）：Avatar 头像 + 姓名
- **日期**（可选）：弱化小字
- **阅读更多**：主色加粗链接
