---
title: Rate
description: A rate component with high-contrast borders, custom HSL themed yellow stars, and micro-hover transitions.
---

# Rate

A rating component built on Lucide Star vector icons. Active stars feature high-saturation HSL-themed golden fills, heavy black borders, and springy hover-scaling micro-interactions.

## Preview

<ComponentPreview>
  <RateDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="rate" />

## Usage

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import { Rate } from 'brutx-ui-vue'

const value = ref(3)
</script>

<template>
    <Rate v-model="value" />
</template>
```

### Half Star Support

Allow decimal ratings (half stars) using the `allow-half` property.

```vue
<script setup>
import { ref } from 'vue'
import { Rate } from 'brutx-ui-vue'

const value = ref(3.5)
</script>

<template>
    <Rate v-model="value" allow-half />
</template>
```

### Max Stars Count

Change the upper limit of the rating scale (default is `5`) using the `max` property.

```vue
<template>
    <Rate v-model="value" :max="10" />
</template>
```

### Readonly Mode

Add `readonly` to display a rating while preventing hover previews, pointer selection, and keyboard changes.

```vue
<template>
    <Rate v-model="value" readonly allow-half />
</template>
```

## Sizes

| Size | Description |
|------|-------------|
| `sm` | Small icons with compact spacing |
| `md` | Default icons and spacing |
| `lg` | Large icons with wider spacing |

## API Reference

<span id="rate-1"></span>
<span id="rate-2"></span>

<ComponentApi name="rate" />

## Accessibility

- **Keyboard Interaction**: Right or Up increases the rating; Left or Down decreases it. `Home` selects zero and `End` selects the maximum. With `allowHalf`, arrow keys use half-point steps. Read-only mode prevents keyboard changes and removes the component from the Tab order
- **ARIA Attributes**: The root element has `role="slider"`, `aria-valuenow` representing the current rating score, `aria-valuemin="0"`, `aria-valuemax` mapped to `max`, and `aria-readonly` indicating readonly state
- **Reduced Motion**: The stamp animation after icon selection reads `prefers-reduced-motion` and does not play when reduced motion is requested

