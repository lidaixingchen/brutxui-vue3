---
title: Footer Section
description: 页面底部信息栏区块，含 Logo、描述、链接组和版权声明。
---

# Footer Section 底部信息栏

新粗野主义风格的页面底部信息栏，包含 Logo 文本、描述、链接组和版权声明。

## 预览

<ComponentPreview>
  <FooterSectionDemo />
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block footer-section
```

## 用法

```vue
<script setup>
import FooterSection from '@/components/ui/footer-section/FooterSection.vue'

const linkGroups = [
    {
        title: 'Product',
        links: [
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About', href: '/about' },
            { label: 'Blog', href: '/blog' },
        ],
    },
    {
        title: 'Support',
        links: [
            { label: 'Help Center', href: '/help' },
            { label: 'Contact', href: '/contact' },
        ],
    },
]

function handleLinkClick({ groupIndex, linkIndex }) {
    console.log('Link clicked:', linkGroups[groupIndex].links[linkIndex].label)
}
</script>

<template>
    <FooterSection
        logo-text="MyApp"
        description="Build bold interfaces faster."
        :link-groups="linkGroups"
        copyright="© 2026 MyApp. All rights reserved."
        @link-click="handleLinkClick"
    />
</template>
```

## 数据类型

```ts
interface FooterLinkGroup {
    title: string
    links: FooterLink[]
}

interface FooterLink {
    label: string
    href?: string
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `logoText` | `string` | locale: `footerSection.defaultLogoText` | Logo 文本 |
| `description` | `string` | locale: `footerSection.defaultDescription` | 描述文本 |
| `linkGroups` | `FooterLinkGroup[]` | `[]` | 链接组数据 |
| `copyright` | `string` | locale: `footerSection.defaultCopyright` | 版权声明文本 |
| `class` | `string` | — | 自定义类名 |

## 事件

| 事件         | 参数                                        | 说明               |
| ------------ | ------------------------------------------- | ------------------ |
| `link-click` | `{ groupIndex: number; linkIndex: number }` | 链接被点击时触发   |

## 插槽

| 插槽      | 作用域 | 说明                 |
| --------- | ------ | -------------------- |
| `header`  | —      | 替换 Logo 和描述区域 |
| `default` | —      | 替换链接组区域       |
| `footer`  | —      | 替换版权声明区域     |

## 可访问性

<!-- TODO: 添加可访问性说明 -->
