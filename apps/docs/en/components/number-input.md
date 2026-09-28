---
title: NumberInput
description: Numeric stepper input component with a pair of neobrutalist increment/decrement buttons and two layout options.
translated: true
---

# NumberInput

A text input for numeric values, with built-in long-press continuous scrolling logic for the increment/decrement buttons, and support for min, max, and precision step adjustments.

## Demo

<ComponentPreview>
  <NumberInputDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="number-input" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { NumberInput } from 'brutx-ui-vue'

const count = ref(5)
</script>

<template>
    <NumberInput v-model="count" :min="0" :max="10" :step="1" />
</template>
```

## Variants

NumberInput provides two button layout modes, configured via the `layout` prop:

| Layout Prop | Description |
| --- | --- |
| `split` (default) | **Split sides**: Minus button on the left, plus button on the right, with a bold symmetrical feel. |
| `stacked` | **Right-stacked**: Increment/decrement buttons stacked vertically on the right. |

```vue
<template>
    <!-- Split layout -->
    <NumberInput v-model="count" layout="split" />

    <!-- Stacked layout -->
    <NumberInput v-model="count" layout="stacked" />
</template>
```

### Border Style Variants

Set different border styles via the `variant` prop for form validation state feedback:

| Variant | Description |
| --- | --- |
| `default` | Standard border |
| `error` | Error border with danger color focus shadow |
| `success` | Success border with success color focus shadow |

```vue
<template>
    <NumberInput v-model="count" variant="default" />
    <NumberInput v-model="count" variant="error" />
    <NumberInput v-model="count" variant="success" />
</template>
```

## API Reference

<ComponentApi name="number-input" />

## Accessibility

- **Keyboard**: Input supports Tab focus, increment/decrement buttons support Enter/Space trigger, Up/Down arrow keys adjust the value
- **ARIA attributes**: Increment/decrement buttons automatically set `aria-label` (e.g. "Increase"/"Decrease"), input sets `aria-valuemin`, `aria-valuemax`, `aria-valuenow` attributes
- **Form integration**: Supports `name`, `required`, `disabled`, `readonly` and other native form attributes, compatible with form validation
- **Focus management**: `focusOnChange` prop controls whether to auto-focus on value change; all interaction is disabled in `disabled` state
- **Motion & sound degradation**: The Drum Ticker micro-animation on value change is disabled automatically under `prefers-reduced-motion`; the `sound` effect follows the browser autoplay policy and stays silent before user interaction
