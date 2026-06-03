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

## SaaSPricing

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
- `title`/`subtitle`: `string`

```typescript
interface PricingPlan {
  name: string; description: string; priceMonthly: string; priceAnnually: string
  features: { text: string; included: boolean }[]
  buttonText: string; buttonVariant: string; popular?: boolean
}
```

## PricingSection

另一种定价区块，更简洁。

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

- `title`: `string` — 默认 `'Simple, Transparent Brutalist Plans'`
- `subtitle`: `string`
- `plans`: `BrutalistPricingPlan[]`

```typescript
interface BrutalistPricingPlan {
  name: string; price: string; description: string
  features: string[]; ctaText: string
  popular?: boolean; variant: 'primary' | 'secondary' | 'default'
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
