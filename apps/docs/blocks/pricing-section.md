---
title: Pricing Section 定价区
description: 统一定价区块，支持一次性价格、月付/年付切换、多方案对比和热门方案强调。
---

# Pricing Section 定价区

新粗野主义风格的统一定价区段，包含功能列表、热门方案高亮和可选的月付/年付切换。它既可以展示一次性价格，也可以展示 SaaS 订阅价格；`SaaSPricing` 现在是基于它的兼容封装。

## 预览

<ComponentPreview>
  <PricingSectionDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="pricing-section" />

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

## 数据类型

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

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `pricingSection.defaultTitle` | 标题文本 |
| `subtitle` | `string` | — | 副标题文本 |
| `plans` | `BrutalistPricingPlan[]` | `[]` | 定价方案列表 |
| `billingMode` | `'auto' \| 'toggle' \| 'none'` | `'auto'` | 计费模式：auto 自动检测，toggle 强制显示，none 隐藏 |
| `modelValue` | `'monthly' \| 'annually'` | — | 当前选中的计费周期（v-model） |
| `defaultBilling` | `'monthly' \| 'annually'` | `'monthly'` | 默认计费周期 |
| `popularText` | `string` | locale: `pricingSection.mostPopular` | 热门方案徽章文本 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `plan-select` | `planName: string` | 选择方案时触发，参数为方案名称 |

## 可访问性

- **键盘操作**：支持 `Tab` 在方案卡片和按钮间导航，`Enter` / `Space` 触发按钮操作
- **ARIA 属性**：切换按钮使用 `aria-pressed` 状态，热门方案使用 `aria-label` 提示
- **焦点管理**：焦点顺序遵循文档流，按钮获得焦点时显示可见的焦点指示器
