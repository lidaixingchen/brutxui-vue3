---
title: GlitchButton Glitch Effect Button
description: A glitch effect button that inherits all Button variants and sizes, supporting horizontal/vertical/both tear directions, multiple trigger modes and animation speed control.
translated: true
---

# GlitchButton Glitch Effect Button

Neobrutalist-style glitch effect button that inherits all variants and sizes from the Button component, applying CSS `clip-path` glitch animation effects on button text. Supports horizontal, vertical, and both tear directions.

## Demo

<ComponentPreview>
  <GlitchButtonDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="glitch-button" />

## Usage

```vue
<script setup>
import { GlitchButton } from 'brutx-ui-vue'
</script>

<template>
    <GlitchButton variant="primary" trigger="hover">
        Click Me
    </GlitchButton>
</template>
```

### Autoplay Mode

```vue
<GlitchButton trigger="autoplay" :interval="5000" speed="slow">
    Auto Glitch Effect
</GlitchButton>
```

### Loading State

```vue
<GlitchButton :loading="true" variant="primary">
    Submitting...
</GlitchButton>
```

### Icon Button

```vue
<GlitchButton size="icon" variant="outline">
    <Icon name="settings" />
</GlitchButton>
```

### Render as Child Component

Use `asChild` to apply the glitch effect to other elements without rendering a `<button>` element:

```vue
<GlitchButton asChild trigger="hover">
    <a href="/some-link">Link Style</a>
</GlitchButton>
```

### Disabled State

```vue
<GlitchButton disabled>
    Disabled State
</GlitchButton>
```

## Variants

### Trigger Modes

| Mode       | Description                                                         |
| ---------- | ------------------------------------------------------------ |
| `hover`    | Animation triggers on mouse hover, stops on mouse leave (default)                       |
| `click`    | Toggle animation on/off with click                                            |
| `autoplay` | Automatically loops after component mount, pauses on hover, resumes on mouse leave             |
| `none`     | No automatic trigger; use `expose({ play(), stop() })` for external programmatic control |

### Speed Variants

| Speed     | CSS Variable Value                     |
| -------- | ------------------------------ |
| `slow`   | `--glitch-duration: 800ms`     |
| `medium` | `--glitch-duration: 300ms` (default) |
| `fast`   | `--glitch-duration: 100ms`     |

### Tear Directions

Control tear slice and displacement direction via the `direction` prop:

| Direction         | Description                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------- |
| `horizontal` | Horizontal tear (default). Slices are horizontal, text is cut into horizontal strips, strips shift left/right; the button as a whole gets an additional `skewX` tilt   |
| `vertical`   | Vertical tear. Slices are vertical, text is cut into vertical strips, strips shift up/down; the button as a whole gets an additional `skewY` tilt           |
| `both`       | Both directions. `::before` uses horizontal red, `::after` uses vertical blue, two layers overlay; **no** overall tilt is applied to avoid excessive turbulence |

```vue
<GlitchButton direction="horizontal" data-text="HORIZONTAL" trigger="click">HORIZONTAL</GlitchButton>
<GlitchButton direction="vertical" data-text="VERTICAL" trigger="click">VERTICAL</GlitchButton>
<GlitchButton direction="both" data-text="BOTH" trigger="click">BOTH</GlitchButton>
```

> **`data-text` attribute**: GlitchButton's tear effect is achieved through pseudo-element `content: attr(data-text)` to replicate text. Therefore, you need to pass text matching the button content via the `data-text` attribute, otherwise the pseudo-element copy layer will be empty. This is a key difference from GlitchText (which automatically binds `data-text` from the `text` prop).

> In `both` mode, both pseudo-elements overlay the original text. Color block stacking may reduce readability; use as needed.

### Button Variants

GlitchButton inherits all Button variants:

| Variant        | Description     |
| ----------- | -------- |
| `default`   | Default style |
| `primary`   | Primary color   |
| `secondary` | Secondary color   |
| `accent`    | Accent color   |
| `danger`    | Danger/Error |
| `success`   | Success     |
| `outline`   | Outline     |
| `ghost`     | Ghost     |
| `link`      | Link style |

## Sizes

| Size      | Description     |
| --------- | -------- |
| `sm`      | Small   |
| `default` | Default |
| `lg`      | Large   |
| `xl`      | Extra large |
| `icon`    | Icon button |

## Programmatic Control

Obtain the component instance via `ref` to call the following methods:

| Method      | Description                                 |
| --------- | ------------------------------------ |
| `play()`  | Start the glitch animation, sets `isActive` to `true` |
| `stop()`  | Stop the glitch animation, sets `isActive` to `false` |

```vue
<script setup>
import { ref } from 'vue'
import { GlitchButton } from 'brutx-ui-vue'

const glitchRef = ref(null)

const startGlitch = () => {
  glitchRef.value?.play()
}

const stopGlitch = () => {
  glitchRef.value?.stop()
}
</script>

<template>
  <GlitchButton ref="glitchRef" trigger="none">
    Manual Control
  </GlitchButton>
  <button @click="startGlitch">Start</button>
  <button @click="stopGlitch">Stop</button>
</template>
```

## Props

| Prop       | Type                                                                                       | Default      | Description                                         |
| ---------- | ------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------- |
| `variant`  | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Button variant                                     |
| `size`     | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'icon'`                                             | `'default'` | Button size                                     |
| `speed`    | `'slow' \| 'medium' \| 'fast'`                                                             | `'medium'`  | Glitch animation speed                                 |
| `direction` | `'horizontal' \| 'vertical' \| 'both'`                                                    | `'horizontal'` | Tear direction (horizontal/vertical/both)               |
| `trigger`  | `'hover' \| 'click' \| 'autoplay' \| 'none'`                                              | `'hover'`   | Animation trigger timing                                 |
| `interval` | `number`                                                                                   | `3000`      | Autoplay interval (ms), minimum 100                  |
| `asChild`  | `boolean`                                                                                  | `false`     | Render as child component, does not render a `<button>` element     |
| `loading`  | `boolean`                                                                                  | `false`     | Loading state, displays a spinning icon and disables interaction             |
| `disabled` | `boolean`                                                                                  | `false`     | Disabled state                                     |
| `class`    | `string`                                                                                   | —           | External class override                                   |

## Slots

| Slot      | Scope | Description       |
| --------- | ------ | ---------- |
| `default` | —      | Button content   |

## Accessibility

- When the user prefers `prefers-reduced-motion: reduce`, all glitch animations are automatically disabled
- Listens for `prefersReducedMotion` changes, responding to user preferences in real time
- Supports `disabled` and `loading` states
- In `loading` state, a spinning loading icon is displayed with `aria-busy="true"`
- Both `disabled` and `loading` states disable button interaction
