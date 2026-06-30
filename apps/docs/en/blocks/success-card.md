---
title: Success Card
description: Success state card block with a checkmark icon, title, description, and confirm button.
translated: true
---

# Success Card

A Neo-Brutalist success card featuring a success-colored top bar, decorative checkmark icon, title, description, and confirm button.

## Demo

<ComponentPreview>
  <SuccessCardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="success-card" />

## Usage

```vue
<script setup>
import SuccessCard from '@/components/ui/success-card/SuccessCard.vue'

function handleConfirm() {
    console.log('Confirmed')
}
</script>

<template>
    <SuccessCard
        title="Operation Successful"
        description="Your changes have been saved successfully."
        confirm-text="Continue"
        @confirm="handleConfirm"
    />
</template>
```

Custom text example:

```vue
<script setup>
import SuccessCard from '@/components/ui/success-card/SuccessCard.vue'
</script>

<template>
    <SuccessCard
        title="Payment Complete"
        description="Your order has been placed and is being processed."
        confirm-text="View Order"
        @confirm="viewOrder"
    />
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | locale: `successCard.defaultTitle` | Card title text |
| `description` | `string` | locale: `successCard.defaultDescription` | Card description text |
| `confirmText` | `string` | locale: `successCard.defaultConfirmText` | Confirm button text |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
| --- | --- | --- |
| `confirm` | `[]` | Emitted when the confirm button is clicked |

## Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `actions` | — | Extra action button area |

## Accessibility

- The card uses semantic structure with clearly readable title and description text
- The confirm button supports keyboard navigation and focus management
- Success state is conveyed through both visual icon and text cues
- Color contrast meets WCAG standards
