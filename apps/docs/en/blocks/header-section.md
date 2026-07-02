---
title: Header Section
description: Top navigation bar section with Logo, nav links, CTA button, and mobile drawer menu.
translated: true
---

# Header Section

A neo-brutalist top navigation bar featuring Logo text, navigation links, a CTA button, and a responsive mobile Sheet drawer menu.

## Demo

<ComponentPreview>
  <HeaderSectionDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="header-section" />

## Usage

```vue
<script setup>
import HeaderSection from '@/components/ui/header-section/HeaderSection.vue'

const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: '/docs' },
]

function handleCta() {
    console.log('CTA clicked')
}

function handleNav(index) {
    console.log('Nav item clicked:', navItems[index].label)
}
</script>

<template>
    <HeaderSection
        logo-text="MyApp"
        :nav-items="navItems"
        cta-text="Sign Up"
        @cta-click="handleCta"
        @nav-click="handleNav"
    />
</template>
```

## Data Types

### NavItem

```ts
interface NavItem {
    label: string
    href?: string
}
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `logoText` | `string` | locale: `headerSection.defaultLogoText` | Logo display text |
| `navItems` | `NavItem[]` | `[]` | Array of navigation link items |
| `ctaText` | `string` | locale: `headerSection.defaultCtaText` | CTA button text |
| `class` | `string` | — | Custom CSS class name |

## Events

| Event         | Payload               | Description                                 |
| ------------ | ------------------ | ------------------------------------ |
| `cta-click`  | `[]`               | Triggered when the CTA button is clicked                  |
| `nav-click`  | `[index: number]`  | Triggered when a navigation link is clicked, payload is the link index   |

## Slots

| Slot      | Scope | Description               |
| --------- | ------ | ------------------ |
| `header`  | —      | Replace the Logo area     |
| `default` | —      | Replace the navigation links area   |
| `footer`  | —      | Replace the CTA button area  |

## Accessibility

- Rooted in a semantic `<header>` element that serves as the page's top landmark
- Desktop navigation is wrapped in `<nav>`; the mobile menu button includes an `sr-only` label for screen-reader pronunciation
- The mobile menu is built on reka-ui's `DialogRoot` + `SheetContent`, providing automatic focus trapping, `Escape` dismissal, and `aria-modal` state
- The sheet renders `SheetTitle` / `SheetDescription`, giving the dialog an accessible name and description
