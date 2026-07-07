# 营销与展示区块

## BrutalistHero

```vue
<BrutalistHero
  title="构建大胆的界面"
  subtitle="快速创建新粗野主义风格应用"
  primary-cta-text="开始使用"
  secondary-cta-text="源码"
  @primary-cta="handlePrimary"
  @secondary-cta="handleSecondary"
/>
```

- `title`/`subtitle`: `string`
- `primaryCtaText`/`secondaryCtaText`: `string`
- Events: `primaryCta`, `secondaryCta`

## PricingSection

统一定价区块，优先用于新定价页面。只传 `price` 时展示一次性价格；传 `priceMonthly` / `priceAnnually` 时，`billingMode="auto"` 会自动显示月付/年付切换。

```vue
<PricingSection
  :plans="[{
    name: 'Pro',
    description: '适合专业团队',
    priceMonthly: '¥99', priceAnnually: '¥79',
    features: [
      { text: '所有组件', included: true },
      { text: '专属支持', included: true },
      { text: '私有部署', included: false },
    ],
    popular: true, buttonText: '升级', buttonVariant: 'primary',
  }]"
  title="选择方案"
  subtitle="所有方案包含14天试用"
  popular-text="推荐"
/>
```

- `plans`: `BrutalistPricingPlan[]`
- `title`/`subtitle`: `string`
- `billingMode`: `'auto' | 'toggle' | 'none'` — 默认 `'auto'`
- `modelValue`: `'monthly' | 'annually'` — v-model，受控计费周期
- `defaultBilling`: `'monthly' | 'annually'` — 默认 `'monthly'`，非受控默认值
- `popularText`: `string`
- `@plan-select`: `(planName: string) => void`
- `@update:modelValue`: `(value: 'monthly' | 'annually') => void`

```typescript
interface PricingFeature {
  text: string
  included?: boolean
}

interface BrutalistPricingPlan {
  name: string
  description: string
  price?: string
  priceMonthly?: string
  priceAnnually?: string
  features: Array<string | PricingFeature>
  ctaText?: string
  buttonText?: string
  buttonVariant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'
  popular?: boolean
  variant?: 'primary' | 'secondary' | 'default' | 'interactive' | 'elevated' | 'flat'
}
```

一次性价格示例：

```vue
<PricingSection
  :plans="[{
    name: 'Pro', price: '¥99', description: '专业方案',
    features: ['无限项目', '100GB 存储'],
    ctaText: '升级', popular: true, variant: 'primary',
  }]"
  title="定价方案"
/>
```
