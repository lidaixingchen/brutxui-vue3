---
title: Pricing Section
description: 统一定价区块，支持一次性价格、月付/年付切换、多方案对比和热门方案强调。
---

# Pricing Section 定价区

新粗野主义风格的统一定价区段，包含功能列表、热门方案高亮和可选的月付/年付切换。它既可以展示一次性价格，也可以展示 SaaS 订阅价格；`SaaSPricing` 现在是基于它的兼容封装。

## 预览

<ComponentPreview>
  <PricingSectionDemo />
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block pricing-section
```

## 用法

```vue
<script setup>
import PricingSection from '@/components/ui/pricing-section/PricingSection.vue'

const plans = [
    {
        name: 'Starter',
        priceMonthly: '$0',
        priceAnnually: '$0',
        description: 'For individuals getting started',
        features: [
            { text: '5 components', included: true },
            { text: 'Classic theme', included: true },
            { text: 'Community support', included: true },
            { text: 'Priority updates', included: false },
        ],
        buttonText: 'Get Started',
        buttonVariant: 'outline',
        variant: 'default',
    },
    {
        name: 'Pro',
        priceMonthly: '$19',
        priceAnnually: '$15',
        description: 'For professional developers',
        features: [
            { text: 'All components', included: true },
            { text: 'All themes', included: true },
            { text: 'Priority support', included: true },
            { text: 'CLI tool access', included: true },
        ],
        buttonText: 'Go Pro',
        buttonVariant: 'primary',
        popular: true,
        variant: 'primary',
    },
    {
        name: 'Enterprise',
        priceMonthly: '$49',
        priceAnnually: '$39',
        description: 'For teams and organizations',
        features: [
            { text: 'All components', included: true },
            { text: 'All themes', included: true },
            { text: 'Dedicated support', included: true },
            { text: 'Custom themes', included: true },
            { text: 'SLA guarantee', included: true },
        ],
        buttonText: 'Contact Sales',
        buttonVariant: 'secondary',
        variant: 'secondary',
    },
]
</script>

<template>
    <PricingSection
        title="Unified Brutalist Pricing"
        subtitle="One component for lifetime offers or monthly and annual billing."
        :plans="plans"
        default-billing="monthly"
        popular-text="Best Value"
    />
</template>
```

## BrutalistPricingPlan 类型

```ts
interface PricingFeature {
    text: string
    included?: boolean
}

interface BrutalistPricingPlan {
    name: string
    price?: string
    priceMonthly?: string
    priceAnnually?: string
    description: string
    features: Array<string | PricingFeature>
    ctaText?: string
    buttonText?: string
    popular?: boolean
    variant?: 'primary' | 'secondary' | 'default' | 'interactive' | 'elevated' | 'flat'
    buttonVariant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'
}
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `pricingSection.defaultTitle` |
| `subtitle` | `string` | — |
| `plans` | `BrutalistPricingPlan[]` | `[]` |
| `billingMode` | `'auto' \| 'toggle' \| 'none'` | `'auto'` |
| `modelValue` | `'monthly' \| 'annually'` | — |
| `defaultBilling` | `'monthly' \| 'annually'` | `'monthly'` |
| `popularText` | `string` | locale: `pricingSection.mostPopular` |
| `class` | `string` | — |

## 事件

| 事件 | 参数 |
|------|------|
| `plan-select` | `planName: string` |

## 特性

- **统一计费模式**：`billingMode="auto"` 会在方案包含 `priceMonthly` 或 `priceAnnually` 时自动显示切换按钮
- **一次性价格兼容**：只传 `price` 时不显示计费切换，并使用 lifetime 文案
- **热门徽章**：设置 `popular: true` 的方案会显示强调徽章，可通过 `popularText` 覆盖文案
- **功能状态**：字符串功能默认视为包含；对象功能可通过 `included: false` 显示未包含状态
- **按钮兼容**：支持旧字段 `ctaText`，也支持和 `SaaSPricing` 一致的 `buttonText` / `buttonVariant`
