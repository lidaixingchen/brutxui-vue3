---
title: Cookie Consent
description: Cookie 同意横幅区块，固定在页面底部，带有接受和拒绝按钮。
---

# Cookie Consent Cookie 同意

新粗野主义风格的 Cookie 同意横幅，固定在页面底部，包含 Cookie 图标、标题、描述以及接受/拒绝按钮。

## 预览

<ComponentPreview>
  <CookieConsentDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="cookie-consent" />

## 用法

```vue
<script setup>
import CookieConsent from '@/components/ui/cookie-consent/CookieConsent.vue'

function handleAccept() {
    console.log('Cookies accepted')
}

function handleDecline() {
    console.log('Cookies declined')
}
</script>

<template>
    <CookieConsent
        title="We use cookies"
        description="By continuing, you agree to our cookie policy."
        accept-text="Accept"
        decline-text="Decline"
        @accept="handleAccept"
        @decline="handleDecline"
    />
</template>
```

## 变体

### 自定义文本

```vue
<script setup>
import CookieConsent from '@/components/ui/cookie-consent/CookieConsent.vue'
</script>

<template>
    <CookieConsent
        title="This site uses cookies"
        description="We use cookies to improve your experience and analyze traffic."
        accept-text="Got it!"
        decline-text="No thanks"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `cookieConsent.defaultTitle` | 标题文本 |
| `description` | `string` | locale: `cookieConsent.defaultDescription` | 描述文本 |
| `acceptText` | `string` | locale: `cookieConsent.defaultAcceptText` | 接受按钮文本 |
| `declineText` | `string` | locale: `cookieConsent.defaultDeclineText` | 拒绝按钮文本 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `accept` | — | 点击接受按钮时触发 |
| `decline` | — | 点击拒绝按钮时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `actions` | — | 额外操作按钮区域 |

## 可访问性

- **键盘操作**：接受/拒绝按钮支持 `Tab` 聚焦，`Enter` / `Space` 触发点击
- **ARIA 属性**：横幅使用 `role="dialog"` 或 `role="alertdialog"`，按钮提供明确的文本标签
- **焦点管理**：横幅显示时焦点自动锁定在操作按钮区域
