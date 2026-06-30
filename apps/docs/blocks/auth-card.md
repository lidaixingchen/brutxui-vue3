---
title: Auth Card 认证卡片
description: 新粗野主义风格的认证卡片，包含社交登录按钮、邮箱/密码表单和忘记密码链接。
---

# Auth Card 认证卡片

新粗野主义风格的认证卡片，包含社交登录按钮、邮箱/密码表单和忘记密码链接。内置邮箱输入、社交登录按钮及选项卡切换。

## 预览

<ComponentPreview>
  <AuthCardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="auth-card" />

## 用法

```vue
<script setup>
import AuthCard from '@/components/ui/auth-card/AuthCard.vue'

function handleLogin({ email, password }) {
    console.log('Login submitted:', email, password)
}

function handleForgotPassword() {
    console.log('Forgot password clicked')
}

function handleGoogle() {
    console.log('Google auth clicked')
}

function handleGithub() {
    console.log('GitHub auth clicked')
}
</script>

<template>
    <AuthCard
        title="Welcome back"
        description="Sign in to your account to continue"
        @login-submit="handleLogin"
        @forgot-password="handleForgotPassword"
        @google-click="handleGoogle"
        @github-click="handleGithub"
    />
</template>
```

## 数据类型

```ts
interface AuthCardTexts {
    welcomeBack?: string
    signInToContinue?: string
    orEmailLogin?: string
    email?: string
    password?: string
    forgotPassword?: string
    signIn?: string
    noAccount?: string
    signUp?: string
}
```

## Props

### AuthCard

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `authCard.welcomeBack` | 卡片标题 |
| `description` | `string` | locale: `authCard.signInToContinue` | 卡片描述 |
| `texts` | `AuthCardTexts` | `{}` | 自定义文本 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `loginSubmit` | `{ email: string, password: string }` | 登录表单提交时触发 |
| `forgotPassword` | — | 点击忘记密码链接时触发 |
| `googleClick` | — | 点击 Google 登录按钮时触发 |
| `githubClick` | — | 点击 GitHub 登录按钮时触发 |

## 可访问性

- **键盘操作**：支持 `Tab` 在输入框和按钮间导航，`Enter` 提交表单
- **ARIA 属性**：使用 `useId()` 为邮箱和密码输入框生成唯一 ID，与 `<label>` 正确关联
- **焦点管理**：邮箱和密码字段通过 `v-model` 实现双向绑定
