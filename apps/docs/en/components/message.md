---
title: Message
translated: true
description: Functional message APIs covering useMessage, useDialog, and useMessageBox.
---

# Message

A neo-brutalist functional message system providing three APIs: `useMessage` (lightweight notifications), `useDialog` (modal dialogs), and `useMessageBox` (confirm/input prompts). All APIs use a singleton pattern that mounts on demand — no component declaration needed in templates.

## Demo

<ComponentPreview>
  <MessageDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="message" />

## Usage

### useMessage Basics

Use the `info`, `success`, `warning`, and `error` shortcut methods to display different types of messages.

```vue
<script setup>
import { useMessage } from 'brutx-ui-vue'

const { info, success, warning, error } = useMessage()
</script>

<template>
    <button @click="info('Info', 'This is an informational message')">Info</button>
    <button @click="success('Success', 'Operation completed successfully')">Success</button>
    <button @click="warning('Warning', 'Please review your input')">Warning</button>
    <button @click="error('Error', 'Operation failed, please try again')">Error</button>
</template>
```

### useMessage Custom Configuration

Use the `show` method with a full options object to customize duration, closability, and more.

```vue
<script setup>
import { useMessage } from 'brutx-ui-vue'

const { show } = useMessage()

function showCustom() {
    show({
        type: 'warning',
        title: 'Session Expiring',
        description: 'Your session will expire in 5 minutes. Please save your work.',
        duration: 8000,
        closable: true,
    })
}

function showPersistent() {
    show({
        type: 'error',
        title: 'Network Disconnected',
        description: 'Please check your network settings and try again.',
        duration: 0,
    })
}
</script>

<template>
    <button @click="showCustom">Custom Duration (8s)</button>
    <button @click="showPersistent">No Auto-close</button>
</template>
```

### useMessage Manual Close

Every method returns a `close` function. Call it to manually dismiss the corresponding message.

```vue
<script setup>
import { useMessage } from 'brutx-ui-vue'
import { ref } from 'vue'

const { info } = useMessage()
const closeFn = ref(null)

function open() {
    closeFn.value = info('Loading', 'Processing your request, please wait...')
}

function close() {
    closeFn.value?.()
}
</script>

<template>
    <button @click="open">Open Message</button>
    <button @click="close">Close Manually</button>
</template>
```

### useDialog Programmatic Dialog

Open a modal dialog programmatically with `useDialog` — no need to declare a `Dialog` component in the template.

```vue
<script setup>
import { useDialog } from 'brutx-ui-vue'

const { show } = useDialog()

async function openDialog() {
    const { close, promise } = show({
        title: 'Terms of Service',
        content: 'Please read and agree to the following terms...',
        draggable: true,
    })

    await promise
    console.log('Dialog closed')
}
</script>

<template>
    <button @click="openDialog">Open Dialog</button>
</template>
```

### useMessageBox Confirmation

Display a confirmation dialog with `useMessageBox`, supporting cancel button and custom button labels.

```vue
<script setup>
import { useMessageBox } from 'brutx-ui-vue'

const { show } = useMessageBox()

async function confirmDelete() {
    try {
        const { close, promise } = show({
            title: 'Confirm Deletion',
            message: 'This action cannot be undone. Are you sure?',
            type: 'warning',
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Delete',
        })

        await promise
        console.log('User confirmed')
    } catch (reason) {
        console.log('User cancelled:', reason)
    }
}
</script>

<template>
    <button @click="confirmDelete">Delete</button>
</template>
```

### useMessageBox with Input Validation

Enable `showInput` to display an input field, combined with `inputPattern` for regex validation.

```vue
<script setup>
import { useMessageBox } from 'brutx-ui-vue'

const { show } = useMessageBox()

async function promptEmail() {
    try {
        const { close, promise } = show({
            title: 'Enter Email',
            message: 'Please enter your email address to receive notifications.',
            showInput: true,
            inputPlaceholder: 'example@domain.com',
            inputPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            inputErrorMessage: 'Please enter a valid email address',
            showCancelButton: true,
        })

        const result = await promise
        console.log('Email:', result.value)
    } catch (reason) {
        console.log('User cancelled:', reason)
    }
}
</script>

<template>
    <button @click="promptEmail">Enter Email</button>
</template>
```

## Data Types

