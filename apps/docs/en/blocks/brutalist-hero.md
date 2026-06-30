---
title: Brutalist Hero
description: Neo-Brutalist hero section for landing pages with title, subtitle, CTA buttons, and a decorative code preview card.
translated: true
---

# Brutalist Hero

A Neo-Brutalist hero section for landing pages, featuring a title, subtitle, CTA buttons, and a decorative code preview card.

## Demo

<ComponentPreview>
  <BrutalistHeroDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="brutalist-hero" />

## Usage

```vue
<script setup>
import BrutalistHero from '@/components/ui/brutalist-hero/BrutalistHero.vue'

function handlePrimary() {
    console.log('Primary CTA clicked')
}

function handleSecondary() {
    console.log('Secondary CTA clicked')
}
</script>

<template>
    <BrutalistHero
        title="Build Bold Interfaces Faster with BrutxUI"
        subtitle="A Neo-Brutalism component library for Vue 3. Bold borders, hard shadows, zero apologies."
        primary-cta-text="Get Started Now"
        secondary-cta-text="View Component Registry"
        @primary-cta="handlePrimary"
        @secondary-cta="handleSecondary"
    />
</template>
```

## Props

### BrutalistHero

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `brutalistHero.title` | Title text |
| `subtitle` | `string` | — | Subtitle text |
| `primaryCtaText` | `string` | locale: `brutalistHero.primaryCtaText` | Primary CTA button text |
| `secondaryCtaText` | `string` | locale: `brutalistHero.secondaryCtaText` | Secondary CTA button text |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
| ---- | ---- | ---- |
| `primaryCta` | — | Emitted when the primary CTA button is clicked |
| `secondaryCta` | — | Emitted when the secondary CTA button is clicked |

## Accessibility

- **Keyboard**: Supports `Tab` to navigate between buttons, `Enter` to trigger actions
- **ARIA**: Buttons use semantic `<button>` tags
- **Focus Management**: Buttons are arranged in logical order
