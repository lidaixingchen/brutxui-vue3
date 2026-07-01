---
title: Pricing Section 定价区
description: 统一定价区块，支持一次性价格、月付/年付切换、多方案对比和热门方案强调。
---

# Pricing Section 定价区

新粗野主义风格的统一定价区段，包含功能列表、热门方案高亮和可选的月付/年付切换。它既可以展示一次性价格，也可以展示 SaaS 订阅价格；传入 `preset="saas"` 可启用内置的 SaaS 三档默认数据。

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

## SaaS 预设

传入 `preset="saas"` 即可使用内置的 SaaS 三档默认数据（Starter / Pro / Enterprise），并自动启用月付/年付切换。该模式下：

- 未传 `title` 时回退到 `pricingSection.saasTitle`（"简单，不妥协的定价"）
- 未传 `popularText` 时回退到 `pricingSection.saasMostPopular`（"最受欢迎"）
- 未传 `billingMode` 时默认 `'toggle'`
- 未传 `plans` 时使用内置三档默认数据；传入 `plans` 时优先使用用户数据

```vue
<script setup>
import PricingSection from '@/components/ui/pricing-section/PricingSection.vue'
</script>

<template>
    <PricingSection preset="saas" />
</template>
```

也可以在 SaaS 预设基础上覆盖任意字段：

```vue
<template>
    <PricingSection
        preset="saas"
        title="自定义标题"
        subtitle="覆盖默认副标题"
        :plans="customPlans"
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
| `preset` | `'saas'` | — | 预设模式，传 `'saas'` 启用内置 SaaS 三档默认数据与回退逻辑 |
| `billingMode` | `'auto' \| 'toggle' \| 'none'` | `'auto'`（`preset='saas'` 时为 `'toggle'`） | 计费模式：auto 自动检测，toggle 强制显示，none 隐藏 |
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
