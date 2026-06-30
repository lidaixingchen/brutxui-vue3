---
title: Waitlist Page
description: Neo-brutalist waitlist signup page with email input, CTA button, and social proof metrics.
translated: true
---

# Waitlist Page

A neo-brutalist waitlist signup page featuring email input, a CTA button, and social proof metrics. Used for collecting email signups before a product launch.

## Demo

<ComponentPreview>
  <WaitlistPageDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="waitlist-page" />

## Usage

```vue
<script setup>
import WaitlistPage from '@/components/ui/waitlist-page/WaitlistPage.vue'

function handleSubmit(email) {
    console.log('Waitlist signup:', email)
}
</script>

<template>
    <WaitlistPage
        title="Join the BrutxUI Waitlist Club"
        description="Be the first to know when we launch. Get early access and exclusive perks."
        cta-text="Secure Priority Access"
        :waitlist-count="1247"
        @submit="handleSubmit"
    />
</template>
```

## Props

### WaitlistPage

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `waitlistPage.title` | Page title |
| `description` | `string` | — | Page description |
| `ctaText` | `string` | locale: `waitlistPage.ctaText` | CTA button text |
| `waitlistCount` | `number` | `0` | Number of people on the waitlist |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
| ---- | ---- | ---- |
| `submit` | `string` (email address) | Triggered when the email is submitted |

## Accessibility

- **Keyboard**: Supports `Tab` to navigate between the input field and button, `Enter` to submit the form
- **ARIA attributes**: Email input uses `aria-label` to provide a label
- **Focus management**: Focus stays on the input field after form submission
