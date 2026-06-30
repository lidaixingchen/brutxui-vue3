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

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `number \| null` | — | Current input value |
| `defaultValue` | `number` | — | Default value when uncontrolled |
| `min` | `number` | — | Minimum allowed value |
| `max` | `number` | — | Maximum allowed value |
| `step` | `number` | `1` | Increment/decrement step size |
| `stepSnapping` | `boolean` | `true` | Whether to enable step snapping; when `false`, value does not auto-align to step multiples |
| `focusOnChange` | `boolean` | `false` | Whether to auto-focus the input when value changes |
| `formatOptions` | `Intl.NumberFormatOptions` | — | Number formatting options, affects display and allowed input characters |
| `locale` | `string` | — | Locale for formatting and currency |
| `layout` | `'split' \| 'stacked'` | `'split'` | Layout structure for the adjustment buttons |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Border style variant |
| `errorMessage` | `string` | — | Error message text, only displayed when `variant="error"` |
| `placeholder` | `string` | `undefined` | Placeholder; uses internationalized default when not set |
| `disabled` | `boolean` | `false` | Whether to disable the input and buttons |
| `readonly` | `boolean` | `false` | Whether readonly |
| `disableWheelChange` | `boolean` | `false` | Whether to prevent mouse wheel from changing the value |
| `invertWheelChange` | `boolean` | `false` | Whether to invert the scroll wheel direction |
| `name` | `string` | — | Form field name, submitted with the form |
| `required` | `boolean` | `false` | Whether the field is required |
| `id` | `string` | — | Element id attribute |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | Size of the increment/decrement button icons |
| `as` | `string \| Component` | `'div'` | Tag or component to render the root element as |
| `asChild` | `boolean` | `false` | Whether to enable composition mode, not rendering its own DOM and passing props to the child element |
| `class` | `string` | `undefined` | Custom CSS class for the container |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `(val: number)` | Triggered when the input value changes |

## Accessibility

- **Keyboard**: Input supports Tab focus, increment/decrement buttons support Enter/Space trigger, Up/Down arrow keys adjust the value
- **ARIA attributes**: Increment/decrement buttons automatically set `aria-label` (e.g. "Increase"/"Decrease"), input sets `aria-valuemin`, `aria-valuemax`, `aria-valuenow` attributes
- **Form integration**: Supports `name`, `required`, `disabled`, `readonly` and other native form attributes, compatible with form validation
- **Focus management**: `focusOnChange` prop controls whether to auto-focus on value change; all interaction is disabled in `disabled` state
