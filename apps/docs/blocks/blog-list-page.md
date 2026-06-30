---
title: Blog List Page 博客列表页
description: 新粗野主义风格的博客列表页面，包含搜索框、分类标签筛选、文章卡片网格和分页组件。
---

# Blog List Page 博客列表页

新粗野主义风格的博客列表页面，包含搜索框、分类标签筛选、文章卡片网格和分页组件。

## 预览

<ComponentPreview>
  <BlogListPageDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="blog-list-page" />

## 用法

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

## 数据类型

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

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `blogListPage.defaultTitle` | 页面标题 |
| `posts` | `BlogPost[]` | `[]` | 文章列表 |
| `categories` | `string[]` | `[]` | 分类列表 |
| `pageSize` | `number` | `6` | 每页文章数 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `postClick` | `[slug: string]` | 点击文章卡片时触发 |
| `categoryFilter` | `[category: string]` | 切换分类筛选时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ---- | ---- |
| `header` | — | 自定义页面标题区域 |
| `default` | — | 自定义主内容区域（替换搜索、卡片网格和分页） |
| `footer` | — | 页面底部内容 |

## 可访问性

- **键盘操作**：支持 `Tab` 在搜索框、分类按钮和文章卡片间导航
- **ARIA 属性**：搜索框使用 `role="search"`，分类按钮使用 `aria-pressed` 指示选中状态
- **焦点管理**：分页切换后焦点保持在分页控件上
