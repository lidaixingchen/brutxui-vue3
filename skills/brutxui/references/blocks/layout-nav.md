# 布局与导航区块

## HeaderSection

```vue
<HeaderSection
  :nav-items="[{ text: '首页', href: '/' }, { text: '文档', href: '/docs' }]"
  logo-text="BrutxUI" logo-href="/"
/>
```

- `navItems`: `NavItem[]` — `{ text: string; href: string }[]`
- `logoText`: `string`
- `logoHref`: `string`

## FooterSection

```vue
<FooterSection
  :links="[{ title: '产品', items: [{ text: '组件', href: '/components' }] }]"
  copyright="© 2024 BrutxUI"
/>
```

- `links`: `FooterLinkGroup[]` — `{ title: string; items: { text: string; href: string }[] }[]`
- `copyright`: `string`

## DashboardShell

仪表盘外壳，含侧边栏和顶栏。

```vue
<DashboardShell user-email="user@example.com" @sign-out="handleSignOut">
  <template #sidebar><nav>侧边栏</nav></template>
  <template #default><h1>内容</h1></template>
</DashboardShell>
```

- `userEmail`: `string` — 默认 `'user@example.com'`
- Events: `signOut`

## TabsNav

```vue
<TabsNav
  :tabs="[{ label: '概览', value: 'overview' }, { label: '设置', value: 'settings' }]"
  default-value="overview"
/>
```

- `tabs`: `TabItem[]` — `{ label: string; value: string }[]`
- `defaultValue`: `string`
