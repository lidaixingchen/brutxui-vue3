---
title: Statistic
description: Statistic display component supporting ease-in transitions, bold bordered card bases, and custom prefix/suffix attachments.
---

# Statistic

Used to display business metrics or core indexes. Features smooth number count-up transitions, color variations, and an optional high-contrast `card` base with deep retro shadows.

## Preview

<ComponentPreview>
  <StatisticDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="statistic" />

## Usage

### Basic Usage

Render a plain statistic indicator with custom digit groupings.

```vue
<script setup>
import { Statistic } from 'brutx-ui-vue'
</script>

<template>
    <Statistic title="Active Users" :value="12850" group-separator="," />
</template>
```

### Brutalist Border Shadow (Card Mode)

Apply a dark bold frame and hard offsets to present a full Neo-Brutalist look.

```vue
<template>
    <Statistic title="Weekly Revenue" :value="4895.8" prefix="$" card />
</template>
```

### Prefix / Suffix and Icons

Provide percentage signs, custom icons, and contextual colors to represent upward or downward trends.

```vue
<script setup>
import { Statistic } from 'brutx-ui-vue'
import { ArrowUpRight } from '@lucide/vue'
</script>

<template>
    <Statistic
        title="Conversion Rate"
        :value="15.82"
        :precision="2"
        suffix="%"
        :suffix-component="ArrowUpRight"
        variant="success"
        card
    />
</template>
```

## Props

### Statistic

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | *Required* | Numeric stat value |
| `title` | `string` | `''` | Stat label/title |
| `precision` | `number` | `0` | Decimal places |
| `decimalSeparator` | `string` | `'.'` | Character representing the decimal |
| `groupSeparator` | `string` | `''` | Digit grouping separator character |
| `prefix` | `string` | `''` | Prefix text value |
| `suffix` | `string` | `''` | Suffix text value |
| `prefixComponent` | `Component` | `undefined` | Custom prefix icon component |
| `suffixComponent` | `Component` | `undefined` | Custom suffix icon component |
| `valueStyle` | `CSSProperties` | `undefined` | Custom value inline styling |
| `card` | `boolean` | `false` | Enable high-contrast brutal card base and shadow |
| `variant` | `'default' \| 'primary' \| 'accent' \| 'success' \| 'danger'` | `'default'` | Font theme color variation |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'lg'` | Font size scale |

## Accessibility

- **Motion Reduction**: The count-up transition respects operating system animations settings. If `prefers-reduced-motion` is active, digits will instantly render their target values to prevent dizziness.
