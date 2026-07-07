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

## LoadingPage

```vue
<LoadingPage title="加载中..." description="请稍候" :progress="60" />
```

- `title`/`description`: `string`
- `progress`: `number` — 0-100，传入时显示进度条
- Slots: `header`, `default`, `footer`
