---
title: Chart Section
description: Neo-brutalist chart display section with tab switching, supporting bar, line, and pie charts.
translated: true
---

# Chart Section

A neo-brutalist chart display section featuring tab-based view switching, supporting bar charts, line charts, and pie charts.

## Demo

<ComponentPreview>
  <ChartSectionDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="chart-section" />

## Usage

```vue
<script setup>
import ChartSection from '@/components/ui/chart-section/ChartSection.vue'

const data = [
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 80 },
    { label: 'Mar', value: 45 },
    { label: 'Apr', value: 90 },
    { label: 'May', value: 70 },
]
</script>

<template>
    <ChartSection
        title="Analytics"
        subtitle="Monthly performance overview"
        chart-type="bar"
        :data="data"
    />
</template>
```

## Data Types

```ts
interface ChartDataPoint {
    label: string
    value: number
}
```

## Props

### ChartSection

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `chartSection.defaultTitle` | Section title |
| `subtitle` | `string` | locale: `chartSection.defaultSubtitle` | Section subtitle |
| `chartType` | `'bar' \| 'line' \| 'pie'` | `'bar'` | Chart type |
| `data` | `ChartDataPoint[]` | `[]` | Chart data |
| `class` | `string` | — | Custom style class |

## Slots

| Slot | Scope | Description |
| ---- | ---- | ---- |
| `header` | — | Custom title area |
| `default` | — | Custom main content area (replaces tabs and chart) |
| `footer` | — | Bottom content |

## Accessibility

- **Keyboard**: Supports `Tab` to navigate between tabs, `Enter` / `Space` to switch chart type
- **ARIA attributes**: Tabs use `role="tablist"` and `aria-selected` to indicate selected state
- **Focus management**: Focus stays on the current tab after switching
