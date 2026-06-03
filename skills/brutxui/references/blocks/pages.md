# 页面模板

## AuthCard

登录/注册卡片，内置国际化文案。

```vue
<AuthCard />
```

通过 `useLocale()` 自动适配语言，无需传参。

## ProfilePage

```vue
<ProfilePage title="个人资料" name="张三" email="zhang@example.com" bio="全栈开发者" />
```

- `title`/`name`/`email`/`bio`: `string`

## SettingsPage

带标签切换的设置页面。

```vue
<SettingsPage
  title="设置"
  :tabs="[{ label: '通用', value: 'general' }, { label: '安全', value: 'security' }]"
  default-tab="general"
/>
```

- `title`: `string`
- `tabs`: `SettingsTab[]` — `{ label: string; value: string }[]`
- `defaultTab`: `string`

## WaitlistPage

预发布等待名单页。

```vue
<WaitlistPage title="即将推出" description="留下邮箱获取通知" cta-text="加入" :waitlist-count="1234" />
```

- `title`/`description`/`ctaText`: `string`
- `waitlistCount`: `number` — 默认 `0`

## NotFoundPage

```vue
<NotFoundPage title="页面未找到" description="您访问的页面不存在" back-text="返回首页" />
```

- `title`/`description`/`backText`: `string`

## LoadingPage

```vue
<LoadingPage title="加载中..." description="请稍候" :progress="60" />
```

- `title`/`description`: `string`
- `progress`: `number`
