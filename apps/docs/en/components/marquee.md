---
title: Marquee
description: Infinite horizontal marquee banner with CSS reduced-motion support and stable SSR hydration structure.
translated: true
---

# Marquee

A horizontal marquee component that enables infinite seamless scrolling of text, images, or any card content along a horizontal track. Ideal for displaying promotional slogans or partner brands on marketing pages and Hero sections. Supports bidirectional scrolling, hover pause, and edge fade effects, and adapts to system motion preferences through CSS media queries.

## Demo

<ComponentPreview>
  <MarqueeDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="marquee" />

## Usage

```vue
<script setup>
import { Marquee } from 'brutx-ui-vue'
</script>

<template>
    <Marquee :speed="20" fade>
        <span>⚡️ FAST AND FLUID</span>
        <span>💥 NEO-BRUTALISM</span>
        <span>🚀 VUE 3 + TAILWIND</span>
    </Marquee>
</template>
```

## Variants

Control the marquee's background and text color via the `variant` property.

| Variant | Description |
|------|------|
| `default` | Background color background, dark text |
| `primary` | Primary (coral red) background |
| `accent` | Accent (yellow) background |
| `muted` | Muted (gray) background |

```vue
<Marquee variant="primary">
    <span>Primary Marquee</span>
</Marquee>
```

## Sizes

Control text size and padding via the `size` property.

| Size | Description |
|------|------|
| `sm` | Small text, compact padding |
| `default` | Default size |
| `lg` | Large text, generous padding |

```vue
<Marquee size="lg">
    <span>Large Marquee</span>
</Marquee>
```

## API Reference

<span id="marquee-1"></span>

<ComponentApi name="marquee" />
## Accessibility

- **Motion Reduction**: The component respects the `prefers-reduced-motion` system setting. When "Reduce Motion" is enabled, CSS stops the track animation and hides the repeated track. The repeated track remains in the DOM to keep server-rendered and client hydration structure consistent. It has `aria-hidden` and `inert`, so it does not expose duplicate content or interactive elements. CSS responds immediately when the system preference changes.

## Customization

| Variable | Default | Description |
|------|--------|------|
| `--speed` | `20s` | Single cycle animation duration, automatically set by the `speed` property |
