---
title: Blog Card 博客卡片
description: 新粗野主义风格的博客文章预览卡片，包含分类徽标、标题、摘要、作者头像和"阅读更多"链接。
---

# Blog Card 博客卡片

新粗野主义风格的博客文章预览卡片，包含分类徽标、标题、摘要、作者头像和"阅读更多"链接。

> `BlogCard` 已标记为 legacy block。新业务卡片建议用 `Card`、`Badge`、`Button` 等基础组件组合。

## 预览

<ComponentPreview>
  <BlogCardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="blog-card" />

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

### 多卡片布局

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

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `blogCard.defaultTitle` | 文章标题 |
| `excerpt` | `string` | locale: `blogCard.defaultExcerpt` | 文章摘要 |
| `author` | `string` | `''` | 作者姓名 |
| `date` | `string` | `''` | 发布日期 |
| `category` | `string` | `''` | 分类名称 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `readMore` | — | 点击"阅读更多"链接时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ---- | ---- |
| `actions` | — | 卡片底部操作区域 |

## 可访问性

- **键盘操作**：支持 `Tab` 聚焦"阅读更多"链接，`Enter` 跳转
- **ARIA 属性**：链接使用语义化 `<a>` 标签
- **焦点管理**：卡片内容按逻辑顺序排列
