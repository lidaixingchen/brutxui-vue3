---
title: Alert Dialog
translated: true
description: Alert dialog component for operations requiring explicit user confirmation, with strong accessibility support.
---

# Alert Dialog

A neo-brutalist confirmation dialog that requires user interaction. Built on top of reka-ui's AlertDialog primitive.

## Demo

<ComponentPreview>
  <AlertDialogDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="alert-dialog" />

## Usage

```vue
<script setup>
import { AlertDialogRoot as AlertDialog, AlertDialogTrigger } from 'reka-ui'
import { AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <AlertDialog>
        <AlertDialogTrigger as-child>
            <Button variant="danger">Delete Account</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
```

## Sub-components

| Component | Description |
|-----------|-------------|
| `AlertDialog` | Root component (import directly from reka-ui: `import { AlertDialogRoot as AlertDialog } from 'reka-ui'`) |
| `AlertDialogTrigger` | Button that opens the dialog (import directly from reka-ui: `import { AlertDialogTrigger } from 'reka-ui'`) |
| `AlertDialogPortal` | Portal component (import directly from reka-ui: `import { AlertDialogPortal } from 'reka-ui'`) |
| `AlertDialogContent` | Dialog content panel |
| `AlertDialogHeader` | Header container for title and description |
| `AlertDialogFooter` | Footer container for action buttons |
| `AlertDialogTitle` | Dialog title |
| `AlertDialogDescription` | Dialog description text |
| `AlertDialogAction` | Confirm action button |
| `AlertDialogCancel` | Cancel button that closes the dialog |

## Props

### AlertDialogContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

### AlertDialogHeader

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

### AlertDialogFooter

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

### AlertDialogTitle

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

### AlertDialogDescription

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

### AlertDialogAction

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Button variant |
| `class` | `string` | — | Custom CSS class |
| `as` | `string \| Component` | — | Render as a specified element or component |
| `asChild` | `boolean` | — | Whether to render as child element |

### AlertDialogCancel

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

> `AlertDialogCancel` uses a hardcoded `variant: 'outline'`.

## Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | All sub-components support the default slot for inserting custom content |

## Accessibility

- **Keyboard**: Press `Escape` to close the dialog; `AlertDialogCancel` closes the dialog on click; `AlertDialogAction` confirms and closes the dialog
- **ARIA Attributes**: The dialog uses the semantic `role="alertdialog"` attribute
- **Focus Management**: When the dialog opens, focus is trapped inside
