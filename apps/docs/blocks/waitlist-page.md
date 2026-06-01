---
title: Waitlist Page
description: 候补名单收集页模板，用于新品发布的邮箱预约收集。
---

# Waitlist Page

新粗野主义风格的候补注册页面，包含邮箱输入、CTA 按钮和社交证明指标。

## 预览

<ComponentPreview>
  <div class="w-full max-w-lg mx-auto text-center">
    <div class="inline-flex items-center gap-2 mb-6 bg-brutal-accent px-3 py-1 border-3 border-brutal rotate-[-1deg]">
      <span class="font-black text-sm">Early Access</span>
    </div>
    <h1 class="text-3xl font-black tracking-tight">Join the BrutxUI Waitlist Club</h1>
    <form class="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input class="flex-1 h-11 px-4 py-2 text-base border-3 border-brutal bg-brutal-bg text-brutal-fg font-medium focus:outline-none focus:shadow-brutal" placeholder="you@example.com" />
      <button type="submit" class="px-5 py-2 bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-black tracking-wide active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all">Secure Priority Access</button>
    </form>
    <div class="mt-8 flex items-center justify-center gap-6 text-sm font-bold text-brutal-muted-foreground">
      <div class="flex items-center gap-1">
        <span>1,247 on waitlist</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="h-2 w-2 rounded-full bg-brutal-success animate-pulse"></div>
        <span>Live</span>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block waitlist-page
```

## 用法

```vue
<script setup>
import WaitlistPage from '@/components/ui/waitlist-page/WaitlistPage.vue'

function handleSubmit(email) {
    console.log('Waitlist signup:', email)
}
</script>

<template>
    <WaitlistPage
        title="Join the BrutxUI Waitlist Club"
        description="Be the first to know when we launch. Get early access and exclusive perks."
        cta-text="Secure Priority Access"
        :waitlist-count="1247"
        @submit="handleSubmit"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `waitlistPage.title` |
| `description` | `string` | — |
| `ctaText` | `string` | locale: `waitlistPage.ctaText` |
| `waitlistCount` | `number` | `0` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `submit` | `string`（邮箱地址） |

## 布局

WaitlistPage 包含：
- **徽章**：旋转的强调色徽章，带有 "Early Access" 标签
- **标题**：加粗、字距调整的标题
- **描述**：标题下方的弱化文本
- **邮箱表单**：输入框和 CTA 按钮，响应式行布局
- **社交证明**：候补人数、星级评分和在线指示器
