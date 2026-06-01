---
title: Brutalist Hero
description: 新粗野主义落地页 Hero 区段模板，包含标题、CTA 和装饰性卡片。
---

# Brutalist Hero

新粗野主义风格的 Hero 区段，适用于落地页，包含标题、副标题、CTA 按钮和装饰性代码预览卡片。

## 预览

<ComponentPreview>
  <div class="w-full">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <div class="inline-flex items-center gap-2 mb-6 bg-brutal-accent px-3 py-1 border-2 border-brutal rotate-[-1deg]">
          <span class="font-black text-sm">Neo-Brutalism UI</span>
        </div>
        <h1 class="text-4xl font-black tracking-tight leading-tight">Build Bold Interfaces Faster with BrutxUI</h1>
        <div class="mt-8 flex flex-wrap gap-4">
          <button class="px-8 py-3 text-lg bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-black tracking-wide hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all">Get Started Now</button>
          <button class="px-8 py-3 text-lg bg-transparent text-brutal-fg border-3 border-brutal shadow-brutal font-black tracking-wide hover:bg-brutal-fg hover:text-brutal-bg hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all">View Components</button>
        </div>
      </div>
      <div class="relative">
        <div class="absolute inset-0 bg-brutal-primary border-3 border-brutal translate-x-3 translate-y-3"></div>
        <div class="relative border-3 border-brutal bg-brutal-bg p-5 font-mono text-sm shadow-brutal">
          <p class="text-brutal-muted-foreground">$ npx brutx init</p>
          <p class="text-brutal-success font-bold">Project initialized</p>
        </div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx@latest add --block brutalist-hero
```

## 用法

```vue
<script setup>
import BrutalistHero from '@/components/ui/brutalist-hero/BrutalistHero.vue'

function handlePrimary() {
    console.log('Primary CTA clicked')
}

function handleSecondary() {
    console.log('Secondary CTA clicked')
}
</script>

<template>
    <BrutalistHero
        title="Build Bold Interfaces Faster with BrutxUI"
        subtitle="A Neo-Brutalism component library for Vue 3. Bold borders, hard shadows, zero apologies."
        primary-cta-text="Get Started Now"
        secondary-cta-text="View Component Registry"
        @primary-cta="handlePrimary"
        @secondary-cta="handleSecondary"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | `'Build Bold Interfaces Faster with BrutxUI'` |
| `subtitle` | `string` | — |
| `primaryCtaText` | `string` | `'Get Started Now'` |
| `secondaryCtaText` | `string` | `'View Component Registry'` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `primaryCta` | `[]` |
| `secondaryCta` | `[]` |

## 布局

Hero 使用双列网格布局：
- **左列**：徽章、标题、副标题和 CTA 按钮
- **右列**：带有偏移阴影和代码预览的装饰性卡片
- 在移动端，列会垂直堆叠
