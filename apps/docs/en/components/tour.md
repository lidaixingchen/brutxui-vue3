---
title: Tour
translated: true
description: A step-by-step guided tour component with canvas cutout mask and popover panels for onboarding users.
---

# Tour

A neo-brutalist step-by-step guided tour component. Uses a canvas cutout mask to highlight target elements with popover panels for step descriptions. Supports four-directional placement, keyboard navigation, and viewport boundary constraints to help users quickly learn interface features.

## Demo

<ComponentPreview>
  <TourDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="tour" />

## Usage

### Basic Usage

Define a steps array and control the tour's visibility and current step via `v-model:open` and `v-model:current`:

```vue
<script setup>
import { ref } from 'vue'
import { Tour } from 'brutx-ui-vue'

const isOpen = ref(true)
const current = ref(0)

const steps = [
    {
        target: '#step-nav',
        title: 'Navigation',
        description: 'This is the main navigation area with links to key sections.',
        placement: 'bottom',
    },
    {
        target: '#step-search',
        title: 'Search',
        description: 'Use the search bar to quickly find what you need.',
        placement: 'right',
    },
    {
        target: '#step-profile',
        title: 'Profile',
        description: 'Click your avatar to manage your profile settings.',
        placement: 'left',
    },
]
</script>

<template>
    <Tour v-model:open="isOpen" v-model:current="current" :steps="steps" />
</template>
```

### Custom Placement and Mask

Each step can independently set the popover direction (`placement`) and whether to show the mask (`mask`). When not specified on a step, the component-level `mask` prop is inherited (defaults to `true`).

```vue
<script setup>
import { ref } from 'vue'
import { Tour } from 'brutx-ui-vue'

const isOpen = ref(true)
const current = ref(0)

const steps = [
    {
        target: '#hero-section',
        title: 'Welcome',
        description: 'This is the hero section.',
        placement: 'top',
        mask: true,
    },
    {
        target: '#sidebar',
        title: 'Sidebar',
        description: 'The sidebar has no mask overlay.',
        placement: 'right',
        mask: false,
    },
]
</script>

<template>
    <Tour v-model:open="isOpen" v-model:current="current" :steps="steps" />
</template>
```

### Listening to Events

Respond to user actions via the `@skip`, `@finish`, and `@close` events:

```vue
<script setup>
import { ref } from 'vue'
import { Tour } from 'brutx-ui-vue'

const isOpen = ref(true)
const current = ref(0)

const steps = [
    { target: '#feature-a', title: 'Feature A', description: 'Learn about Feature A.' },
    { target: '#feature-b', title: 'Feature B', description: 'Learn about Feature B.' },
]

const onSkip = () => {
    console.log('User skipped the tour')
}

const onFinish = () => {
    console.log('User completed all steps')
}

const onClose = () => {
    console.log('Tour closed')
}
</script>

<template>
    <Tour
        v-model:open="isOpen"
        v-model:current="current"
        :steps="steps"
        @skip="onSkip"
        @finish="onFinish"
        @close="onClose"
    />
</template>
```

### Custom Scroll Behavior

Customize how the target element scrolls into view via `scrollIntoViewOptions`:

```vue
<script setup>
import { ref } from 'vue'
import { Tour } from 'brutx-ui-vue'

const isOpen = ref(true)
const current = ref(0)

const steps = [
    { target: '#section-1', title: 'Section 1', description: 'Content at the top of the page.' },
    { target: '#section-2', title: 'Section 2', description: 'Requires scrolling down to see.' },
]
</script>

<template>
    <Tour
        v-model:open="isOpen"
        v-model:current="current"
        :steps="steps"
        :scroll-into-view-options="{ behavior: 'smooth', block: 'center' }"
    />
</template>
```

## Data Types

### TourStep

```ts
interface TourStep {
    target: string | HTMLElement
    title?: string
    description?: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    mask?: boolean
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `target` | `string \| HTMLElement` | — | Target element as a CSS selector string or DOM element reference (required) |
| `title` | `string` | — | Step title |
| `description` | `string` | — | Step description text |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Popover direction relative to the target element |
| `mask` | `boolean` | — | Whether to show the mask for this step; inherits from the component-level `mask` prop when not specified |

## Exported Types

```ts
import type { TourStep, TourProps } from 'brutx-ui-vue'
```

## Props

### TourStep

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `target` | `string \| HTMLElement` | — | Target element as a CSS selector string or DOM element reference (required) |
| `title` | `string` | — | Step title |
| `description` | `string` | — | Step description text |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Popover direction relative to the target element |
| `mask` | `boolean` | — | Whether to show the mask for this step; inherits from the component-level `mask` prop when not specified |

### Tour

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `TourStep[]` | — | Array of tour step data (required) |
| `mask` | `boolean` | `true` | Whether to show the mask (global default, can be overridden by individual step's `mask`) |
| `scrollIntoViewOptions` | `ScrollIntoViewOptions` | `{ block: 'center', inline: 'nearest' }` | Options for scrolling the target element into view when switching steps |
| `v-model:current` | `number` | `0` | Current step index, two-way bound |
| `v-model:open` | `boolean` | `true` | Whether the tour is visible, two-way bound |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:current` | `(val: number)` | Emitted when the current step changes |
| `update:open` | `(val: boolean)` | Emitted when the open/close state changes |
| `skip` | — | Emitted when the user clicks the "Skip" button |
| `finish` | — | Emitted when the user clicks "Finish" on the last step |
| `close` | — | Emitted when the tour closes (triggered by both skip and finish) |

## Accessibility

- **Keyboard**: Press `Escape` to skip the tour, press `Enter` to advance to the next step or finish the tour
- **ARIA Attributes**: Step title and description in the popover panel are rendered with semantic markup; buttons include accessible text labels
- **Focus Management**: Buttons inside the popover panel are focusable while the tour is open; focus is released when the tour closes
- **Viewport Constraints**: The popover panel is automatically constrained within the viewport safe area and will not overflow screen edges

## FAQ

**Q: What happens if the target element is outside the visible area?**

A: The Tour automatically calls `scrollIntoView` when switching steps to scroll the target element to the center of the viewport. You can customize the scroll behavior via the `scrollIntoViewOptions` prop, for example `{ behavior: 'smooth', block: 'start' }` for smooth scrolling to the top.

**Q: The mask position is incorrect after the target element resizes.**

A: The Tour internally uses `ResizeObserver` to monitor target element size changes and automatically recalculates the mask cutout area and popover position. Global `scroll` and `resize` event listeners are also registered to prevent positioning drift caused by page scrolling or window resizing. All listeners are automatically cleaned up when the component unmounts.

**Q: How do I use a DOM element reference instead of a CSS selector?**

A: The `target` prop accepts an `HTMLElement` instance directly. In Vue, you can use a template ref to obtain the element and pass it to `target`:

```vue
<script setup>
import { ref } from 'vue'
import { Tour } from 'brutx-ui-vue'

const targetEl = ref(null)
const isOpen = ref(true)
const current = ref(0)
const steps = [{ target: targetEl, title: 'Title', description: 'Description' }]
</script>

<template>
    <div ref="targetEl">Target element</div>
    <Tour v-model:open="isOpen" v-model:current="current" :steps="steps" />
</template>
```

**Q: How do I run custom logic after the last step?**

A: Listen to the `@finish` event. It is emitted when the user completes all steps and clicks the "Finish" button. The `@close` event is also emitted in both skip and finish scenarios, making it suitable for unified cleanup logic after the tour ends.
