---
title: MessageBox
description: Structured feedback modal with support for confirmations, status icons, input prompt validation, and deterministic non-rejecting Promise contracts.
---

# MessageBox

A Neo-Brutalist structured feedback modal component built on top of reka-ui's Dialog primitives. Supports confirmation dialogs, status badges, Prompt input validation, and provides three usage modes: declarative component, imperative functional helpers (`showMessageBox` / `showConfirm` / `showAlert` / `showPrompt`), and Composable (`useMessageBox`).

## Preview

<ComponentPreview>
  <MessageBoxDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="message-box" />

## Usage

### Declarative Component Usage

Control visibility via `v-model:open`:

```vue
<script setup>
import { ref } from 'vue'
import { MessageBox, Button } from 'brutx-ui-vue'

const isOpen = ref(false)

function handleConfirm() {
    console.log('Action confirmed')
}
</script>

<template>
    <Button @click="isOpen = true">Open Confirmation</Button>
    <MessageBox
        v-model:open="isOpen"
        title="Important Notice"
        message="This action will permanently sync all configurations. Continue?"
        type="warning"
        @confirm="handleConfirm"
    />
</template>
```

### Imperative Helper Functions

Trigger dialogs directly without template markup:

```vue
<script setup>
import { showConfirm, showAlert, showPrompt } from 'brutx-ui-vue'

async function handleConfirm() {
    const isConfirmed = await showConfirm('Are you sure you want to delete the selected items?')
    if (isConfirmed) {
        console.log('Deletion confirmed')
    }
}

async function handleAlert() {
    await showAlert('Operation completed successfully!')
}

async function handlePrompt() {
    const result = await showPrompt('Please enter a new project name:', {
        inputValue: 'My Project',
        inputPattern: /^[A-Za-z0-9_-]+$/,
        inputErrorMessage: 'Only alphanumeric characters, underscores, and hyphens are supported',
    })

    if (result.action === 'confirm') {
        console.log('Input value:', result.value)
    }
}
</script>

<template>
    <div class="flex flex-wrap gap-3">
        <button @click="handleConfirm">Confirmation Dialog (showConfirm)</button>
        <button @click="handleAlert">Alert Dialog (showAlert)</button>
        <button @click="handlePrompt">Prompt Dialog (showPrompt)</button>
    </div>
</template>
```

### Composable API (useMessageBox)

Gain reactive control methods inside components:

```vue
<script setup>
import { useMessageBox } from 'brutx-ui-vue'

const { confirm, prompt, alert } = useMessageBox()

async function deleteRecord() {
    const confirmed = await confirm('Are you sure you want to delete this record?', {
        title: 'Delete Warning',
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel',
    })
    if (confirmed) {
        // Perform deletion
    }
}
</script>

<template>
    <button @click="deleteRecord">Delete Record</button>
</template>
```

## Type Variants

Four status variants mapped to bold Neo-Brutalist color palettes:

| Type (`type`) | Color Palette | Use Case |
|---------------|---------------|----------|
| `info` | `bg-brutal-info text-brutal-info-foreground` | General notices and regular confirmations |
| `success` | `bg-brutal-success text-brutal-success-foreground` | Successful operation confirmations |
| `warning` | `bg-brutal-accent text-brutal-accent-foreground` | Destructive or irreversible action warnings (`showConfirm` default) |
| `error` | `bg-brutal-destructive text-brutal-destructive-foreground` | Critical exceptions and blocker notifications |

## Prompt Input & Regex Validation

Enable `showInput` and pass `inputPattern` for user input scenarios. When the input does not match the regex, confirmation is blocked and `inputErrorMessage` is displayed:

```vue
<script setup>
import { showPrompt } from 'brutx-ui-vue'

async function renameFile() {
    const result = await showPrompt('Please enter the new filename:', {
        title: 'Rename File',
        inputPlaceholder: 'e.g. index.ts',
        inputPattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/,
        inputErrorMessage: 'Please provide a filename with a valid extension',
    })

    if (result.action === 'confirm') {
        console.log('New filename:', result.value)
    }
}
</script>
```

## Props

### MessageBox Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Dialog visibility (supports `v-model:open`) |
| `title` | `string` | `t('messageBox.defaultTitle')` | Dialog title |
| `message` | `string` | — | Message content text |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Status variant |
| `showCloseButton` | `boolean` | `true` | Show top-right close button |
| `showCancelButton` | `boolean` | `true` | Show cancel button |
| `confirmButtonText` | `string` | `t('messageBox.confirm')` | Confirm button label |
| `cancelButtonText` | `string` | `t('messageBox.cancel')` | Cancel button label |
| `confirmButtonClass` | `string` | — | Custom class for confirm button |
| `cancelButtonClass` | `string` | — | Custom class for cancel button |
| `showInput` | `boolean` | `false` | Show input field (Prompt mode) |
| `inputPlaceholder` | `string` | — | Input field placeholder |
| `inputValue` | `string` | `''` | Initial input value |
| `inputPattern` | `RegExp` | — | Regular expression for validation |
| `inputErrorMessage` | `string` | `t('messageBox.inputError')` | Error message on validation failure |
| `zIndex` | `number` | — | Custom layer z-index |
| `class` | `string` | — | Custom card class |

## Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:open` | `(value: boolean)` | Triggered on open/close state transitions |
| `confirm` | `(value?: string)` | Triggered on successful confirmation with input value |
| `cancel` | — | Triggered on cancel, close button, backdrop click, or ESC |

## Accessibility

- **Keyboard Navigation**: Press `Escape` to dismiss the topmost active dialog layer according to the global LIFO stack.
- **Focus Management**: Automatically traps focus within the dialog content upon mounting (focuses the confirm button or prompt input), and restores focus to the previously active element upon closing.
- **ARIA Semantics**: Implements `role="alertdialog"` / `role="dialog"` semantic landmarks with proper labeling for screen readers.
- **High-Contrast Visibility**: Built on high-contrast 3px Neo-Brutalist borders and semantic color palettes satisfying WCAG AAA contrast ratio standards.

## Imperative & Composable API

### showMessageBox(options)

Low-level imperative mounting handle based on host controller:

```ts
import { showMessageBox, type MessageBoxResult } from 'brutx-ui-vue'

const { close, promise } = showMessageBox({
    title: 'System Notice',
    message: 'Core service upgraded successfully.',
    type: 'success',
})

const result: MessageBoxResult = await promise
// result.action: 'confirm' | 'cancel' | 'destroy'
```

### Deterministic Non-Rejecting Promise Contract

The Promise returned by `MessageBox` functional APIs **always resolves (never rejects)**, eliminating unhandled rejection errors. Use `result.action` to branch interaction paths:

```ts
export type MessageBoxAction = 'confirm' | 'cancel' | 'destroy'

export interface MessageBoxResult {
    /** confirm: Confirm button; cancel: Cancel/ESC/backdrop/close button; destroy: manual destroy */
    action: MessageBoxAction
    /** Input text value on confirm (Prompt mode) */
    value?: string
}
```

## FAQ

**Q: Do multiple stacked modals cause z-index collisions?**

A: No. The underlying host controller manages an active LIFO overlay stack. Each new layer automatically increments `z-index` by `OVERLAY_Z_INDEX_STEP = 10` and routes ESC events to the topmost active modal.

**Q: Is it safe to call in SSR environments?**

A: Yes. All functional and composable APIs include built-in SSR guards. In server-side environments without a DOM, `showConfirm` safely returns `false`, `showPrompt` returns `{ action: 'cancel' }`, and `showAlert` resolves immediately.
