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

## Search & Filter

Enable search and filtering functionality by setting the `filterable` property to `true`.

```vue
<template>
    <Transfer v-model="value" :data="data" filterable />
</template>
```

## Custom Titles and Button Texts

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

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `modelValue` | `(string \| number)[]` | `[]` | Keys of selected items in the target column, supports `v-model` |
| `data` | `TransferDataItem[]` | `[]` | Source items array, each item contains `{ key, label, disabled }` |
| `filterable` | `boolean` | `false` | Whether to display search filter fields |
| `filterMethod` | `(query: string, item: TransferDataItem) => boolean` | — | Custom filter method |
| `titles` | `string[]` | `['Source', 'Target']` | Panel header titles |
| `buttonTexts` | `string[]` | `['', '']` | Buttons text, fallback to chevron icons when empty |

## TransferDataItem Interface

```typescript
export interface TransferDataItem {
    key: string | number
    label: string
    disabled?: boolean
}
```

## Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:modelValue` | `(string \| number)[]` | Triggers when the target values change |
| `change` | `(value: (string \| number)[], direction: 'left' \| 'right', movedKeys: (string \| number)[])` | Triggers when items are moved between columns |
