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
import { Checkbox, Label } from 'brutx-ui-vue'

const checked = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Checkbox v-model:checked="checked" id="accept-terms" />
        <Label for="accept-terms">Accept terms</Label>
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

Uncontrolled mode supports it too: `<Checkbox defaultValue="indeterminate" />` initially renders the `Minus` icon with `aria-checked="mixed"`. Per reka-ui semantics, clicking switches the state to `checked` — it does not return to indeterminate automatically.

```vue
<script setup>
import { Checkbox } from 'brutx-ui-vue'
</script>

<template>
    <Checkbox :checked="'indeterminate'" />
</template>
```

## API Reference

<ComponentApi name="checkbox" />

## Accessibility

- **Keyboard**: Supports `Space` key to toggle checked state
- **Accessible name priority**: `ariaLabelledby` takes precedence over `ariaLabel`, followed by visible text from an associated or wrapping `Label`. Locale fallback text is visually hidden and used only when no other name is provided.
- **Focus management**: Uses `--brutal-ring` token for visible focus ring

```vue
<script setup>
import { ref } from 'vue'
import { Checkbox, Label } from 'brutx-ui-vue'

const checked = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Checkbox v-model:checked="checked" id="marketing" />
        <Label for="marketing">Receive marketing emails</Label>
    </div>
</template>
```
