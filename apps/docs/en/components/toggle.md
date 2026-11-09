---
title: Toggle
description: Standalone toggle button for on/off or selected/unselected states.
translated: true
---

# Toggle

Neobrutalist-styled toggle button built on reka-ui's Toggle primitive, with pressed state support.

## Demo

<ComponentPreview>
  <ToggleDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="toggle" />

## Usage

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import { Toggle } from 'brutx-ui-vue'
import { Bold, Italic, Underline } from '@lucide/vue'

const bold = ref(false)
const italic = ref(false)
const underline = ref(false)
</script>

<template>
    <div class="flex items-center gap-2">
        <Toggle v-model="bold" variant="default" size="default">
            <Bold class="h-4 w-4" />
        </Toggle>
        <Toggle v-model="italic" variant="default" size="default">
            <Italic class="h-4 w-4" />
        </Toggle>
        <Toggle v-model="underline" variant="default" size="default">
            <Underline class="h-4 w-4" />
        </Toggle>
    </div>
</template>
```

### Native Form

When `name` is provided, a pressed Toggle submits the value `true`; an unpressed Toggle omits the field. `required` requires the Toggle to be pressed. Disabled and loading Toggles are excluded from submission and required validation. Uncontrolled mode starts unpressed (`aria-pressed="false"`). Use `defaultValue` to set the initial state.

```vue
<script setup>
import { Toggle } from 'brutx-ui-vue'
</script>

<template>
    <form>
        <Toggle name="bold" required ariaLabel="Bold">Bold</Toggle>
    </form>
</template>
```

### Loading State

Display a loading indicator (`Loader2` spinning icon) via the `loading` prop. The button is automatically disabled and sets `aria-busy="true"`, suitable for async operation scenarios. During loading, the original slot content is replaced with the spinning icon.

```vue
<script setup>
import { Toggle } from 'brutx-ui-vue'
import { Bold } from '@lucide/vue'
</script>

<template>
    <Toggle loading aria-label="Bold">
        <Bold class="h-4 w-4" />
    </Toggle>
</template>
```

### Accessibility Label

Toggle does not automatically generate a default `aria-label`. When slot content is icon-only, it is recommended to provide readable text via the `ariaLabel` prop so screen readers can correctly announce the button's purpose.

```vue
<script setup>
import { ref } from 'vue'
import { Toggle } from 'brutx-ui-vue'
import { Bold } from '@lucide/vue'

const bold = ref(false)
</script>

<template>
    <Toggle v-model="bold" aria-label="Bold">
        <Bold class="h-4 w-4" />
    </Toggle>
</template>
```

## Variants

| Variant | Description |
| --- | --- |
| `default` | With background and small shadow, primary color background when pressed |
| `outline` | Transparent with border, secondary color background when pressed |

## Sizes

| Size | Height | Min Width | Font Size |
| --- | --- | --- | --- |
| `sm` | `h-8` | `min-w-8` | `text-xs` |
| `default` | `h-10` | `min-w-10` | `text-sm` |
| `lg` | `h-12` | `min-w-12` | `text-sm` |

`required` participates in native validation even without `name`; only enabled fields with a `name` are included in native form submission.

## API Reference

<ComponentApi name="toggle" />

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to trigger toggle
- **ARIA attributes**: Automatically manages `aria-pressed` state; sets `aria-busy="true"` during `loading`
- **Accessibility label**: Toggle does not automatically generate a default `aria-label`; when slot content is icon-only, provide readable text via the `ariaLabel` prop
