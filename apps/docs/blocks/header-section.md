---
title: Header Section
description: 页面顶部导航栏区块，含 Logo、导航链接、CTA 按钮和移动端抽屉菜单。
---

# Header Section 顶部导航

新粗野主义风格的页面顶部导航栏，包含 Logo 文本、导航链接、CTA 按钮和响应式移动端 Sheet 抽屉菜单。

## 预览

<ComponentPreview>
  <HeaderSectionDemo />
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

## 数据类型

### NavItem

```ts
interface NavItem {
    label: string
    href?: string
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `logoText` | `string` | locale: `headerSection.defaultLogoText` | Logo 显示文本 |
| `navItems` | `NavItem[]` | `[]` | 导航链接项数组 |
| `ctaText` | `string` | locale: `headerSection.defaultCtaText` | CTA 按钮文本 |
| `class` | `string` | — | 自定义 CSS 类名 |

## 事件

| 事件         | 参数               | 说明                                 |
| ------------ | ------------------ | ------------------------------------ |
| `cta-click`  | `[]`               | 点击 CTA 按钮时触发                  |
| `nav-click`  | `[index: number]`  | 点击导航链接时触发，参数为链接索引   |

## 插槽

| 插槽      | 作用域 | 说明               |
| --------- | ------ | ------------------ |
| `header`  | —      | 替换 Logo 区域     |
| `default` | —      | 替换导航链接区域   |
| `footer`  | —      | 替换 CTA 按钮区域  |

## 可访问性

<!-- TODO: 添加可访问性说明 -->
