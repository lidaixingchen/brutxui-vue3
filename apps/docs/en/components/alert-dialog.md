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

## API Reference

<span id="alertdialogcontent"></span>
<span id="alertdialogheader"></span>
<span id="alertdialogfooter"></span>
<span id="alertdialogtitle"></span>
<span id="alertdialogdescription"></span>
<span id="alertdialogaction"></span>
<span id="alertdialogcancel"></span>

<ComponentApi name="alert-dialog" />

### Reka UI Primitives

Import `AlertDialogRoot` (named `AlertDialog` in the example), `AlertDialogTrigger`, and `AlertDialogPortal` from `reka-ui`. The API list above covers the seven public BrutxUI sub-components. `AlertDialogContent` already composes a Portal and overlay internally, and forwards additional attributes and listeners to its content primitive, including `aria-*`, `data-*`, `style`, and `@escape-key-down`.

`AlertDialogCancel` uses the `outline` button variant. Provide the title through the default slot of `AlertDialogTitle`; without renderable content it displays the English fallback `Alert`, so applications should supply a meaningful localized title.

### Native Attributes and Events

`AlertDialogAction` explicitly inherits Reka `PrimitiveProps` and Vue `ButtonHTMLAttributes`. The API list retains these inherited members, including HTML attributes, ARIA attributes, and `on*` event listeners. The root defaults to `button`, with a button type fallback of `button`. When using `as` or `asChild`, actual behavior depends on the rendered element: media events require a media root, form events occur on forms, and ARIA states must suit the element’s role.

Listeners such as `onClick` can be written as `@click` in templates. Activating `AlertDialogAction` requests dialog closure; an asynchronous handler does not delay that request. Use controlled `open` state on `AlertDialogRoot` when application logic must determine when to close.

See the [HTML button attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button) and [RDFa attribute definitions](https://www.w3.org/TR/rdfa-core/#s_syntax) for inherited attribute semantics. The [Safari HTML attribute reference](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/Attributes.html) describes browser extensions such as `autosave` and `results`.

## Accessibility

- **Keyboard**: Press `Escape` to close the dialog; `AlertDialogCancel` closes the dialog on click; `AlertDialogAction` confirms and closes the dialog
- **ARIA Attributes**: The dialog uses the semantic `role="alertdialog"` attribute
- **Focus Management**: When the dialog opens, focus is trapped inside
