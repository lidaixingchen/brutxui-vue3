---
title: Statistic
description: Neo-Brutalist statistic and numerical display component with high-precision big number safety, prefixes, suffixes, and localization.
---

# Statistic

Display key business metrics or quantitative numerical information with bold Neo-Brutalist aesthetics. Built on native `Intl.NumberFormat` and precision chunking algorithms to safeguard against floating-point distortion and integer truncation.

## Preview

<ComponentPreview>
  <StatisticDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="statistic" />

## Usage

```vue
<script setup>
import { Statistic } from 'brutx-ui-vue'
</script>

<template>
    <!-- Basic usage -->
    <Statistic title="Total Users" :value="128940" />

    <!-- Currency and precision -->
    <Statistic title="Revenue" :value="98234.5" prefix="$" :precision="2" />

    <!-- Trend indicator and card variant -->
    <Statistic
        title="Conversion Rate"
        :value="12.4"
        suffix="%"
        trend="up"
        variant="card"
    />
</template>
```

### Big Numbers and Precision Safety

Safely pass numerical strings or BigInts that exceed standard JavaScript safe integer limits without precision degradation:

```vue
<template>
    <Statistic title="Total Supply" value="900719925474099200000000" />
    <Statistic title="Staked Amount" :value="123456789012345678901234567890n" />
</template>
```

### Custom Group and Decimal Separators

```vue
<template>
    <Statistic
        title="European Style"
        :value="1234567.89"
        group-separator="."
        decimal-separator=","
        :precision="2"
    />
</template>
```

## Variants

| Variant | Description |
| ------- | ----------- |
| `default` | Default variant with lightweight inline layout and no extra border/background |
| `card` | Neo-Brutalist card with 3px solid border, hard drop shadow, padding, and rounded corners |
| `bordered` | Solid bordered card container without drop shadow |
| `subtle` | Highlighted subtle background card with solid border and hard drop shadow |

```vue
<template>
    <Statistic title="Default" :value="1200" variant="default" />
    <Statistic title="Card" :value="1200" variant="card" />
    <Statistic title="Bordered" :value="1200" variant="bordered" />
    <Statistic title="Subtle" :value="1200" variant="subtle" />
</template>
```

## Sizes

| Size | Title Font Size | Value Font Size | Trend Font Size |
| ---- | --------------- | --------------- | --------------- |
| `sm` | `text-xs` | `text-2xl` | `text-xs` |
| `default` | `text-sm` | `text-3xl sm:text-4xl` | `text-sm` |
| `lg` | `text-base` | `text-4xl sm:text-5xl` | `text-base` |

```vue
<template>
    <Statistic title="Small" :value="88" size="sm" variant="card" />
    <Statistic title="Default" :value="88" size="default" variant="card" />
    <Statistic title="Large" :value="88" size="lg" variant="card" />
</template>
```

## Exported Types

The component exports variant helper functions and TypeScript types for composition:

```ts
import type {
    StatisticProps,
    StatisticValue,
    StatisticVariantProps,
    StatisticContentVariantProps,
} from 'brutx-ui-vue'
import {
    statisticVariants,
    statisticTitleVariants,
    statisticContentVariants,
    statisticValueVariants,
    statisticTrendVariants,
} from 'brutx-ui-vue'
```

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `value` | `number \| string \| bigint \| null` | `undefined` | Numerical value to display, supports numbers, strings, and BigInt |
| `title` | `string` | `undefined` | Statistic item title |
| `prefix` | `string` | `undefined` | Prefix text before the value (e.g. `$` or `¥`) |
| `suffix` | `string` | `undefined` | Suffix text after the value (e.g. `%` or units) |
| `precision` | `number` | `undefined` | Number of decimal places to preserve |
| `decimalSeparator` | `string` | `'.'` | Decimal point separator |
| `groupSeparator` | `string` | `','` | Thousands group separator |
| `formatter` | `(val: StatisticValue) => string` | `undefined` | Custom formatting function |
| `placeholder` | `string` | `'-'` | Fallback placeholder text when value is empty or invalid |
| `trend` | `'up' \| 'down'` | `undefined` | Trend direction, rendering arrow icons with status colors |
| `trendPlacement` | `'prefix' \| 'suffix'` | `'suffix'` | Position of the trend indicator |
| `variant` | `'default' \| 'card' \| 'bordered' \| 'subtle'` | `'default'` | Visual container variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size preset |
| `class` | `string` | `undefined` | Custom CSS class name |

## Slots

| Slot | Scope | Description |
| ---- | ----- | ----------- |
| `default` | `{ value: StatisticValue; formatted: string }` | Custom content for the formatted value |
| `title` | `{ title?: string }` | Custom content for the title area |
| `prefix` | `{ prefix?: string }` | Custom content for the prefix area |
| `suffix` | `{ suffix?: string }` | Custom content for the suffix area |
| `trend` | `{ trend: 'up' \| 'down' }` | Custom content for the trend indicator |

## Accessibility

- **Keyboard Interaction**: As a pure presentation component, it does not receive keyboard focus by default; nested interactive controls in slots maintain standard Tab order.
- **ARIA Attributes**: Values are structured using semantic markup; trend icons include explicit `aria-label="up"` or `aria-label="down"` to satisfy color-independent perception standards.
- **Focus Management**: Static typographic container with no focus traps, preserving screen reader virtual cursor flow.
- **Motion Reduction**: Static display with no animations, natively conforming to system-level reduced motion preferences.
