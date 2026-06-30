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
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
| ---- | ---- | ---- |
| `loginSubmit` | `{ email: string, password: string }` | Emitted when the login form is submitted |
| `forgotPassword` | — | Emitted when the forgot password link is clicked |
| `googleClick` | — | Emitted when the Google login button is clicked |
| `githubClick` | — | Emitted when the GitHub login button is clicked |

## Accessibility

- **Keyboard**: Supports `Tab` to navigate between inputs and buttons, `Enter` to submit the form
- **ARIA**: Uses `useId()` to generate unique IDs for email and password inputs, correctly associated with `<label>` elements
- **Focus Management**: Email and password fields use `v-model` for two-way binding
