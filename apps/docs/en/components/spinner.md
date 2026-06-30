---
title: Spinner
description: Loading indicator component providing classic brutalist loading animations including spinning dots, spinning lines, and more.
translated: true
---

# Spinner

Neo-brutalist loading spinner offering 4 visual variants: standard, block, dots, and bars.

## Demo

<ComponentPreview>
  <SpinnerDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="spinner" />

## Usage

### Spinner (Standard)

```vue
<script setup>
import { Spinner } from 'brutx-ui-vue'
</script>

<template>
    <Spinner size="default" variant="default" />
</template>
```

### BlockSpinner

```vue
<script setup>
import { BlockSpinner } from 'brutx-ui-vue'
</script>

<template>
    <BlockSpinner size="default" />
</template>
```

### DotsSpinner

```vue
<script setup>
import { DotsSpinner } from 'brutx-ui-vue'
</script>

<template>
    <DotsSpinner size="default" />
</template>
```

### BarsSpinner

```vue
<script setup>
import { BarsSpinner } from 'brutx-ui-vue'
</script>

<template>
    <BarsSpinner size="default" />
</template>
```

## Variants

### Spinner Variants

| Variant | Description |
|------|------|
| `default` | Transparent top and right borders, spinning |
| `primary` | Primary color border, spinning |
| `secondary` | Secondary color border, spinning |
| `accent` | Transparent top and right accent color borders, spinning |

### Color Schemes

BlockSpinner, BarsSpinner, and DotsSpinner support the following color schemes:

| Color | Description |
|------|------|
| `default` | Default foreground color |
| `primary` | Primary color |
| `secondary` | Secondary color |
| `accent` | Accent color |
| `mixed` | Cycles through primary, secondary, accent, and info colors (BlockSpinner and BarsSpinner only) |

## Sizes

All spinner types support the following sizes:

| Size | Spinner | Block | Bars | Dots |
|------|---------|-------|------|------|
| `sm` | `h-5 w-5` | `h-5 w-5` | `h-4` | `gap-1` |
| `default` | `h-8 w-8` | `h-8 w-8` | `h-6` | `gap-2` |
| `lg` | `h-12 w-12` | `h-12 w-12` | `h-8` | `gap-3` |
| `xl` | `h-16 w-16` | `h-16 w-16` | `h-12` | `gap-4` |

## Animation

Each component uses different animation effects:

| Component | Animation Type | Description |
|------|----------|------|
| Spinner | `animate-spin` | Spinning animation |
| BlockSpinner | `animate-pulse` | Pulse animation with staggered delay across 4 blocks |
| BarsSpinner | `animate-pulse` | Pulse animation with staggered delay across 5 bars |
| DotsSpinner | `animate-bounce` | Bounce animation with staggered delay across 3 dots |

## Props

### Spinner

| Prop | Type | Default | Description |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | Size |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | Color variant |
| `label` | `string` | `t('spinner.loading')` | Accessibility label text |
| `class` | `string` | — | Custom style class |

### BlockSpinner / BarsSpinner

| Prop | Type | Default | Description |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | Size |
| `color` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'mixed'` | `'default'` | Color scheme; `mixed` cycles through multiple colors |
| `label` | `string` | `t('spinner.loading')` | Accessibility label text |
| `class` | `string` | — | Custom style class |

### DotsSpinner

| Prop | Type | Default | Description |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | Size |
| `color` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | Color scheme |
| `label` | `string` | `t('spinner.loading')` | Accessibility label text |
| `class` | `string` | — | Custom style class |

## Accessibility

- **ARIA Attributes**: All Spinner components automatically add the `role="status"` attribute
- **Screen Readers**: Provides screen reader labels via `aria-label`, using the `sr-only` class to hide visual text
- **Custom Labels**: The default label text is the localized "Loading..." and can be customized via the `label` prop
