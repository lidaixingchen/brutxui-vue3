---
title: Radio Group
description: Radio button group component for single selection among mutually exclusive options.
translated: true
---

# Radio Group

Neobrutalist-styled radio group built on reka-ui's RadioGroup primitive, used for single selection.

## Demo

<ComponentPreview>
  <RadioGroupDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="radio-group" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { RadioGroup, RadioGroupItem, Label } from 'brutx-ui-vue'

const selected = ref('comfortable')
</script>

<template>
    <RadioGroup v-model="selected">
        <div class="flex items-center gap-3">
            <RadioGroupItem value="default" />
            <Label for="default">Default</Label>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="comfortable" />
            <Label for="comfortable">Comfortable</Label>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="compact" />
            <Label for="compact">Compact</Label>
        </div>
    </RadioGroup>
</template>
```

### Accessibility Label

Provide a readable name for the radio group via `ariaLabel`, making it easier for screen readers to identify the group's purpose. This is especially useful when there is no visible group heading (such as a `Label` or fieldset legend).

```vue
<script setup>
import { ref } from 'vue'
import { RadioGroup, RadioGroupItem } from 'brutx-ui-vue'

const density = ref('comfortable')
</script>

<template>
    <RadioGroup v-model="density" aria-label="Layout density">
        <div class="flex items-center gap-3">
            <RadioGroupItem value="default" />
            <span class="text-sm font-bold">Default</span>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="comfortable" />
            <span class="text-sm font-bold">Comfortable</span>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="compact" />
            <span class="text-sm font-bold">Compact</span>
        </div>
    </RadioGroup>
</template>
```

## Variants

| Variant | Description |
| --- | --- |
| `default` | Default style, uses Primary (coral) background when selected |
| `secondary` | Uses Secondary background when selected |
| `accent` | Uses Accent background when selected |
| `success` | Uses Success background when selected |
| `danger` | Uses Danger background when selected |

```vue
<template>
    <RadioGroupItem value="option" variant="danger" />
</template>
```

## Sizes

| Size | Description |
| --- | --- |
| `sm` | Small (20 x 20) |
| `default` | Default (24 x 24) |
| `lg` | Large (28 x 28) |

## Sub-components

| Component | Description |
| --- | --- |
| `RadioGroup` | Root container, manages selected state and keyboard navigation |
| `RadioGroupItem` | Radio option, each option corresponds to a selectable value |

## API Reference

<span id="radiogroup"></span>
<span id="radiogroupitem"></span>
<span id="radiogroup-1"></span>

<ComponentApi name="radio-group" />

## Accessibility

- **Keyboard**: Arrow keys navigate between radio options, Space key selects the currently focused option
- **ARIA attributes**: Selected option uses `aria-checked="true"`, supports providing a readable group name via `ariaLabel`
- **Focus management**: `Tab` key focuses the selected option or the first option, arrow keys cycle focus between options
