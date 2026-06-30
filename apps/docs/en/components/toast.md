---
title: Toast
translated: true
description: Global notification bubble component supporting success, error, info, and other notification types.
---

# Toast

A neo-brutalist notification toast system providing the `useToast` composable, 5 variants, and `ToastContainer` for rendering.

## Demo

<ComponentPreview>
  <ToastDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="toast" />

## Usage

```vue
<script setup>
import { ToastContainer } from 'brutx-ui-vue'
</script>

<template>
    <router-view />
    <ToastContainer />
</template>
```

### Using useToast

```vue
<script setup>
import { useToast } from 'brutx-ui-vue'

const { success, error, warning, info, addToast } = useToast()

function handleSave() {
    success('Saved!', 'Your changes have been saved.')
}

function handleError() {
    error('Error', 'Something went wrong. Please try again.')
}
</script>

<template>
    <button @click="handleSave">Save</button>
    <button @click="handleError">Trigger Error</button>
</template>
```

### Custom Toast

```vue
<script setup>
import { useToast } from 'brutx-ui-vue'

const { addToast } = useToast()

function showCustomToast() {
    addToast({
        variant: 'warning',
        title: 'Warning',
        description: 'Your session will expire in 5 minutes.',
        duration: 10000,
    })
}
</script>
```

### Hover Pause

`Toast` has `pauseOnHover` enabled by default (`true`): when the mouse enters the toast, the countdown timer and top progress bar animation are paused; when the mouse leaves, the timer resumes from the remaining time. This helps users read longer content. Set `:pause-on-hover="false"` to disable this behavior.

> Note: `pauseOnHover` is a prop on the `<Toast>` component itself, not passed through `useToast`'s `addToast` / `ToastItem`. When rendering `<Toast>` inside a custom `ToastContainer`, bind it directly.

```vue
<script setup>
import { useToast, ToastContainer, Toast } from 'brutx-ui-vue'

const { toasts, addToast, removeToast } = useToast()
</script>

<template>
    <ToastContainer position="bottom-right">
        <Toast
            v-for="toast in toasts"
            :key="toast.id"
            :duration="toast.duration"
            :pause-on-hover="true"
            @close="removeToast(toast.id)"
        />
    </ToastContainer>

    <button @click="addToast({ title: 'Hover Me', description: 'Hover over the toast to pause the countdown.', duration: 10000 })">
        Show Pausable Toast
    </button>
</template>
```

## Variants

| Variant | Background | Icon |
|---------|------------|------|
| `default` | `bg-brutal-bg` | `Zap` |
| `success` | `bg-brutal-success` | `CheckCircle` |
| `error` | `bg-brutal-destructive` | `AlertCircle` |
| `warning` | `bg-brutal-accent` | `AlertTriangle` |
| `info` | `bg-brutal-secondary` | `Info` |

All variants use `text-brutal-fg` text color and `shadow-brutal-lg` shadow.

## Sizes

| Size | Width |
|------|-------|
| `sm` | `w-72` (288px) |
| `default` | `w-80` (320px) |
| `lg` | `w-96` (384px) |

## Data Types

### ToastItem

```ts
interface ToastItem {
    id: string
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
    size?: 'sm' | 'default' | 'lg'
    title?: string
    description?: string
    duration?: number
}
```

### PromiseToastOptions

```ts
interface PromiseToastOptions<T> {
    loading: string                                        // loading state text
    success: string | ((data: T) => string)                // success text or formatter function
    error: string | ((error: Error) => string)             // error text or formatter function
    duration?: number                                      // display duration after success/error
    loadingVariant?: 'default' | 'success' | 'error' | 'warning' | 'info'  // loading state variant
    successVariant?: 'default' | 'success' | 'error' | 'warning' | 'info'  // success state variant
    errorVariant?: 'default' | 'success' | 'error' | 'warning' | 'info'    // error state variant
}
```

## Composables

### useToast

```ts
import { useToast } from 'brutx-ui-vue'

const {
    toasts,          // Ref<ToastItem[]> - reactive toast list
    addToast,        // (toast: Omit<ToastItem, 'id'>) => string
    removeToast,     // (id: string) => void
    clearToasts,     // () => void
    clearAllTimers,  // () => void
    success,         // (title: string, description?: string) => string
    error,           // (title: string, description?: string) => string
    warning,         // (title: string, description?: string) => string
    info,            // (title: string, description?: string) => string
    promise,         // <T>(promise: Promise<T> | (() => Promise<T>), options: PromiseToastOptions<T>) => Promise<T>
} = useToast()
```

#### Return Values

| Prop | Type | Description |
|------|------|-------------|
| `toasts` | `Ref<ToastItem[]>` | Reactive toast list |
| `addToast` | `(toast: Omit<ToastItem, 'id'>) => string` | Add a custom toast, returns the toast ID |
| `removeToast` | `(id: string) => void` | Remove a specific toast |
| `clearToasts` | `() => void` | Clear all toasts |
| `clearAllTimers` | `() => void` | Clear all timers |
| `success` | `(title: string, description?: string) => string` | Show a success toast |
| `error` | `(title: string, description?: string) => string` | Show an error toast |
| `warning` | `(title: string, description?: string) => string` | Show a warning toast |
| `info` | `(title: string, description?: string) => string` | Show an info toast |
| `promise` | `<T>(promise: Promise<T> \| (() => Promise<T>), options: PromiseToastOptions<T>) => Promise<T>` | Automatically track Promise state |

### provideToast

Call `provideToast()` in the app root component to provide the toast instance. Child components will automatically inject the instance via `useToast()`.

```vue
<!-- App.vue -->
<script setup>
import { provideToast } from 'brutx-ui-vue'

provideToast()
</script>
```

> Note: If `provideToast()` is not called, `useToast()` will fall back to a shared singleton and output a warning.

### Promise Toast

Automatically tracks Promise state, showing a loading -> success/error flow:

```vue
<script setup>
import { useToast } from 'brutx-ui-vue'

const { promise } = useToast()

async function handleSave() {
    await promise(saveData(), {
        loading: 'Saving...',
        success: 'Saved successfully!',
        error: 'Save failed, please try again',
    })
}
</script>
```

## Props

### Toast

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'success' \| 'error' \| 'warning' \| 'info'` | `'default'` | Toast type |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size |
| `title` | `string` | — | Title text |
| `description` | `string` | — | Description text |
| `duration` | `number` | `5000` | Display duration (in milliseconds); set to `0` to disable auto-close |
| `pauseOnHover` | `boolean` | `true` | Pause the countdown timer and progress bar animation on hover; resume from remaining time when the mouse leaves |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'xl'` | Main icon size |
| `class` | `string` | — | Custom CSS class |

### ToastContainer

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right' \| { x: number; y: number; anchor?: string }` | `'bottom-right'` | Display position |
| `stack` | `{ maxVisible?: number; gap?: number; expandDirection?: 'up' \| 'down' }` | `{ maxVisible: 5, gap: 12, expandDirection: 'down' }` | Stack configuration |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `close` | — | Emitted when the toast closes (after animation completes) |

## Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Custom content, rendered below the title and description |

## Accessibility

- **Keyboard**: Supports `Escape` to close the current toast
- **ARIA Attributes**: The Toast container uses `role="status"` and `aria-live="polite"` to notify screen readers
- **Reduced Motion**: Respects the `prefers-reduced-motion` system setting and automatically disables or simplifies animations
