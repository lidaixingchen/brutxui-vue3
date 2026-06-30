# 页面模板

## AuthCard

登录/注册卡片，内置国际化文案，通过 `useLocale()` 自动适配语言。

```vue
<AuthCard
  title="欢迎回来"
  description="登录以继续"
  @login-submit="handleLogin"
  @forgot-password="handleForgotPassword"
  @google-click="handleGoogle"
  @github-click="handleGithub"
/>
```

- `title`/`description`: `string`
- `texts`: `Partial<AuthCardTexts>` — 批量覆盖内置文案

```typescript
interface AuthCardTexts {
  welcomeBack?: string; signInToContinue?: string; orEmailLogin?: string
  email?: string; password?: string; forgotPassword?: string
  signIn?: string; noAccount?: string; signUp?: string
}
```

- Events: `loginSubmit({ email, password })`, `forgotPassword()`, `googleClick()`, `githubClick()`

## ProfilePage

```vue
<ProfilePage title="个人资料" name="张三" email="zhang@example.com" bio="全栈开发者" @save="handleSave" />
```

- `title`/`name`/`email`/`bio`: `string`
- Events: `save({ name, email, bio })`
- Slots: `header`, `default`, `footer`

## SettingsPage

带标签切换的设置页面。

```vue
<SettingsPage
  v-model="activeTab"
  title="设置"
  :tabs="[{ label: '通用', value: 'general' }, { label: '安全', value: 'security' }]"
  default-tab="general"
  @save="handleSave"
/>
```

- `title`: `string`
- `tabs`: `SettingsTab[]` — `{ label: string; value: string }[]`
- `modelValue`: `string` — v-model，当前激活的标签页
- `defaultTab`: `string` — 非受控默认标签页
- Events: `save({ tab, values })`
- Slots: `header`, `default`, `footer`, `tab-{value}({ values, setValue })` — 自定义标签页内容

## WaitlistPage

预发布等待名单页。

```vue
<WaitlistPage title="即将推出" description="留下邮箱获取通知" cta-text="加入" :waitlist-count="1234" @submit="handleSubmit" />
```

- `title`/`description`/`ctaText`: `string`
- `waitlistCount`: `number` — 默认 `0`
- Events: `submit(email)`

## NotFoundPage

```vue
<NotFoundPage title="页面未找到" description="您访问的页面不存在" back-text="返回首页" @back="handleBack" />
```

- `title`/`description`/`backText`: `string`
- Events: `back()`
- Slots: `header`, `default`, `footer`

## LoadingPage

```vue
<LoadingPage title="加载中..." description="请稍候" :progress="60" />
```

- `title`/`description`: `string`
- `progress`: `number` — 0-100，传入时显示进度条
- Slots: `header`, `default`, `footer`
