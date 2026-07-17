# 布局与导航区块

## HeaderSection

```vue
<HeaderSection
  :nav-items="[{ label: '首页', href: '/' }, { label: '文档', href: '/docs' }]"
  logo-text="BrutxUI" cta-text="注册"
  @cta-click="handleCta" @nav-click="handleNav"
/>
```

- `navItems`: `NavItem[]` — `{ label: string; href?: string }[]`
- `logoText`: `string`
- `ctaText`: `string`
- Events: `ctaClick()`, `navClick(index)`
- Slots: `header`, `default`, `footer`

## FooterSection

```vue
<FooterSection
  logo-text="BrutxUI" description="构建大胆的界面"
  :link-groups="[{ title: '产品', links: [{ label: '组件', href: '/components' }] }]"
  copyright="© 2024 BrutxUI"
  @link-click="handleLinkClick"
/>
```

- `logoText`/`description`/`copyright`: `string`
- `linkGroups`: `FooterLinkGroup[]` — `{ title: string; links: FooterLink[] }[]`
- `FooterLink`: `{ label: string; href?: string }`
- Events: `linkClick({ groupIndex, linkIndex })`
- Slots: `header`, `default`, `footer`

## DashboardShell

仪表盘外壳，含侧边栏和顶栏。

```vue
<DashboardShell user-email="user@example.com" @sign-out="handleSignOut">
  <template #sidebar><nav>侧边栏</nav></template>
  <template #header><span>标题</span></template>
  <template #default><h1>内容</h1></template>
</DashboardShell>
```

- `userEmail`: `string`
- Events: `signOut`
- Slots: `sidebar`, `header`, `default`

## Tabs (tabs prop 数据驱动模式)

```vue
<Tabs
  :tabs="[{ label: '概览', value: 'overview' }, { label: '设置', value: 'settings' }]"
  model-value="overview"
/>
```

- `tabs`: `TabItem[]` — `{ label: string; value: string }[]`，传入时自动渲染 TabsList/TabsTrigger/TabsContent
- `modelValue`: `string` — v-model，当前激活标签（未传时回退到首个 tab）
- Slots: `header`, `default`（替代默认 Card 内容）, `footer`
- 未传入 `tabs` 属性时，支持通过子组件插槽进行灵活的组合式自定义渲染
