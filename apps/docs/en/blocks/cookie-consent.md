---
title: Cookie Consent
description: Cookie consent banner block pinned to the bottom of the page with accept and decline buttons.
translated: true
---

# Cookie Consent

A Neo-Brutalist cookie consent banner pinned to the bottom of the page, featuring a cookie icon, title, description, and accept/decline buttons.

## Demo

<ComponentPreview>
  <CookieConsentDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="cookie-consent" />

## Usage

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

## Variants

### Custom Text

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

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `cookieConsent.defaultTitle` | Title text |
| `description` | `string` | locale: `cookieConsent.defaultDescription` | Description text |
| `acceptText` | `string` | locale: `cookieConsent.defaultAcceptText` | Accept button text |
| `declineText` | `string` | locale: `cookieConsent.defaultDeclineText` | Decline button text |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
|------|------|------|
| `accept` | — | Emitted when the accept button is clicked |
| `decline` | — | Emitted when the decline button is clicked |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `actions` | — | Extra action button area |

## Accessibility

- **Keyboard**: Accept/decline buttons support `Tab` focus, `Enter` / `Space` to trigger click
- **ARIA**: Banner uses `role="dialog"` or `role="alertdialog"`; buttons provide clear text labels
- **Focus Management**: When the banner is displayed, focus is automatically locked to the action button area
