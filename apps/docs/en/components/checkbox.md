---
title: Checkbox
description: Checkbox component with thick borders and a bold check icon, with full keyboard support.
translated: true
---

# Checkbox

Neobrutalist-styled checkbox built on reka-ui's CheckboxRoot primitive, with a check indicator.

## Demo

<ComponentPreview>
  <CheckboxDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="checkbox" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Checkbox } from 'brutx-ui-vue'

const checked = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Checkbox v-model:checked="checked" />
        <span class="text-sm font-bold">Accept terms</span>
    </div>
</template>
```

## Variants

| Variant | Description |
| --- | --- |
| `default` | Default background, standard foreground |
| `primary` | Primary (coral) background |
| `secondary` | Secondary (mint) background |
| `accent` | Accent (yellow) background |
| `danger` | Danger (red) background |

```vue
<template>
    <Checkbox variant="primary" />
</template>
```

## Sizes

| Size | Description |
| --- | --- |
| `sm` | Small |
| `default` | Default |
| `lg` | Large |

### With Label

```vue
<script setup>
import { ref } from 'vue'
import { Checkbox, Label } from 'brutx-ui-vue'

const checked = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Checkbox v-model:checked="checked" id="terms" />
        <Label for="terms">Accept terms and conditions</Label>
    </div>
</template>
```

### Disabled State

```vue
<script setup>
import { Checkbox } from 'brutx-ui-vue'
</script>

<template>
    <Checkbox disabled />
</template>
```

### Indeterminate State

Set `checked` to `'indeterminate'` to display the indeterminate state. The indicator shows a `Minus` icon, commonly used for "partially selected" hierarchical selection scenarios.

```vue
<script setup>
import { Checkbox } from 'brutx-ui-vue'
</script>

<template>
    <Checkbox :checked="'indeterminate'" />
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` | `boolean \| 'indeterminate'` | — | Checked state |
| `disabled` | `boolean` | `false` | Whether disabled |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger'` | `'default'` | Color variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size |
| `ariaLabel` | `string` | Locale default (`checkbox.check`) | Accessibility label |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:checked` | `boolean \| 'indeterminate'` | Triggered when checked state changes, supports `v-model:checked` two-way binding |

## Accessibility

- **Keyboard**: Supports `Space` key to toggle checked state
- **ARIA attributes**: Checkbox provides `aria-label` via locale by default. Falls back to `t('checkbox.check')` when not provided. Can be omitted when adjacent visible text already describes the purpose; otherwise, provide a more specific description via `ariaLabel`
- **Focus management**: Uses `--brutal-ring` token for visible focus ring

```vue
<script setup>
import { ref } from 'vue'
import { Checkbox, Label } from 'brutx-ui-vue'

const checked = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Checkbox v-model:checked="checked" id="marketing" ariaLabel="Receive marketing emails" />
        <Label for="marketing">Receive marketing emails</Label>
    </div>
</template>
```
