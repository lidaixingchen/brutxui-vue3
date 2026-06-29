# 营销与展示区块

## BrutalistHero

```vue
<BrutalistHero
  title="构建大胆的界面"
  subtitle="快速创建新粗野主义风格应用"
  primary-action-text="开始使用" primary-action-href="/docs"
  secondary-action-text="源码" secondary-action-href="https://github.com/..."
/>
```

- `title`/`subtitle`: `string`
- `primaryActionText`/`primaryActionHref`: `string`
- `secondaryActionText`/`secondaryActionHref`: `string`

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

## SaaSPricing

`PricingSection` 的 SaaS 兼容封装，保留原有 API，并固定启用月付/年付切换。继续维护旧调用时使用它；新功能优先落到 `PricingSection`。

```vue
<SaaSPricing
  :plans="[{
    name: 'Pro', description: '适合专业团队',
    priceMonthly: '¥99', priceAnnually: '¥79',
    features: [{ text: '所有组件', included: true }],
    popular: true, buttonText: '升级', buttonVariant: 'primary',
  }]"
  title="选择方案" subtitle="所有方案包含14天试用"
/>
```

- `plans`: `PricingPlan[]`
- `subtitle`: `string`
- `title`: `string`
- `@plan-select`: `(planName: string) => void`

```typescript
interface PricingPlan {
  name: string
  description: string
  priceMonthly: string
  priceAnnually: string
  features: { text: string; included?: boolean }[]
  buttonText: string
  buttonVariant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost' | 'link'
  popular?: boolean
}
```

## TestimonialCard

```vue
<TestimonialCard quote="组件库太棒了！" author="张三" role="前端开发者" />
```

- `quote`/`author`/`role`: `string`

## BlogCard

```vue
<BlogCard title="Vue 3 最佳实践" excerpt="学习组合式 API..." date="2024-01-15" tag="Vue" href="/blog/vue3" />
```

- `title`/`excerpt`/`date`/`tag`/`href`: `string`

## BlogListPage

```vue
<BlogListPage
  title="博客"
  :posts="[{ title: '文章', excerpt: '摘要', author: '作者', date: '2024-01-15', category: 'Vue', slug: 'article' }]"
  :categories="['Vue', 'CSS']" :page-size="6"
/>
```

- `title`: `string`
- `posts`: `BlogPost[]` — `{ title: string; excerpt: string; author: string; date: string; category: string; slug: string }[]`
- `categories`: `string[]`
- `pageSize`: `number` — 默认 `6`

## GallerySection

```vue
<GallerySection title="项目展示" :items="[{ src: '/img/1.jpg', alt: '项目 1', caption: '描述' }]" />
```

- `title`: `string`
- `items`: `GalleryItem[]` — `{ src: string; alt: string; caption?: string }[]`

## FaqSection

```vue
<FaqSection
  :faqs="[{ question: '支持哪些框架？', answer: 'Vue 3。' }]"
  title="常见问题" subtitle="找到答案"
/>
```

- `faqs`: `FaqItem[]` — `{ question: string; answer: string }[]`
- `title`/`subtitle`: `string`
