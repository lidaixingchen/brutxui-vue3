---
title: Auth Card
description: Neo-Brutalist authentication card with social login buttons, email/password form, and forgot password link.
translated: true
---

# Auth Card

A Neo-Brutalist authentication card featuring social login buttons, an email/password form, and a forgot password link. Includes built-in email input, social login buttons, and tab switching.

## Demo

<ComponentPreview>
  <AuthCardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="auth-card" />

## Usage

```vue
<script setup>
import AuthCard from '@/components/ui/auth-card/AuthCard.vue'

async function handleLogin({ email, password }) {
    // Security constraint: `password` is plaintext. Submit only over HTTPS,
    // and never log it or send it to analytics or devtools.
    await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
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

## Data Types

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

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `authCard.welcomeBack` | Card title |
| `description` | `string` | locale: `authCard.signInToContinue` | Card description |
| `texts` | `AuthCardTexts` | `{}` | Custom text overrides |
| `submitting` | `boolean` | `false` | Set to `true` during async submission: disables submit/social buttons and prevents duplicate triggers |
| `passwordMinLength` | `number` | `6` | Minimum password length; override when it differs from your backend policy |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
| ---- | ---- | ---- |
| `loginSubmit` | `{ email: string, password: string }` | Emitted when the login form is submitted |
| `forgotPassword` | — | Emitted when the forgot password link is clicked |
| `googleClick` | — | Emitted when the Google login button is clicked |
| `githubClick` | — | Emitted when the GitHub login button is clicked |

> **Security constraint**: the `login-submit` payload carries a plaintext password. Submit only over HTTPS, and never log this payload or send it to analytics or devtools.

## Accessibility

- **Keyboard**: Supports `Tab` to navigate between inputs and buttons, `Enter` to submit the form
- **ARIA**: Uses `useId()` to generate unique IDs for email and password inputs, correctly associated with `<label>` elements
- **Focus Management**: Email and password fields use `v-model` for two-way binding
