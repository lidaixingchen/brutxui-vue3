---
title: SketchyChart
description: SVG + fractal noise filter driven hand-drawn line/bar/pie charts with zero external dependencies.
translated: true
---

# SketchyChart

A Neo-Brutalist hand-drawn style chart component, rendered purely with Vue `<svg>`. Uses SVG fractal noise filters to add wobble to axes, lines, and bar edges, perfectly mimicking a handwritten sketch aesthetic. Zero external dependencies.

## Demo

<ComponentPreview>
  <SketchyChartDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="sketchy-chart" />

## Usage

```vue
<script setup>
import { SketchyChart } from 'brutx-ui-vue'

const data = [
    { label: 'Jan', value: 30 },
    { label: 'Feb', value: 65 },
    { label: 'Mar', value: 45 },
]
</script>

<template>
    <SketchyChart type="line" :data="data" />
</template>
```

## Variants

| Variant | Description |
|------|------|
| `line` | Line chart with shadow fill area and node circles |
| `bar` | Bar chart with hatch pattern fill and hard shadows |
| `pie` | Pie chart using design token color palette and thick black borders |

```vue
<template>
    <SketchyChart type="bar" :data="data" />
</template>
```

## Sketchy Jitter

The `sketchiness` prop controls the hand-drawn jitter amplitude (0-10). Higher values produce more pronounced wobble:

```vue
<SketchyChart type="line" :data="data" :sketchiness="8" />
```

## Data Handling

- **Empty array**: Line/bar charts render an empty chart frame (axes only); pie charts render blank
- **Negative values**: Absolute value is used
- **Large datasets** (>30 items): Automatic downsampling

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `type` | `'line' \| 'bar' \| 'pie'` | `'line'` | Chart type |
| `data` | `Array<{ label: string, value: number }>` | `[]` | Chart data source |
| `sketchiness` | `number` | `2` | Hand-drawn jitter amplitude (0-10) |
| `grid` | `boolean` | `true` | Whether to draw background grid (ignored for pie charts) |
| `width` | `number` | `600` | Chart width (px) |
| `height` | `number` | `400` | Chart height (px) |
| `class` | `string` | — | External class override |

## Accessibility

- **ARIA attributes**: SVG sets `role="img"` and `aria-label`
- **Screen readers**: Includes a `<title>` element for screen reader narration
