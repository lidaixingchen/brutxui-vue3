---
title: Button
description: Neo-brutalist button component with 9 color variants, loading animation, and keyboard navigation.
translated: true
---

# Button

Neo-brutalist button component supporting 9 variants, 4 sizes + icon mode, loading state, and `asChild` composition support.

## Demo

<ComponentPreview>
  <ButtonDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="button" />

## Usage

```vue
<script setup>
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Button variant="primary" size="default">
        Click me
    </Button>
</template>
```

### Loading State

```vue
<script setup>
import { ref } from 'vue'
import { Button } from 'brutx-ui-vue'

const isLoading = ref(false)

async function handleSubmit() {
    isLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    isLoading.value = false
}
</script>

<template>
    <Button variant="primary" :loading="isLoading" @click="handleSubmit">
        Save Changes
    </Button>
</template>
```

### Disabled State

```vue
<script setup>
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Button variant="primary" disabled>
        Disabled
    </Button>
</template>
```

### Submit Button and Pending Text

Set `type="submit"` to render the button as a form submit button. Combined with `loading` and `pendingText`, the button displays a pending text (replacing the slot content) during submission. When `pendingText` is not provided, it falls back to the i18n default (`submitButton.submitting`):

```vue
<script setup>
import { ref } from 'vue'
import { Button } from 'brutx-ui-vue'

const isLoading = ref(false)

async function handleSubmit() {
    isLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    isLoading.value = false
}
</script>

<template>
    <form @submit.prevent="handleSubmit">
        <Button type="submit" variant="primary" :loading="isLoading" pending-text="Saving...">
            Save
        </Button>
    </form>
</template>
```

The pending text is shown and the slot content is hidden only when `type="submit"` and `loading=true`. In all other cases, the slot content renders normally and the loading icon still appears.

### asChild

Use `asChild` to render button styles onto a custom element (e.g., a router link):

```vue
<script setup>
import { Button } from 'brutx-ui-vue'
import { RouterLink } from 'vue-router'
</script>

<template>
    <Button as-child>
        <RouterLink to="/about">About</RouterLink>
    </Button>
</template>
```

### Glitch Effect

`Button` includes `effect="glitch"` for the glitch tear animation.

```vue
<template>
    <Button
        effect="glitch"
        variant="primary"
        glitch-trigger="click"
        glitch-speed="fast"
        glitch-direction="both"
        data-text="GLITCH"
    >
        GLITCH
    </Button>
</template>
```

> Note: when building a glitch button directly with the exported `buttonVariants({ effect: 'glitch' })`, pass `glitchSpeed` and `glitchDirection` explicitly — the `medium`/`horizontal` defaults are provided by the `<Button>` component, not by the raw utility function.

With the default `effect="none"`, Button creates no effect media listeners, timers, or text synchronization. Both autoplay and the exposed `play()` method respect this switch. Glitch playback stops while disabled, loading, or reduced motion is enabled. KeepAlive deactivation and unmount release resources; activation reads the current motion preference before resuming.

## Variants

| Variant | Description |
| ---- | ---- |
| `default` | Background color with hard shadow |
| `primary` | Primary (coral) background |
| `secondary` | Secondary (mint) background |
| `accent` | Accent (yellow) background |
| `danger` | Destructive (red) background with white text |
| `success` | Success (green) background |
| `outline` | Transparent background with inversion on hover |
| `ghost` | No border or shadow with subtle hover effect |
| `link` | No border or shadow with underline on hover |

```vue
<template>
    <Button variant="primary">Primary variant</Button>
</template>
```

## Decorative Flair

The `flair` dimension composes orthogonally with color variants, offering three mechanical texture modes:

| Flair | Description |
| ---- | ---- |
| `none` | Default; outputs no extra decoration classes |
| `stacked` | Multi-layer rainbow hard shadow with matched 1.5x press displacement |
| `hazard` | Warning stripes surround a solid yellow label with black text, preserving text contrast on hover |
| `ticket` | Ticket tear — semicircle notches at the left/right midpoints |

```vue
<template>
    <Button variant="primary" flair="stacked">Stacked shadow</Button>
    <Button variant="accent" flair="hazard">Hazard stripes</Button>
    <Button variant="default" flair="ticket">Ticket notch</Button>
</template>
```

## Sizes

| Size | Height | Padding | Font Size |
| ---- | ---- | ------ | -------- |
| `sm` | `h-9` | `px-3 py-1` | `text-sm` |
| `default` | `h-11` | `px-5 py-2` | `text-base` |
| `lg` | `h-14` | `px-8 py-3` | `text-lg` |
| `xl` | `h-16` | `px-10 py-4` | `text-xl` |
| `icon` | `h-11 w-11` | `p-0` | — |

## API Reference
 
<ComponentApi name="button" />

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to trigger click
- **ARIA Attributes**: Automatically sets the `disabled` attribute (non-`asChild` mode) or `aria-disabled="true"` (`asChild` mode) when disabled; automatically sets `aria-busy="true"` when loading
- **Focus Management**: Supports keyboard navigation and focus styles (`focus:outline`)
