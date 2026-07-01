---
title: Popconfirm
description: A lightweight confirmation popover for confirming actions.
---

# Popconfirm

A lightweight confirmation popover that appears when clicking a trigger element. It's more lightweight than a Dialog for simple confirm/cancel actions.

## Preview

<ComponentPreview>
  <PopconfirmDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="popconfirm" />

## Usage

```vue
<script setup>
import { Popconfirm, Button } from 'brutx-ui-vue'

function handleConfirm() {
    console.log('Confirmed!')
}

function handleCancel() {
    console.log('Cancelled!')
}
</script>

<template>
    <Popconfirm
        title="Are you sure you want to delete this item?"
        @confirm="handleConfirm"
        @cancel="handleCancel"
    >
        <Button variant="destructive">Delete</Button>
    </Popconfirm>
</template>
```

### Custom Button Text

```vue
<script setup>
import { Popconfirm, Button } from 'brutx-ui-vue'
</script>

<template>
    <Popconfirm
        title="Submit this form?"
        confirm-button-text="Yes, submit"
        cancel-button-text="No, go back"
        confirm-button-type="primary"
    >
        <Button>Submit</Button>
    </Popconfirm>
</template>
```

### Destructive Action

```vue
<script setup>
import { Popconfirm, Button } from 'brutx-ui-vue'
</script>

<template>
    <Popconfirm
        title="This action cannot be undone."
        confirm-button-type="destructive"
        :cancelable="false"
    >
        <Button variant="destructive">Delete Account</Button>
    </Popconfirm>
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — (required) | Confirmation title text |
| `confirmButtonText` | `string` | locale: `popconfirm.confirm` | Confirm button text |
| `cancelButtonText` | `string` | locale: `popconfirm.cancel` | Cancel button text |
| `confirmButtonType` | `'primary' \| 'destructive'` | `'primary'` | Confirm button style |
| `icon` | `Component` | `TriangleAlert` | Warning icon component |
| `cancelable` | `boolean` | `true` | Whether to show cancel button |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `confirm` | — | Emitted when confirm button is clicked |
| `cancel` | — | Emitted when cancel button is clicked |

## Slots

| Slot | Description |
| --- | --- |
| `default` | Trigger element |
| `icon` | Custom icon |
| `description` | Description text below the title |

## Accessibility

- Built on top of `Popover` which follows WAI-ARIA dialog pattern
- **Keyboard**: `Escape` to close, `Tab` to navigate between buttons
- **Focus Management**: Focus is trapped within the popover when open
- **ARIA Attributes**: Buttons have appropriate labels
