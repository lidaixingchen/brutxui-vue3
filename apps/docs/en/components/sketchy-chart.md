---
title: SketchyChart
description: Hand-drawn SVG charts with complete data, signed values, consistent formatting, and an equivalent data table.
translated: true
---

# SketchyChart

A Neo-Brutalist chart rendered with Vue and SVG, using fractal noise and hatch textures for a hand-drawn appearance. The table disclosure uses Reka UI and the library's semantic table components.

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
    <SketchyChart title="Monthly sales" description="Unit: USD" type="line" :data="data" />
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

The sketchiness prop controls the hand-drawn jitter amplitude. Higher values produce more pronounced wobble. Use 0-10 as a practical range; the component does not clamp the supplied value:

```vue
<SketchyChart type="line" :data="data" :sketchiness="8" />
```

## Data Handling

- **Lines and bars**: Accept finite positive, negative, and zero values. The domain includes zero and the actual extrema; bars and line areas use a zero baseline.
- **Pie charts**: Accept finite nonnegative values and calculate proportions from the complete dataset. Zero values remain in the legend and table without creating slices.
- **Invalid values**: Any `NaN`, infinity, or negative pie value invalidates the entire graphic. The table identifies invalid cells while preserving every label.
- **Empty and zero data**: Empty arrays show an empty state. All-zero lines and bars still render zero values. All-zero pies show a zero-total state with unavailable percentages.
- **Complete categories**: Datasets above 30 items retain all data and endpoints; only visible category ticks are thinned. Use the complete table for dense data.
- **Formatting**: `valueFormatter` consistently formats ticks, legends, and table values, receives only valid finite numbers, and should be deterministic and side-effect-free. Percentages use locale formatting independently; rounded values may not total 100%.

## Data Semantics Migration

Negative values now retain their sign, and negative pie values invalidate the chart. Datasets above 30 items are rendered in full. If your application needs absolute values, aggregation, or sampling, explicitly transform the input and explain that transformation. Use `title` to distinguish charts and `description` for units, methodology, and important trends.

## Reading Interaction

Hover the nearest horizontal line position, a bar category area, or a pie slice to read an item. The pie legend also exposes zero values. Move into the tooltip to keep it open. Escape dismisses it and small movements within the same item keep it closed. Touch selects an item; tapping it again or tapping outside dismisses it. Swiping preserves page scrolling.

The visible data-item slider includes every category in input order. Arrow keys move between items, Home/End reach the endpoints, and Tab leaves normally. Single, empty, and invalid datasets use a read-only focus region. Pointer activity is independent of the slider position. Array replacement, insertion, deletion, reordering, label/value edits, or chart-type changes clear the tooltip and reset the explorer. Scrolling and resizing preserve the active item; locale and formatter changes refresh its text.

Set `:interactive="false"` for a static chart with the complete table disclosure still available. Read dense data through the slider or table; visual distinguishability depends on available space.

## Tooltip Slot

```vue
<SketchyChart title="Device share" type="pie" :data="data">
    <template #tooltip="{ label, formattedValue, formattedPercentage }">
        {{ label }}: {{ formattedValue }} ({{ formattedPercentage }})
    </template>
</SketchyChart>
```

The slot exposes `index`, `label`, raw `value`, `formattedValue`, and pie-specific `percentage` (0 to 1) and `formattedPercentage`. Both percentage fields are `undefined` for other chart types or unavailable proportions. Use display content only; links, buttons, and inputs belong in a separate interactive overlay. The slider and table provide equivalent readings.

## API Reference

<ComponentApi name="sketchy-chart" />

## Accessibility

- **Graphic semantics**: SVG uses `role="img"` and instance-unique IDs to associate its visible title, description, and data state.
- **Keyboard readings**: The slider has one focusable thumb. Its `aria-valuetext` includes category, formatted value, position, count, and pie percentage. The visual tooltip does not repeat announcements. Inside a dialog, the first Escape dismisses the tooltip and the next closes the dialog.
- **Equivalent readings**: A keyboard-operable data-table disclosure retains focus on its button. The complete semantic table includes a caption, column headers, and percentages for pie charts.
- **Context**: Supply meaningful titles and necessary trend descriptions to distinguish charts and convey their purpose.
