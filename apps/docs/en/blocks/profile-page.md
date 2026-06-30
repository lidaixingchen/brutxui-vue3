---
title: Profile Page
description: Profile page section with avatar, form editing, and save action.
translated: true
---

# Profile Page

A neo-brutalist profile page featuring an auto-generated initials avatar, name/email/bio form, and a save button. Supports customizing the page structure via slots.

## Demo

<ComponentPreview>
  <ProfilePageDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="profile-page" />

## Usage

```vue
<script setup>
import ProfilePage from '@/components/ui/profile-page/ProfilePage.vue'

function handleSave(payload: { name: string; email: string; bio: string }) {
    console.log('Save profile:', payload)
}
</script>

<template>
    <ProfilePage
        name="John Doe"
        email="john@example.com"
        bio="Full-stack developer"
        @save="handleSave"
    />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `profilePage.defaultTitle` | Page title |
| `name` | `string` | — | Name |
| `email` | `string` | — | Email |
| `bio` | `string` | — | Bio |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
|------|------|------|
| `save` | `[{ name: string; email: string; bio: string }]` | Triggered when the save button is clicked, carries the current form data |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `header` | — | Custom page title area |
| `default` | — | Custom main content area (replaces avatar and form) |
| `footer` | — | Page bottom content |

## Accessibility

- **Keyboard**: Form inputs support `Tab` key sequential switching, save button supports `Space` / `Enter` to trigger
- **ARIA attributes**: Form fields are associated with labels via `label` and `id` for screen reader identification
- **Focus management**: Focus naturally flows to the form inputs after page load
