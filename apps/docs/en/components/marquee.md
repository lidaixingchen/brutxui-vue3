---
title: Marquee
description: Infinite horizontal scrolling marquee banner component with a bold, dynamic visual style that perfectly fits the neo-brutalist aesthetic.
translated: true
---

# Marquee

A horizontal marquee component that enables infinite seamless scrolling of text, images, or any card content along a horizontal track. Ideal for displaying promotional slogans or partner brands on marketing pages and Hero sections. Supports bidirectional scrolling, hover pause, and edge fade effects, with automatic adaptation to system motion preferences via the `useReducedMotion` composable.

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

## Props

### Marquee

| Prop | Type | Default | Description |
|------|------|--------|------|
| `direction` | `'left' \| 'right'` | `'left'` | Marquee scroll direction |
| `speed` | `number` | `20` | Duration in seconds for a single cycle (smaller value = faster speed) |
| `pauseOnHover` | `boolean` | `false` | Whether to pause animation on mouse hover |
| `fade` | `boolean` | `false` | Whether to enable left/right edge fade-in/fade-out mask effect |
| `variant` | `'default' \| 'primary' \| 'accent' \| 'muted'` | `'default'` | Background and text color variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Text size and padding |
| `class` | `string` | `""` | Custom CSS class for the container |

## Accessibility

- **Motion Reduction**: The component respects the `prefers-reduced-motion` system setting. When the user enables "Reduce Motion", the scroll animation is removed from the track (adds `[animation:none]`), content is displayed statically, and the repeated track copies used for seamless looping (mirror tracks with `aria-hidden`) are no longer rendered, keeping only a single copy to avoid visual redundancy.

This behavior is implemented through the `useReducedMotion` composable, which listens to the `prefers-reduced-motion: reduce` media query and responds in real-time to system setting changes without requiring a page refresh.

## Customization

| Variable | Default | Description |
|------|--------|------|
| `--speed` | `20s` | Single cycle animation duration, automatically set by the `speed` property |
