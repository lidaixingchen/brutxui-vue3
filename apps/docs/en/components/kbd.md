---
title: Kbd
description: Keyboard key style component for displaying shortcut key hints, works great with the Command component.
translated: true
---

# Kbd

Semantic `<kbd>` wrapper component that visually separates keyboard shortcuts from regular text through neo-brutalist styling, making documentation and command prompts clear at a glance.

## Demo

<ComponentPreview>
  <KbdDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="kbd" />

## Usage

```vue
<script setup>
import { Kbd } from 'brutx-ui-vue'
</script>

<template>
    <!-- Single key -->
    <Kbd>Enter</Kbd>

    <!-- Key combination -->
    <div class="flex items-center gap-1">
        <Kbd>⌘</Kbd>
        <span>+</span>
        <Kbd>K</Kbd>
    </div>

    <!-- Sizes -->
    <Kbd size="sm">Esc</Kbd>
    <Kbd size="md">Tab</Kbd>
    <Kbd size="lg">Space</Kbd>
</template>
```

## Variants

| Variant | Description |
|------|------|
| `default` | Neutral background with standard foreground text |
| `primary` | Primary (coral) background with high-contrast foreground |
| `secondary` | Secondary (mint) background |
| `accent` | Accent (yellow) background |
| `backlit` | Black background with accent-colored text for a backlit keycap |

```vue
<script setup>
import { Kbd } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex items-center gap-2">
        <Kbd variant="default">Esc</Kbd>
        <Kbd variant="primary">Enter</Kbd>
        <Kbd variant="secondary">Tab</Kbd>
        <Kbd variant="accent">Space</Kbd>
        <Kbd variant="backlit">Fn</Kbd>
    </div>
</template>
```

## Sizes

| Size | Description |
|------|------|
| `sm` | Small size, suitable for inline compact scenarios |
| `md` | Default size |
| `lg` | Large size, suitable for standalone display |

## API Reference

<ComponentApi name="kbd" />

## Accessibility

- **Semantic Markup**: Uses the native `<kbd>` element for rendering, so screen readers can correctly identify it as a keyboard key
- **Visual Presentation**: Visually separates keys from regular text through brutalist styling, improving readability
- **Key Combination Display**: Supports displaying keyboard shortcuts by combining multiple `<Kbd>` components with clear semantics
