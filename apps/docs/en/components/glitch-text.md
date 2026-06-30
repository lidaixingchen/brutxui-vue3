---
title: GlitchText Glitch Tear Text
description: CSS clip-path driven glitch tear text effect, supporting horizontal/vertical/both tear directions, multiple trigger modes and speed variants.
translated: true
---

# GlitchText Glitch Tear Text

Neobrutalist-style glitch text effect that uses CSS `clip-path` to slice pseudo-elements, producing high-frequency displacement, chromatic aberration (RGB channel separation), and instant tear animations on trigger. Supports horizontal, vertical, and both tear directions.

## Demo

<ComponentPreview>
  <GlitchTextDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="glitch-text" />

## Usage

```vue
<script setup>
import { GlitchText } from 'brutx-ui-vue'
</script>

<template>
    <GlitchText text="BRUTAL GLITCH" class="text-4xl" />
</template>
```

## Variants

### Trigger Modes

| Mode | Description |
| ---- | ---- |
| `hover` | Animation triggers on mouse hover, stops on mouse leave (default) |
| `click` | Toggle animation on/off with click |
| `autoplay` | Automatically loops after component mount, pauses on hover |
| `none` | No automatic trigger; use `expose({ play(), stop() })` for external programmatic control |

### Speed Variants

| Speed | CSS Variable Value |
| ---- | --------- |
| `slow` | `--glitch-duration: 800ms` |
| `medium` | `--glitch-duration: 300ms` (default) |
| `fast` | `--glitch-duration: 100ms` |

### Tear Directions

Control tear slice and displacement direction via the `direction` prop:

| Direction | Description |
| ---- | ---- |
| `horizontal` | Horizontal tear (default). Slices are horizontal, text is cut into horizontal strips, strips shift left/right, red-blue separation runs horizontally |
| `vertical` | Vertical tear. Slices are vertical, text is cut into vertical strips, strips shift up/down, red-blue separation runs vertically |
| `both` | Both directions. `::before` uses horizontal red, `::after` uses vertical blue, two layers overlay for a more complex shattered effect |

```vue
<GlitchText text="HORIZONTAL" direction="horizontal" trigger="click" />
<GlitchText text="VERTICAL" direction="vertical" trigger="click" />
<GlitchText text="BOTH" direction="both" trigger="click" />
```

> In `both` mode, both pseudo-elements overlay the original text. Color block stacking may reduce readability; use as needed.

## Programmatic Control

| Method | Description |
| ---- | ---- |
| `play()` | Start the glitch animation (sets internal `isActive` state to `true`) |
| `stop()` | Stop the glitch animation (sets internal `isActive` state to `false`) |

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `text` | `string` | `''` | Text content to display (mutually exclusive with default slot) |
| `trigger` | `'hover' \| 'click' \| 'autoplay' \| 'none'` | `'hover'` | Animation trigger timing |
| `interval` | `number` | `3000` | Cycle time for autoplay (ms) |
| `speed` | `'slow' \| 'medium' \| 'fast'` | `'medium'` | Tear jitter frequency and speed |
| `direction` | `'horizontal' \| 'vertical' \| 'both'` | `'horizontal'` | Tear direction (horizontal/vertical/both) |
| `class` | `string` | — | External class override |

## Events

| Event | Payload | Description |
| ---- | ---- | ---- |
| `mouseenter` | `MouseEvent` | Triggered when the mouse enters. Activates animation in `hover` mode, pauses animation in `autoplay` mode |
| `mouseleave` | `MouseEvent` | Triggered when the mouse leaves. Stops animation in `hover` mode, resumes autoplay in `autoplay` mode |
| `click` | `MouseEvent` | Triggered on click. Toggles animation on/off in `click` mode |

## Slots

| Slot | Scope | Description |
| ---- | ------ | ---- |
| `default` | — | Text content (takes priority over `text` prop, allows inline styling of partial text) |

## Accessibility

- The component sets `role="status"` and `aria-live="polite"`
- When the user prefers `prefers-reduced-motion: reduce`, CSS media queries automatically disable all glitch animations
