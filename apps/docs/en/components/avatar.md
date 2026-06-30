---
title: Avatar
description: Avatar component supporting images, fallback text, and brutalist borders in various shapes and sizes.
translated: true
---

# Avatar

Neo-brutalist avatar component for displaying user profile images with fallback support. Includes `Avatar`, `AvatarImage`, and `AvatarFallback` sub-components, supporting multiple variants, sizes, shapes, and status indicators.

## Demo

<ComponentPreview>
  <AvatarDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="avatar" />

## Usage

```vue
<script setup>
import { Avatar, AvatarImage, AvatarFallback } from 'brutx-ui-vue'
</script>

<template>
    <Avatar size="default" shape="square">
        <AvatarImage src="/avatar.jpg" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
    </Avatar>
</template>
```

### Fallback Behavior

When the image fails to load, `AvatarFallback` is automatically displayed:

```vue
<script setup>
import { Avatar, AvatarImage, AvatarFallback } from 'brutx-ui-vue'
</script>

<template>
    <Avatar>
        <AvatarImage src="/broken-url.jpg" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
    </Avatar>
</template>
```

### Status Indicator

Renders a small status dot at the bottom-right corner of the avatar (`w-3 h-3 rounded-full border-3 border-brutal-bg`). Not rendered when `status="none"` (default).

| Status | Color | Description |
| --- | --- | --- |
| `online` | `bg-brutal-success` | Online (green) |
| `offline` | `bg-brutal-muted` | Offline (gray) |
| `busy` | `bg-brutal-destructive` | Busy (red) |
| `none` | — | Not rendered (default) |

```vue
<script setup>
import { Avatar, AvatarFallback } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex items-center gap-4">
        <Avatar size="lg" status="online">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar size="lg" status="offline">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar size="lg" status="busy">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
    </div>
</template>
```

## Variants

Controls the background color of the avatar root container and `AvatarFallback`, passed down to sub-components via provide/inject.

| Variant | Root Container Background | Fallback Background |
| --- | --- | --- |
| `default` | `bg-brutal-muted` | `bg-brutal-muted` |
| `primary` | `bg-brutal-primary/20` | `bg-brutal-primary` |
| `secondary` | `bg-brutal-secondary/20` | `bg-brutal-secondary` |
| `accent` | `bg-brutal-accent/20` | `bg-brutal-accent` |

```vue
<script setup>
import { Avatar, AvatarFallback } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex items-center gap-4">
        <Avatar size="lg" variant="default">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar size="lg" variant="primary">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar size="lg" variant="secondary">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar size="lg" variant="accent">
            <AvatarFallback>JD</AvatarFallback>
        </Avatar>
    </div>
</template>
```

## Sizes

| Size | Dimensions |
| --- | --- |
| `sm` | `h-8 w-8` (32px) |
| `default` | `h-10 w-10` (40px) |
| `lg` | `h-14 w-14` (56px) |
| `xl` | `h-20 w-20` (80px) |

### Shapes

| Shape | Description |
| --- | --- |
| `square` | No border radius (default) |
| `rounded` | Uses the `--brutal-radius` token |

```vue
<script setup>
import { Avatar, AvatarFallback } from 'brutx-ui-vue'
</script>

<template>
    <Avatar size="lg" shape="rounded">
        <AvatarFallback>JD</AvatarFallback>
    </Avatar>
</template>
```

## Sub-components

| Component | Description |
| --- | --- |
| `Avatar` | Root container providing size, shape, variant, and status context |
| `AvatarImage` | Avatar image that automatically hides on load failure |
| `AvatarFallback` | Fallback content that automatically shows when the image is not visible |

## Props

### Avatar

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | Color variant, passed down to `AvatarFallback` |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | Size |
| `shape` | `'square' \| 'rounded'` | `'square'` | Shape |
| `status` | `'online' \| 'offline' \| 'busy' \| 'none'` | `'none'` | Status dot at the bottom-right corner |
| `class` | `string` | — | Additional class name |

### AvatarImage

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | — | Image URL |
| `alt` | `string` | — | Alternative text |
| `class` | `string` | — | Additional class name |

### AvatarFallback

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `class` | `string` | — | Additional class name |

## Slots

### Avatar Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `default` | — | Default slot for placing `AvatarImage` and `AvatarFallback` sub-components |

### AvatarFallback Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `default` | — | Default slot for placing fallback content (text or icon) |

## Accessibility

- **ARIA Attributes**: The status dot uses `role="status"` and `aria-label` attributes for screen reader support
- **Internationalization**: Status labels provide localized text via i18n:
  - `online` -> "Online"
  - `offline` -> "Offline"
  - `busy` -> "Busy"
