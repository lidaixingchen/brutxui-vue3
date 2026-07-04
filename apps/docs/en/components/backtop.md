---
title: Backtop
description: Scroll-to-top shortcut button supporting throttle optimization and high-contrast retro borders.
---

# Backtop

A shortcut button that triggers smooth scrolling back to the top of its viewport. Features custom throttle protections on scroll events and classical brutalist card layouts.

## Preview

<ComponentPreview>
  <BacktopDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="backtop" />

## Usage

### Basic Global Usage

Include `<Backtop>` inside your main wrapper template. The shortcut button appears automatically once page scroll offset passes 200px.

```vue
<script setup>
import { Backtop } from 'brutx-ui-vue'
</script>

<template>
    <Backtop :visibility-height="200" />
</template>
```

### Local Target Scroll Container

Target scroll containers that have `overflow-y: auto` by assigning the selector ID or element reference to the `target` prop.

```vue
<template>
    <div id="my-scroll-box" class="h-60 overflow-y-auto relative">
        <div class="h-[800px]">...</div>
        
        <!-- target binds element selector -->
        <Backtop target="#my-scroll-box" :visibility-height="100" />
    </div>
</template>
```

### Custom Positioning and Themes

Apply customized alignment offsets via `right` or `bottom` coordinates, and toggle color layouts by modifying `variant`.

```vue
<template>
    <Backtop 
        :right="80" 
        :bottom="80" 
        variant="accent" 
        :visibility-height="150" 
    />
</template>
```

## Props

### Backtop

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visibilityHeight` | `number` | `200` | Minimum scroll height (in pixels) required to show the shortcut button |
| `target` | `string \| HTMLElement` | `undefined` | The scroll viewport container element or selector ID. Resolves to `window` if empty |
| `right` | `number` | `40` | Offset pixel distance from the right edge of viewport/container |
| `bottom` | `number` | `40` | Offset pixel distance from the bottom edge of viewport/container |
| `variant` | `'primary' \| 'secondary' \| 'accent'` | `'primary'` | Theme color layout variation (primary renders yellow background) |
| `class` | `string` | `undefined` | Extra CSS classes passed down to the inner button element |

## Events

### Backtop

| Event | Parameters | Description |
|-------|------------|-------------|
| `click` | `event: MouseEvent` | Triggers when the button is clicked to perform the scroll reset action |

## Accessibility

- **ARIA Semantics**: Emits `aria-label="Back to top"` on the inner trigger to describe its functionality to assistive screen readers.
- **Smooth Scroll Transitions**: Uses native smooth-scroll behaviors. If the client has activated "Reduce Motion" system accessibility flags, it immediately jumps to top to avoid visual fatigue.
