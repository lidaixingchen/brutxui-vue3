---
title: Progress
description: Progress bar component with animated transitions and custom indicator color blocks, featuring a bold-edge design.
translated: true
---

# Progress

A neo-brutalist style progress bar built on reka-ui's Progress primitive.

## Demo

<ComponentPreview>
  <ProgressDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="progress" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Progress } from 'brutx-ui-vue'

const progress = ref(45)
</script>

<template>
    <Progress v-model="progress" />
</template>
```

### With Max Value

```vue
<script setup>
import { ref } from 'vue'
import { Progress } from 'brutx-ui-vue'

const progress = ref(75)
</script>

<template>
    <Progress v-model="progress" :max="100" />
</template>
```

### Indeterminate State

When the exact progress cannot be determined, set `indeterminate` to `true`. The progress bar will ignore `modelValue` and the indicator will cycle with a CSS animation along the track.

```vue
<script setup>
import { Progress } from 'brutx-ui-vue'
</script>

<template>
    <Progress indeterminate />
</template>
```

### Show Percentage Label

When `showLabel` is set to `true`, a percentage text is displayed in the center of the progress bar (calculated from `modelValue` and `max`, rounded to the nearest integer). The label is not shown in indeterminate state.

```vue
<script setup>
import { ref } from 'vue'
import { Progress } from 'brutx-ui-vue'

const progress = ref(65)
</script>

<template>
    <Progress v-model="progress" show-label />
</template>
```

## Variants

`variant` controls the fill color of the progress indicator.

| Variant | Description |
| --- | --- |
| `default` | Primary color (`bg-brutal-primary`) |
| `secondary` | Secondary color (`bg-brutal-secondary`) |
| `accent` | Accent color (`bg-brutal-accent`) |
| `success` | Success color (`bg-brutal-success`) |
| `danger` | Destructive color (`bg-brutal-destructive`) |

```vue
<script setup>
import { ref } from 'vue'
import { Progress } from 'brutx-ui-vue'

const value = ref(60)
</script>

<template>
    <div class="flex flex-col gap-4">
        <Progress v-model="value" variant="default" />
        <Progress v-model="value" variant="secondary" />
        <Progress v-model="value" variant="accent" />
        <Progress v-model="value" variant="success" />
        <Progress v-model="value" variant="danger" />
    </div>
</template>
```

## Sizes

`size` controls the height of the progress bar.

| Size | Description |
| --- | --- |
| `sm` | Small size (`h-3`) |
| `default` | Default size (`h-6`) |
| `lg` | Large size (`h-8`) |

```vue
<script setup>
import { ref } from 'vue'
import { Progress } from 'brutx-ui-vue'

const value = ref(50)
</script>

<template>
    <div class="flex flex-col gap-4">
        <Progress v-model="value" size="sm" />
        <Progress v-model="value" size="default" />
        <Progress v-model="value" size="lg" />
    </div>
</template>
```

## Props

### Progress

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | Current progress value |
| `max` | `number` | `100` | Maximum value |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Progress bar height preset |
| `variant` | `'default' \| 'secondary' \| 'accent' \| 'success' \| 'danger'` | `'default'` | Indicator color variant |
| `indeterminate` | `boolean` | `false` | Whether in indeterminate state (indicator cycles, ignores `modelValue`) |
| `showLabel` | `boolean` | `false` | Whether to show a percentage label in the center of the progress bar (not shown in indeterminate state) |
| `class` | `string` | — | Custom CSS class |

## Accessibility

The component is built on reka-ui's `ProgressRoot` primitive and automatically includes the following accessibility attributes:

- `role="progressbar"`
- `aria-valuemin="0"`
- `aria-valuemax` corresponds to the `max` value
- `aria-valuenow` corresponds to the current `modelValue` (not set in indeterminate state)
