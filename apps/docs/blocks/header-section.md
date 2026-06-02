---
title: Header Section
description: 页面顶部导航栏区块，含 Logo、导航链接、CTA 按钮和移动端抽屉菜单。
---

# Header Section

新粗野主义风格的页面顶部导航栏，包含 Logo 文本、导航链接、CTA 按钮和响应式移动端 Sheet 抽屉菜单。

## 预览

<ComponentPreview>
  <div class="w-full bg-brutal-bg border-3 border-b border-brutal shadow-brutal-sm">
    <div class="flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
      <span class="text-xl font-black tracking-tight text-brutal-fg">BrutxUI</span>
      <nav class="hidden md:flex items-center gap-1">
        <button class="px-3 py-1.5 font-bold text-sm bg-transparent text-brutal-fg hover:bg-brutal-fg hover:text-brutal-bg transition-all">Features</button>
        <button class="px-3 py-1.5 font-bold text-sm bg-transparent text-brutal-fg hover:bg-brutal-fg hover:text-brutal-bg transition-all">Pricing</button>
        <button class="px-3 py-1.5 font-bold text-sm bg-transparent text-brutal-fg hover:bg-brutal-fg hover:text-brutal-bg transition-all">Docs</button>
      </nav>
      <div class="flex items-center gap-3">
        <button class="hidden md:inline-flex px-4 py-2 bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-black text-sm active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all">Get Started</button>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block header-section
```

## 用法

```vue
<script setup>
import HeaderSection from '@/components/ui/header-section/HeaderSection.vue'

const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: '/docs' },
]

function handleCta() {
    console.log('CTA clicked')
}

function handleNav(index) {
    console.log('Nav item clicked:', navItems[index].label)
}
</script>

<template>
    <HeaderSection
        logo-text="MyApp"
        :nav-items="navItems"
        cta-text="Sign Up"
        @cta-click="handleCta"
        @nav-click="handleNav"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `logoText` | `string` | locale: `headerSection.defaultLogoText` |
| `navItems` | `NavItem[]` | `[]` |
| `ctaText` | `string` | locale: `headerSection.defaultCtaText` |
| `class` | `string` | — |

### NavItem 类型

```ts
interface NavItem {
    label: string
    href?: string
}
```

## 事件

| 事件 | 载荷 |
|------|------|
| `cta-click` | `[]` |
| `nav-click` | `[index: number]` |

## Slots

| Slot | 用途 |
|------|------|
| `header` | 替换 Logo 区域 |
| `default` | 替换导航链接区域 |
| `footer` | 替换 CTA 按钮区域 |

## 布局

HeaderSection 包含：
- **Logo**：加粗、字距调整的品牌文本
- **导航链接**：ghost 变体按钮，桌面端水平排列
- **CTA 按钮**：primary 变体，桌面端显示
- **移动端菜单**：outline 变体汉堡按钮，点击打开 Sheet 抽屉
