---
title: Badge
description: Badge component for displaying status and classification labels with high-contrast bright or dark visuals.
translated: true
---

# Badge

Neo-brutalist inline badge component for labels, statuses, and categories. Supports multiple variants, sizes, dot indicator, pulse animation, and closable functionality.

## Demo

<ComponentPreview>
  <BadgeDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="badge" />

## Usage

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
</script>

<template>
    <Badge variant="default">Default</Badge>
    <Badge variant="primary">Primary</Badge>
    <Badge variant="success">Success</Badge>
</template>
```

### Dot Indicator

Renders a small dot before the badge content via the `dot` prop, commonly used for status indication. The dot color inherits the current text color (`bg-current`), and its size adjusts automatically with `size`.

| Size | Dot Size | Right Margin |
| ---- | -------- | ------ |
| `sm` | `h-1.5 w-1.5` | `mr-1` |
| `default` | `h-2 w-2` | `mr-1.5` |
| `lg` | `h-2.5 w-2.5` | `mr-2` |

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
</script>

<template>
    <Badge dot>Online</Badge>
    <Badge variant="success" dot>Available</Badge>
    <Badge variant="danger" dot>Offline</Badge>
    <Badge variant="accent" dot size="sm">Small</Badge>
</template>
```

### Pulse Animation

Enables pulse animation (`animate-brutal-badge-pulse`) for the dot via the `pulse` prop. `pulse` implies `dot`, so there is no need to set both. Suitable for real-time status, new message alerts, and other attention-grabbing scenarios.

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
</script>

<template>
    <Badge variant="success" pulse>Syncing</Badge>
    <Badge variant="danger" pulse>New Message</Badge>
    <Badge variant="primary" pulse>Live</Badge>
</template>
```

### Closable Badge

Renders a close button (X icon) on the right side of the badge via the `closable` prop. Clicking the button triggers the `close` event, and the event does not bubble (internally calls `stopPropagation`). The close button has built-in accessibility support; the `aria-label` is automatically adapted to the current language through the i18n system.

```vue
<script setup>
import { ref } from 'vue'
import { Badge } from 'brutx-ui-vue'

const tags = ref(['Vue', 'TypeScript', 'Tailwind CSS'])

function handleClose(index: number) {
    tags.value.splice(index, 1)
}
</script>

<template>
    <div class="flex flex-wrap items-center gap-2">
        <Badge
            v-for="(tag, index) in tags"
            :key="tag"
            variant="primary"
            closable
            @close="handleClose(index)"
        >
            {{ tag }}
        </Badge>
        <span v-if="tags.length === 0" class="text-sm text-brutal-fg">All tags closed</span>
    </div>
</template>
```

### Icon Slot

Inserts an icon before the badge content via the `icon` named slot. It is recommended to use the `@lucide/vue` icon library and set appropriate icon sizes based on `size`.

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
import { CheckCircle, AlertTriangle, Info } from '@lucide/vue'
</script>

<template>
    <Badge variant="success">
        <template #icon>
            <CheckCircle class="h-3.5 w-3.5" />
        </template>
        Completed
    </Badge>
    <Badge variant="danger">
        <template #icon>
            <AlertTriangle class="h-3.5 w-3.5" />
        </template>
        Needs Attention
    </Badge>
    <Badge variant="secondary">
        <template #icon>
            <Info class="h-3.5 w-3.5" />
        </template>
        Info
    </Badge>
</template>
```

### Combined Usage

Dot, icon slot, and close button can be used together:

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
import { Star } from '@lucide/vue'

function handleClose() {
    console.log('Badge closed')
}
</script>

<template>
    <Badge variant="primary" dot closable @close="handleClose">
        Status Badge
    </Badge>
    <Badge variant="accent" closable @close="handleClose">
        <template #icon>
            <Star class="h-3.5 w-3.5" />
        </template>
        Favorite
    </Badge>
</template>
```

## Variants

| Variant | Description |
| ---- | ---- |
| `default` | Standard background color with small shadow |
| `primary` | Primary (coral) background |
| `secondary` | Secondary (mint) background |
| `accent` | Accent (yellow) background |
| `danger` | Destructive (red) background |
| `success` | Success (green) background |
| `outline` | Transparent background, no shadow |

## Sizes

| Size | Padding | Font Size |
| ---- | ------ | -------- |
| `sm` | `px-2 py-0.5` | `text-xs` |
| `default` | `px-3 py-1` | `text-sm` |
| `lg` | `px-4 py-1.5` | `text-base` |

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
</script>

<template>
    <Badge variant="primary" size="sm">Small</Badge>
    <Badge variant="primary" size="default">Default</Badge>
    <Badge variant="primary" size="lg">Large</Badge>
</template>
```

## Exported Types

The component also exports the `badgeVariants` utility function, which can be used to reuse Badge style variants in custom components:

```ts
import { badgeVariants } from 'brutx-ui-vue'

// Returns a combined Tailwind class string
const classes = badgeVariants({ variant: 'primary', size: 'sm' })
```

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline'` | `'default'` | Color variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size |
| `dot` | `boolean` | `false` | Whether to show the dot indicator |
| `pulse` | `boolean` | `false` | Whether to enable pulse animation (implies `dot`) |
| `closable` | `boolean` | `false` | Whether to show the close button |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
| ---- | ---- | ---- |
| `close` | — | Fired when the close button is clicked (event bubbling is prevented) |

## Slots

| Slot | Scope | Description |
| ---- | ------ | ---- |
| `default` | — | Badge text content |
| `icon` | — | Icon content before the badge |

## Accessibility

- **Keyboard**: Close button supports `Space` / `Enter` to trigger
- **ARIA Attributes**: Close button automatically sets `aria-label`, adapted to the current language via the i18n system
- **Motion Reduction**: Respects `prefers-reduced-motion` system setting; pulse animation is automatically disabled
