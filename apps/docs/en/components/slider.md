---
title: Slider
description: A sliding input component for continuous value range adjustment or drag input.
translated: true
---

# Slider

A neo-brutalist style slider built on top of reka-ui's Slider primitive, with v-model support.

## Demo

<ComponentPreview>
  <SliderDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="slider" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const value = ref([50])
</script>

<template>
    <Slider v-model="value" :max="100" :step="1" />
</template>
```

### Range Slider

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const range = ref([25, 75])
</script>

<template>
    <Slider v-model="range" :max="100" :step="1" />
</template>
```

### With Min/Max

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const value = ref([500])
</script>

<template>
    <Slider v-model="value" :min="0" :max="1000" :step="50" />
</template>
```

### Disabled State

```vue
<template>
    <Slider v-model="value" disabled />
</template>
```

### Orientation

Use the `orientation` prop to switch between horizontal (`horizontal`) or vertical (`vertical`) layout. This prop is passed through to the reka-ui primitive. Vertical mode requires a height to be set on the container.

```vue
<template>
    <div class="h-48">
        <Slider v-model="value" orientation="vertical" />
    </div>
</template>
```

### Tick Marks

Pass a numeric array to the `marks` prop to render tick marks at the corresponding positions on the track.

```vue
<template>
    <Slider v-model="value" :marks="[0, 25, 50, 75, 100]" />
</template>
```

### Tooltip on Drag

Enable `showTooltip` to display the current value near the thumb when dragging or hovering.

```vue
<template>
    <Slider v-model="value" show-tooltip />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `number[]` | — | Current value, supports `v-model` |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `disabled` | `boolean` | `false` | Whether disabled |
| `ariaLabel` | `string` | — | Accessibility label |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'success'` | `'default'` | Color variant |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `marks` | `number[]` | — | Array of tick mark values |
| `showTooltip` | `boolean` | `false` | Whether to show tooltip on drag |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `number[]` | Triggered when the value changes |

## Accessibility

- **Keyboard**: Supports arrow keys to adjust the value, `Home` / `End` to jump to min/max
- **ARIA Attributes**: Automatically manages `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-orientation`, etc.
- **Focus Management**: The slider can be focused via the Tab key

## Exposed Methods (defineExpose)

| Property/Method | Type | Description |
| --- | --- | --- |
| `currentValue` | `ComputedRef<number[]>` | Current slider value (read-only) |
| `setValue` | `(value: number[]) => void` | Set the slider value |
