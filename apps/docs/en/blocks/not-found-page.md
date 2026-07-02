---
title: Not Found Page
description: 404 error page section with glitch text effect and back button.
translated: true
---

# Not Found Page

A neo-brutalist 404 page featuring GlitchText effect, decorative squares, and a back-to-home button.

## Demo

<ComponentPreview>
  <NotFoundPageDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="not-found-page" />

## Usage

### Basic Usage

```vue
<script setup>
import NotFoundPage from '@/components/ui/not-found-page/NotFoundPage.vue'

function handleBack() {
    window.location.href = '/'
}
</script>

<template>
    <NotFoundPage
        title="Page Not Found"
        description="The page you visited does not exist or has been removed."
        back-text="Back to Home"
        @back="handleBack"
    />
</template>
```

### Custom Text

```vue
<script setup>
import { useRouter } from 'vue-router'
import NotFoundPage from '@/components/ui/not-found-page/NotFoundPage.vue'
const router = useRouter()
</script>

<template>
    <NotFoundPage
        title="Oops!"
        description="Something went wrong."
        back-text="Take me home"
        @back="() => router.push('/')"
    />
</template>
```

## Props

|Prop|Type|Default|Description|
|---|---|---|---|
|`title`|`string`|locale: `notFoundPage.defaultTitle`|Page title text|
|`description`|`string`|locale: `notFoundPage.defaultDescription`|Page description text|
|`backText`|`string`|locale: `notFoundPage.defaultBackText`|Back button text|
|`class`|`string`|—|Custom CSS class name|

## Events

|Event|Payload|Description|
|---|---|---|
|`back`|—|Triggered when the back button is clicked|

## Slots

|Slot|Scope|Description|
|---|---|---|
|`header`|—|Replace/extend the section header|
|`default`|—|Replace the section body content|
|`footer`|—|Replace/extend the section footer|

## Accessibility

- The page title uses `<h1>` to preserve a correct document outline
- The decorative GlitchText "404" animation runs via `autoplay`, requires no user interaction, and is not exposed as a focusable element
- The back button is a semantic `<button>`, keyboard-focusable and activatable with `Enter` / `Space`
- The container uses `min-h-screen` to keep content centered, avoiding small-screen accessibility issues tied to viewport scrolling
