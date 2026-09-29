---
title: Transfer
description: A Neo-Brutalist transfer component to move items between double columns.
---

# Transfer

A double-column transfer selector featuring thick borders, hard shadow offsets, and active press feedback characteristic of Neo-Brutalist design.

## Preview

<ComponentPreview>
  <TransferDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="transfer" />

## Usage

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import { Transfer } from 'brutx-ui-vue'

const data = ref([
    { key: 1, label: 'Option 1' },
    { key: 2, label: 'Option 2' },
    { key: 3, label: 'Option 3', disabled: true },
    { key: 4, label: 'Option 4' }
])

const value = ref([1])
</script>

<template>
    <Transfer v-model="value" :data="data" />
</template>
```

### Search & Filter

Enable search and filtering functionality by setting the `filterable` property to `true`.

```vue
<template>
    <Transfer v-model="value" :data="data" filterable />
</template>
```

### Custom Titles and Button Texts

You can customize the headers and action buttons using the `titles` and `buttonTexts` props respectively.

```vue
<template>
    <Transfer
        v-model="value"
        :data="data"
        :titles="['Source items', 'Target items']"
        :button-texts="['Undo', 'Add']"
    />
</template>
```

## API Reference

<span id="transfer-1"></span>
<span id="transfer-2"></span>

<ComponentApi name="transfer" />

## Data Types

```ts
interface TransferDataItem {
    key: string | number
    label: string
    disabled?: boolean
}
```

## Exported Types

```ts
import type { TransferDataItem } from 'brutx-ui-vue'
```

## Accessibility

- **Keyboard Interaction**:
  - Checkboxes inside each column panel support selection using `Space` / `Enter` keys
  - Action buttons support focus via `Tab` key and activation using `Enter` / `Space` keys
- **ARIA Attributes**: Operation buttons are equipped with `aria-label` to state transfer direction ("Move selected to right" / "Move selected to left"). Checked items are managed and presented via standard checkboxes
- **Focus Management**: The transfer buttons retain focus after items are moved, allowing efficient consecutive keyboard operations
