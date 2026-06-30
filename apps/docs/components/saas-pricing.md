---
title: SaaS Pricing 定价
description: SaaS 定价组件，基于 PricingSection 的兼容封装，包含周期切换和方案功能清单对比。
---

# SaaS Pricing 定价

新粗野主义风格的 SaaS 定价区块，支持月付/年付切换和功能对比。它现在是 `PricingSection` 的 SaaS 预设封装，保留原有 `SaaSPricing` API；如果需要一次性价格、自动计费模式或自定义热门文案，请使用 [Pricing Section](/blocks/pricing-section)。

- **兼容封装**：内部复用 `PricingSection`，适合继续使用现有 `SaaSPricing` 调用方式
- **计费切换**：在月付和年付定价之间切换
- **热门标记**：设置 `popular: true` 的套餐会获得热门徽章和高亮效果
- **功能勾选**：包含的功能显示绿色勾选，不包含的功能显示灰色图标和删除线

## 预览

<ComponentPreview>
  <SaaSPricingDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="saas-pricing" />

CLI 会自动带上内部依赖。手动复制源码时，请同时复制 `saas-pricing` 与 `pricing-section` 目录。

## 用法

```vue
<script setup>
import { SaaSPricing } from 'brutx-ui-vue'

const plans = [
    {
        name: 'Starter',
        description: 'For side projects and experiments',
        priceMonthly: '$0',
        priceAnnually: '$0',
        features: [
            { text: '5 components', included: true },
            { text: 'Basic themes', included: true },
            { text: 'Community support', included: true },
            { text: 'Priority updates', included: false },
        ],
        buttonText: 'Get Started',
        buttonVariant: 'outline',
    },
    {
        name: 'Pro',
        description: 'For professional developers',
        priceMonthly: '$19',
        priceAnnually: '$15',
        features: [
            { text: 'All components', included: true },
            { text: 'All themes', included: true },
            { text: 'Priority support', included: true },
            { text: 'Priority updates', included: true },
        ],
        popular: true,
        buttonText: 'Go Pro',
        buttonVariant: 'primary',
    },
    {
        name: 'Enterprise',
        description: 'For teams and organizations',
        priceMonthly: '$49',
        priceAnnually: '$39',
        features: [
            { text: 'All components', included: true },
            { text: 'All themes', included: true },
            { text: 'Dedicated support', included: true },
            { text: 'Custom themes', included: true },
        ],
        buttonText: 'Contact Sales',
        buttonVariant: 'secondary',
    },
]
</script>

<template>
    <SaaSPricing
        title="Simple, Unapologetic Pricing"
        subtitle="Choose the plan that fits your needs"
        :plans="plans"
    />
</template>
```

## 数据类型

```ts
interface PricingFeature {
    text: string
    included: boolean
}

interface PricingPlan {
    name: string
    description: string
    priceMonthly: string
    priceAnnually: string
    features: PricingFeature[]
    popular?: boolean
    buttonText: string
    buttonVariant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `plans` | `PricingPlan[]` | 默认 3 个套餐 | 定价方案列表，不传时使用内置默认套餐 |
| `title` | `string` | `locale: saasPricing.title` | 标题文本 |
| `subtitle` | `string` | `''` | 副标题文本 |
| `class` | `string` | — | 自定义 CSS 类名 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `plan-select` | `planName: string` | 选择套餐时触发 |
