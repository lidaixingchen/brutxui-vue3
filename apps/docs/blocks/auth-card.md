---
title: Auth Card
description: 用户认证登录卡片，内置邮箱输入、社交登录按钮及选项卡切换。
---

# Auth Card

新粗野主义风格的认证卡片，包含社交登录按钮、邮箱/密码表单和忘记密码链接。

## 预览

<ComponentPreview>
  <div class="w-full max-w-md mx-auto border-3 border-brutal bg-brutal-bg shadow-brutal">
    <div class="p-5 pb-2">
      <h2 class="text-2xl font-black">Welcome back</h2>
      <p class="text-sm text-brutal-muted-foreground">Sign in to your account to continue</p>
    </div>
    <div class="p-5 pt-2">
      <div class="grid grid-cols-2 gap-3 mb-6">
        <button class="px-4 py-2 border-3 border-brutal shadow-brutal font-bold text-sm bg-transparent text-brutal-fg hover:bg-brutal-fg hover:text-brutal-bg transition-all">Google</button>
        <button class="px-4 py-2 border-3 border-brutal shadow-brutal font-bold text-sm bg-transparent text-brutal-fg hover:bg-brutal-fg hover:text-brutal-bg transition-all">GitHub</button>
      </div>
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t-3 border-brutal"></div></div>
        <div class="relative flex justify-center text-xs"><span class="bg-brutal-bg px-2 font-bold text-gray-500">or email login</span></div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block auth-card
```

## 用法

```vue
<script setup>
import AuthCard from '@/components/ui/auth-card/AuthCard.vue'

function handleLogin() {
    console.log('Login submitted')
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

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `authCard.welcomeBack` |
| `description` | `string` | locale: `authCard.signInToContinue` |
| `texts` | `AuthCardTexts` | `{}` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `loginSubmit` | `[]` |
| `forgotPassword` | `[]` |
| `googleClick` | `[]` |
| `githubClick` | `[]` |

## 布局

AuthCard 包含：
- **头部**：标题和描述
- **社交按钮**：Google 和 GitHub，2 列网格布局
- **分隔线**："or email login" 分隔符
- **邮箱表单**：带图标的邮箱输入框、带图标的密码输入框、忘记密码链接
- **提交按钮**：primary 变体，全宽
- **底部**：注册链接
