---
title: Brutalist Hero 英雄区
description: 新粗野主义风格的 Hero 区段，适用于落地页，包含标题、副标题、CTA 按钮和装饰性代码预览卡片。
---

# Brutalist Hero 英雄区

新粗野主义风格的 Hero 区段，适用于落地页，包含标题、副标题、CTA 按钮和装饰性代码预览卡片。

## 预览

<ComponentPreview>
  <BrutalistHeroDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="brutalist-hero" />

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

### BrutalistHero

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `brutalistHero.title` | 标题文本 |
| `subtitle` | `string` | — | 副标题文本 |
| `primaryCtaText` | `string` | locale: `brutalistHero.primaryCtaText` | 主 CTA 按钮文本 |
| `secondaryCtaText` | `string` | locale: `brutalistHero.secondaryCtaText` | 次 CTA 按钮文本 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `primaryCta` | — | 点击主 CTA 按钮时触发 |
| `secondaryCta` | — | 点击次 CTA 按钮时触发 |

## 可访问性

- **键盘操作**：支持 `Tab` 在按钮间导航，`Enter` 触发操作
- **ARIA 属性**：按钮使用语义化 `<button>` 标签
- **焦点管理**：按钮按逻辑顺序排列
