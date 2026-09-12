---
title: Neobrutalist Chart Design Paradigm
description: "Neobrutalism Chart System: Native SketchyChart Component and ECharts Theme Integration"
---

# Neobrutalist Chart Design Paradigm

BrutxUI provides a **two-tier chart architecture**, balancing lightweight illustrative aesthetics with demanding enterprise data visualization:

1. **Native Lightweight Component (`SketchyChart`)**: Zero heavy external dependencies (pure Vue 3 + SVG dynamic sketchy filter algorithm), ready out of the box, ideal for dashboard overviews, metric widgets, and playful data displays;
2. **Heavy Chart Ecosystem Integration (ECharts)**: For massive datasets, multi-axis linkage, or financial analytics, it ships an **ECharts theme JSON** strictly synchronized with the single source of design tokens, plus core visual laws.

---

## Native Component: SketchyChart

`SketchyChart` incorporates dynamic perturbation filters based on SVG `feTurbulence` and `feDisplacementMap`, rendering neo-brutalist hand-drawn borders, hatch patterns, and concentric data points.

### Basic Usage

```vue
<script setup lang="ts">
import { SketchyChart } from 'brutx-ui-vue'

const monthlyData = [
    { label: 'Jan', value: 120 },
    { label: 'Feb', value: 200 },
    { label: 'Mar', value: 150 },
    { label: 'Apr', value: 280 },
    { label: 'May', value: 220 },
]
</script>

<template>
    <div class="flex flex-col gap-6">
        <!-- Line Chart -->
        <SketchyChart
            type="line"
            :data="monthlyData"
            :width="560"
            :height="300"
            :sketchiness="2"
        />

        <!-- Bar Chart -->
        <SketchyChart
            type="bar"
            :data="monthlyData"
            :width="560"
            :height="300"
        />

        <!-- Pie Chart -->
        <SketchyChart
            type="pie"
            :data="monthlyData"
            :width="400"
            :height="300"
        />
    </div>
</template>
```

### Props

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | `'line' \| 'bar' \| 'pie'` | `'line'` | Chart visualization type |
| `data` | `{ label: string; value: number }[]` | `[]` | Array of data items (automatically normalized and downsampled if > 30 items) |
| `sketchiness` | `number` | `2` | Stroke jitter intensity (higher values introduce stronger hand-drawn wobble) |
| `grid` | `boolean` | `true` | Whether to render the high-contrast hard gridlines |
| `width` | `number` | `500` | SVG canvas width in pixels |
| `height` | `number` | `300` | SVG canvas height in pixels |
| `class` | `string` | `undefined` | Custom class for root container |

---

## Complex Visualizations: ECharts Theme Integration

For complex multi-series multi-axis dashboards, integrating via BrutxUI's official **ECharts theme JSON** is recommended.

### Color Mapping (Zero New Tokens)

Chart series map directly to the five semantic color families, automatically adapting across theme presets and dark mode:

| Series | Semantic Token | Default Preset |
| :--- | :--- | :--- |
| Series 1 | `--brutal-primary` | `#FF6B6B` |
| Series 2 | `--brutal-secondary` | `#4ECDC4` |
| Series 3 | `--brutal-accent` | `#FFE66D` |
| Series 4 | `--brutal-status-success` | `#22c55e` |
| Series 5 | `--brutal-info` | `#4A90D9` |

### Three Visual Laws

#### Law 1: Grid Background

Grid lines must be pure solid strokes or high-contrast dot matrices; soft gray grids are forbidden. Recommended axis stroke width is `3px`.

#### Law 2: Solid Card Tooltip

Hover cards must feature an opaque solid background + `3px` hard border + hard shadow (`box-shadow: 4px 4px 0 0 var(--brutal-border-color)`). Blurred glows and rounded corners are forbidden.

#### Law 3: Hard Bar Borders & Concentric Data Points

Bars carry a `2px` black border with zero radius; line chart key points use black-and-white solid concentric circles (black outer, colored inner), eliminating soft gradients and blur.

### Anti-Patterns

| ❌ Forbidden | Reason |
| :--- | :--- |
| Gradient-filled bars / soft transparent area gradients | Violates the tactile physical design language |
| Blurred shadows (`shadowBlur`) | Breaks the hard shadow system |
| Rounded bars (`borderRadius > 0`) | Neo-brutalist geometry features zero radius |
| Random colors beyond semantic families | Violates token single-source consistency |

### Integration Code

```ts
import * as echarts from 'echarts'
// Import theme file from documentation site or build artifacts
import brutxuiTheme from './brutxui-theme.json'

echarts.registerTheme('brutxui', brutxuiTheme)
const chart = echarts.init(el, 'brutxui')
```

### Theme JSON Maintenance

The theme JSON is generated and synchronized directly from `design-tokens.ts`:

```bash
# Generate and synchronize theme file
pnpm --filter brutx-ui-vue generate:echarts-theme

# Verify consistency between on-disk output and design tokens
pnpm --filter brutx-ui-vue exec tsx scripts/generate-echarts-theme.ts --check
```