### MessageType

```ts
type MessageType = 'info' | 'success' | 'warning' | 'error'
```

### MessageOptions

```ts
interface MessageOptions {
    type?: 'info' | 'success' | 'warning' | 'error'
    title?: string
    description?: string
    duration?: number
    closable?: boolean
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Message type |
| `title` | `string` | `''` | Title text |
| `description` | `string` | — | Description text |
| `duration` | `number` | `3000` | Auto-close duration in milliseconds; set to `0` to disable auto-close |
| `closable` | `boolean` | `true` | Whether to show the close button |

### MessageItem

```ts
interface MessageItem {
    id: string
    type: MessageType
    title: string
    description?: string
    duration: number
    closable: boolean
}
```

### ShowDialogOptions

```ts
type RenderableContent = string | Component | VNode | (() => string | Component | VNode | null)

interface ShowDialogOptions {
    title?: string
    content?: RenderableContent
    footer?: RenderableContent
    draggable?: boolean
    dragHandle?: string | HTMLElement
    bounds?: 'parent' | 'viewport' | { top: number; left: number; right: number; bottom: number }
    initialPosition?: { x: number; y: number }
    resizable?: boolean
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    aspectRatio?: number
    showCloseButton?: boolean
    forceMount?: boolean
    fullscreen?: boolean
    beforeClose?: ((done: () => void) => void) | (() => boolean | Promise<boolean>)
    destroyOnClose?: boolean
    zIndex?: number
    class?: string
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | — | Dialog title |
| `content` | `RenderableContent` | — | Dialog content; supports string, component, VNode, or render function |
| `footer` | `RenderableContent` | — | Footer content |
| `draggable` | `boolean` | `false` | Whether the dialog is draggable |
| `dragHandle` | `string \| HTMLElement` | — | Drag handle (CSS selector or element) |
| `bounds` | `'parent' \| 'viewport' \| object` | `'viewport'` | Drag boundaries |
| `initialPosition` | `{ x: number; y: number }` | — | Initial position |
| `resizable` | `boolean` | `false` | Whether the dialog is resizable |
| `minWidth` | `number` | — | Minimum width |
| `minHeight` | `number` | — | Minimum height |
| `maxWidth` | `number` | — | Maximum width |
| `maxHeight` | `number` | — | Maximum height |
| `aspectRatio` | `number` | — | Lock aspect ratio |
| `showCloseButton` | `boolean` | `true` | Whether to show the close button |
| `forceMount` | `boolean` | — | Force mount |
| `fullscreen` | `boolean` | `false` | Fullscreen mode |
| `beforeClose` | `((done) => void) \| (() => boolean \| Promise<boolean>)` | — | Close hook (supports callback and Promise mode) |
| `destroyOnClose` | `boolean` | `false` | Destroy content after closing |
| `zIndex` | `number` | — | Custom z-index |
| `class` | `string` | — | Custom CSS class |

### MessageBoxOptions

```ts
interface MessageBoxOptions extends ShowDialogOptions {
    message?: string
    type?: 'info' | 'success' | 'warning' | 'error'
    showCancelButton?: boolean
    cancelButtonText?: string
    confirmButtonText?: string
    confirmButtonClass?: string
    cancelButtonClass?: string
    showInput?: boolean
    inputPlaceholder?: string
    inputValue?: string
    inputPattern?: RegExp
    inputErrorMessage?: string
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `message` | `string` | — | Prompt message text |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | — | Message type |
| `showCancelButton` | `boolean` | `false` | Whether to show the cancel button |
| `cancelButtonText` | `string` | `'Cancel'` / `'取消'` | Cancel button text (auto-switches by locale) |
| `confirmButtonText` | `string` | `'Confirm'` / `'确定'` | Confirm button text (auto-switches by locale) |
| `confirmButtonClass` | `string` | — | Custom CSS class for the confirm button |
| `cancelButtonClass` | `string` | — | Custom CSS class for the cancel button |
| `showInput` | `boolean` | `false` | Whether to show an input field |
| `inputPlaceholder` | `string` | — | Input placeholder text |
| `inputValue` | `string` | `''` | Initial input value |
| `inputPattern` | `RegExp` | — | Input validation regex |
| `inputErrorMessage` | `string` | `'Invalid format'` | Validation error message |

## Composables

### useMessage

```ts
import { useMessage } from 'brutx-ui-vue'

const {
    info,      // (title: string, description?: string) => () => void
    success,   // (title: string, description?: string) => () => void
    warning,   // (title: string, description?: string) => () => void
    error,     // (title: string, description?: string) => () => void
    show,      // (options: MessageOptions) => () => void
} = useMessage()
```

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `info` | `(title: string, description?: string)` | `() => void` | Show an info message; returns a close function |
| `success` | `(title: string, description?: string)` | `() => void` | Show a success message; returns a close function |
| `warning` | `(title: string, description?: string)` | `() => void` | Show a warning message; returns a close function |
| `error` | `(title: string, description?: string)` | `() => void` | Show an error message; returns a close function |
| `show` | `(options: MessageOptions)` | `() => void` | Show a custom message; returns a close function |

Key features:
- **Singleton pattern**: Automatically mounts `MessageContainer` to `body` on first call — no manual declaration needed
- **Stacked animations**: Multiple messages stack vertically via `TransitionGroup` with smooth reordering
- **Auto-close**: Closes automatically after 3 seconds by default; customize with `duration`, set to `0` to disable
- **Manual close**: Each method returns a `close` function — call it to dismiss the message immediately
- **Auto-cleanup**: The container DOM is automatically unmounted 500ms after all messages are closed, ensuring proper garbage collection
- **SSR safe**: Uses an internal `isClient` guard; no side effects or errors in server-side rendering

### useDialog

```ts
import { useDialog } from 'brutx-ui-vue'

const {
    show,      // (options?: ShowDialogOptions) => { close: () => void; promise: Promise<void> }
} = useDialog()
```

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `show` | `(options?: ShowDialogOptions)` | `{ close, promise }` | Open a dialog |

Return values:

| Property | Type | Description |
|----------|------|-------------|
| `close` | `() => void` | Manually close the dialog |
| `promise` | `Promise<void>` | Resolves when the dialog is closed |

### useMessageBox

```ts
import { useMessageBox } from 'brutx-ui-vue'

const {
    show,      // (options?: MessageBoxOptions) => { close: () => void; promise: Promise<{ value: string } | undefined> }
} = useMessageBox()
```

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `show` | `(options?: MessageBoxOptions)` | `{ close, promise }` | Open a confirm/input prompt |

Return values:

| Property | Type | Description |
|----------|------|-------------|
| `close` | `() => void` | Manually close the message box |
| `promise` | `Promise<{ value: string } \| undefined>` | Resolves on confirm (`undefined` without input, `{ value }` with input); rejects with `'cancel'` on cancel or `'close'` on close |

## Accessibility

- **Keyboard**: Dialogs support `Escape` to close
- **ARIA Attributes**: Messages use `role="status"` and `aria-live="polite"` to notify screen readers; the close button includes a localized `aria-label` for screen reader support
- **Focus Management**: `useDialog` and `useMessageBox` are built on reka-ui's `DialogRoot`, trapping focus on open and restoring it on close
- **Reduced Motion**: Respects the `prefers-reduced-motion` system setting and automatically simplifies transition animations

## FAQ

**Q: What is the difference between useMessage and useToast?**

A: `useMessage` is a lightweight top-center notification, ideal for brief operation feedback. `useToast` offers richer features including configurable positions, stacking options, Promise tracking, and hover-to-pause — better suited for complex notification scenarios.

**Q: Will message notifications cause errors in SSR?**

A: No. `useMessage` uses an internal `isClient` guard, so calling it in a server-side rendering environment produces no side effects and no errors.

**Q: How do I perform async validation before closing a dialog?**

A: Use the `beforeClose` hook, which supports both callback and Promise modes:

```vue
<script setup>
import { useDialog } from 'brutx-ui-vue'

const { show } = useDialog()

function openWithValidation() {
    show({
        title: 'Edit Profile',
        content: 'Form content...',
        beforeClose: async () => {
            const isValid = await validateForm()
            return isValid
        },
    })
}
</script>
```

**Q: When does the useMessageBox promise reject?**

A: The promise rejects in two cases: when the user clicks the cancel button (reject value: `'cancel'`), or when the user closes via the close button or overlay click (reject value: `'close'`). Use `try/catch` to distinguish the close reason.
