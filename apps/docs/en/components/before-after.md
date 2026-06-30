---
title: BeforeAfter Comparison Slider
description: A drag comparison slider component for displaying differences between two images within the same frame, with clear drag slider control.
translated: true
---

# BeforeAfter Comparison Slider

Neobrutalist-style image sliding comparison component. Used to visually compare the difference between the same image before (Before) and after (After) modification. Built on native `<input type="range">` combined with CSS `clip-path` masking, zero dependencies, touch-friendly.

## Demo

<ComponentPreview>
  <BeforeAfterDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="before-after" />

## Usage

```vue
<script setup>
import { BeforeAfter } from 'brutx-ui-vue'

const original = '/images/before.jpg'
const modified = '/images/after.jpg'
</script>

<template>
    <BeforeAfter
        :before="original"
        :after="modified"
        :default-value="50"
    />
</template>
```

### Vertical Orientation

Switch the divider direction via the `orientation` prop. Default `horizontal` is left-right dragging; when set to `vertical`, the divider becomes horizontal with up-down dragging, clipping proceeds from bottom to top (`clip-path: inset(0 0 ...)`), and the handle icon rotates 90 degrees automatically.

```vue
<BeforeAfter
    :before="original"
    :after="modified"
    orientation="vertical"
    :default-value="50"
/>
```

## Variants

| Variant | Description |
|------|------|
| `horizontal` | Default direction, left-right drag divider |
| `vertical` | Vertical direction, up-down drag divider, clipping proceeds from bottom to top |

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `before` | `string` | — | URL of the left/bottom original image (required) |
| `after` | `string` | — | URL of the right/top comparison image (required) |
| `beforeAlt` | `string` | locale: `beforeAfter.before` | `alt` attribute for the original image |
| `afterAlt` | `string` | locale: `beforeAfter.after` | `alt` attribute for the comparison image |
| `modelValue` | `number` | — | Divider position (v-model, 0-100) |
| `defaultValue` | `number` | `50` | Initial percentage position of the divider (0-100) |
| `disabled` | `boolean` | `false` | Whether to disable drag interaction |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Divider direction; vertical clips from bottom to top |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | Size of the drag handle icon |
| `class` | `string` | `""` | Custom CSS class for the container |

## Events

| Event | Payload | Description |
|------|------|------|
| `update:modelValue` | `number` | Divider position changed |

## Accessibility

- **Keyboard control**: Supports keyboard arrow keys to control divider position; keyboard interaction is disabled in `disabled` state
- **Motion reduction**: The component respects the `prefers-reduced-motion` system setting. When the user enables "reduce motion" (via `useReducedMotion` listening for `prefers-reduced-motion: reduce`):
  - **Slider transition removal**: The divider, drag handle, and `clip-path` clipping layer no longer apply transition styles. Position changes take effect immediately during dragging without easing animations
  - **Interaction preserved**: Dragging, keyboard arrow keys, `disabled` and other behaviors are completely unaffected; only visual transitions are removed
  - **Real-time response**: Preference changes take effect immediately without remounting the component
  - This mechanism is implemented through a reactive `motionTransition` computed property: in motion reduction mode it returns an empty string, causing related elements to skip transition styles

## FAQ

**Q: What is the technical approach of this component?**

A: This component is built on the native browser `<input type="range">` combined with CSS `clip-path` masking, with the following advantages:
1. **Touch-friendly**: Perfectly adapts to swipe gestures on mobile phones, tablets, and other mobile devices
2. **Zero dependencies**: No need to load any additional external gesture interaction JS libraries, package size is nearly zero
3. **Perfect layout**: The underlying `clip-path: inset(...)` clipping method does not break the image aspect ratio, ensuring alignment across platforms
4. **Adaptive ratio**: The container automatically calculates `aspect-ratio` based on the actual image dimensions, no need to manually specify the ratio. Before images load, default ratios are used as placeholders (horizontal 16:9, vertical 9:16)
