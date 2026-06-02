---
title: SaaS Pricing
description: SaaS 风格定价区块，支持月付/年付切换和多方案对比。
---

# SaaS Pricing

新粗野主义风格的 SaaS 定价表，包含月付/年付切换、热门方案高亮和功能列表。

## 预览

<ComponentPreview>
  <div class="w-full max-w-5xl mx-auto text-center">
    <h2 class="text-3xl font-black tracking-tight">Simple, Unapologetic Pricing</h2>
    <div class="mt-4 inline-flex items-center gap-3 border-3 border-brutal bg-brutal-muted p-1">
      <button class="px-4 py-2 font-black text-sm bg-brutal-accent text-brutal-fg shadow-brutal-sm">Monthly</button>
      <button class="px-4 py-2 font-black text-sm text-brutal-muted-foreground">Annually</button>
    </div>
    <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
      <div class="border-3 border-brutal bg-brutal-bg shadow-brutal p-5">
        <div class="pb-2"><h3 class="text-xl font-black">Starter</h3><p class="text-sm text-brutal-muted-foreground">For side projects</p></div>
        <div class="pt-2"><span class="text-4xl font-black">$0</span><span class="text-sm font-bold text-brutal-muted-foreground">/mo</span></div>
      </div>
      <div class="relative border-3 border-brutal bg-brutal-bg shadow-brutal-lg p-5 scale-105">
        <div class="pb-2"><h3 class="text-xl font-black">Pro</h3><p class="text-sm text-brutal-muted-foreground">For professionals</p></div>
        <div class="pt-2"><span class="text-4xl font-black">$19</span><span class="text-sm font-bold text-brutal-muted-foreground">/mo</span></div>
      </div>
      <div class="border-3 border-brutal bg-brutal-bg shadow-brutal p-5">
        <div class="pb-2"><h3 class="text-xl font-black">Enterprise</h3><p class="text-sm text-brutal-muted-foreground">For teams</p></div>
        <div class="pt-2"><span class="text-4xl font-black">$49</span><span class="text-sm font-bold text-brutal-muted-foreground">/mo</span></div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block saas-pricing
```

## 用法

```vue
<script setup>
import SaaSPricing from '@/components/ui/saas-pricing/SaaSPricing.vue'

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
        :plans="plans"
    />
</template>
```

## PricingPlan 类型

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

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | `'Simple, Unapologetic Pricing'` |
| `subtitle` | `string` | — |
| `plans` | `PricingPlan[]` | 内置 3 个方案 |
| `class` | `string` | — |

## 特性

- **月付/年付切换**：内置计费周期切换按钮
- **热门徽章**：设置了 `popular: true` 的方案会显示脉冲徽章和放大效果
- **功能勾选图标**：已包含功能显示绿色勾选，未包含功能显示灰色问号
- **卡片变体**：热门方案使用 `interactive` 变体，其他使用 `default` 变体
