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

## Sizes

| Size | Height | Padding | Font Size |
| ---- | ---- | ------ | -------- |
| `sm` | `h-9` | `px-3 py-1` | `text-sm` |
| `default` | `h-11` | `px-5 py-2` | `text-base` |
| `lg` | `h-14` | `px-8 py-3` | `text-lg` |
| `xl` | `h-16` | `px-10 py-4` | `text-xl` |
| `icon` | `h-11 w-11` | `p-0` | — |

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Button variant style |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'icon'` | `'default'` | Button size; `icon` is a square icon button |
| `asChild` | `boolean` | `false` | Renders button styles onto the child element, useful for composing router links, etc. |
| `loading` | `boolean` | `false` | Shows loading animation and disables the button |
| `disabled` | `boolean` | `false` | Disables the button |
| `class` | `string` | `undefined` | Custom CSS class name |

## Events

The Button component propagates all native DOM events (e.g., `click`, `mouseenter`, etc.) without additional configuration.

| Event | Payload | Description |
| ---- | ---- | ---- |
| `click` | `MouseEvent` | Fired when the button is clicked; not triggered in loading or disabled state |

## Slots

| Slot | Scope | Description |
| ---- | ---- | ---- |
| `default` | — | Button content |

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to trigger click
- **ARIA Attributes**: Automatically sets the `disabled` attribute (non-`asChild` mode) or `aria-disabled="true"` (`asChild` mode) when disabled; automatically sets `aria-busy="true"` when loading
- **Focus Management**: Supports keyboard navigation and focus styles (`focus:outline`)
