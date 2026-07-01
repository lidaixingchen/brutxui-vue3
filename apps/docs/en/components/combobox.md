---
title: Combobox
description: A searchable dropdown select component supporting single and multi-select modes with large dataset filtering.
translated: true
---

# Combobox

A neo-brutalist style searchable select component. Toggle between single-select and multi-select modes via the `multiple` prop.

## Demo

<ComponentPreview>
  <ComboboxDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="combobox" />

## Usage

### Single-select Mode

```vue
<script setup>
import { ref } from 'vue'
import { Combobox } from 'brutx-ui-vue'

const selected = ref(undefined)

const options = [
    { value: 'vue', label: 'Vue' },
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
]
</script>

<template>
    <Combobox
        v-model="selected"
        :options="options"
        placeholder="Select a framework..."
        search-placeholder="Search frameworks..."
    />
</template>
```

### Multi-select Mode

```vue
<script setup>
import { ref } from 'vue'
import { Combobox } from 'brutx-ui-vue'

const selected = ref([])

const options = [
    { value: 'vue', label: 'Vue' },
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
]
</script>

<template>
    <Combobox
        v-model="selected"
        :options="options"
        multiple
        placeholder="Select frameworks..."
        :max-display="3"
    />
</template>
```

### Loading State

When `loading` is set to `true`, a `Spinner` is displayed at the bottom of the dropdown list. This is useful for asynchronous option loading scenarios.

```vue
<script setup>
import { ref } from 'vue'
import { Combobox } from 'brutx-ui-vue'

const loading = ref(false)
const options = ref([])

async function handleOpen() {
    loading.value = true
    options.value = await fetchOptions()
    loading.value = false
}
</script>

<template>
    <Combobox v-model="selected" :options="options" :loading="loading" />
</template>
```

### Creating Options

When `creative` is set to `true`, if no search matches are found and the input is non-empty, a "Create '{query}'" option appears at the top of the list (text from locale `combobox.create`). Clicking it triggers the `create` event with the current search text as the argument.

- `Combobox` (single-select): Closes the dropdown after creation.
- `Combobox` (`multiple`): Does **not** close the dropdown after creation, allowing continued selection or creation of multiple items.

```vue
<script setup>
import { ref } from 'vue'
import { Combobox } from 'brutx-ui-vue'

const selected = ref(undefined)
const options = ref([
    { value: 'vue', label: 'Vue' },
    { value: 'react', label: 'React' },
])

function handleCreate(value) {
    options.value.push({ value: value.toLowerCase(), label: value })
    selected.value = value.toLowerCase()
}
</script>

<template>
    <Combobox
        v-model="selected"
        :options="options"
        creative
        @create="handleCreate"
    />
</template>
```

## Data Types

```ts
interface ComboboxOption {
    value: string
    label: string
    disabled?: boolean
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `ComboboxOption[]` | — (required) | Options list |
| `multiple` | `boolean` | `false` | Whether to enable multi-select mode |
| `modelValue` | `string \| string[] \| undefined` | Single: `undefined`; Multi: `[]` | Selected value, supports v-model. In multi-select mode this is `string[]` |
| `open` | `boolean` | `undefined` | Whether the dropdown is expanded |
| `placeholder` | `string` | locale: `combobox.placeholder` / `combobox.multiPlaceholder` | Placeholder text, switches automatically based on mode |
| `searchPlaceholder` | `string` | locale: `combobox.searchPlaceholder` | Search box placeholder |
| `emptyText` | `string` | locale: `combobox.emptyText` | Text shown when no matches found |
| `disabled` | `boolean` | `false` | Whether disabled |
| `loading` | `boolean` | `false` | Whether to show loading state |
| `creative` | `boolean` | `false` | Whether to allow creating new options |
| `maxDisplay` | `number` | `3` | Maximum number of selected tags to display in multi-select mode |
| `ariaLabel` | `string` | — | Accessibility label |
| `iconSize` | `IconSize` | `'default'` | Icon size |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string \| string[] \| undefined` | Triggered when the selected value changes. In single-select mode, selecting the same option again deselects it (value becomes `undefined`); in multi-select mode, toggles selection/deselection of the corresponding option |
| `update:open` | `boolean` | Triggered when the dropdown open/close state changes |
| `create` | `string` | Triggered when the "Create" option is clicked; payload is the current search text |

## Accessibility

- **Keyboard**: Supports `Arrow Up` / `Arrow Down` to move focus, `Enter` to select the current item, `Escape` to close the dropdown
- **ARIA Attributes**: Provides accessibility label via the `ariaLabel` prop

## Exposed Methods (defineExpose)

| Property/Method | Type | Description |
| --- | --- | --- |
| `open` | `Ref<boolean>` | Whether the dropdown panel is expanded |
| `searchQuery` | `Ref<string>` | Current search keyword |
| `selectedValue` | `ComputedRef<string \| string[] \| undefined>` | Currently selected value (read-only) |
| `focus` | `() => void` | Focus the trigger |

## FAQ

**Q: Why does clicking an already selected option in single-select mode have no effect?**

A: In `Combobox` single-select mode, clicking an already selected option deselects it (value becomes `undefined`). This is by design to support clearing the selection. If you don't need this behavior, you can listen to the `update:modelValue` event in the parent component and restore the previous value when it becomes `undefined`.

**Q: How do I implement asynchronous option loading?**

A: Set `loading` to `true` to show the loading state, update `options` after data is loaded, and set `loading` to `false`. You can combine this with the dropdown open event to trigger data loading, avoiding loading all data at once.

**Q: How are newly created options persisted in `creative` mode?**

A: The component itself does not persist created options. You need to manually add the new option to the `options` array in the `create` event handler and update `modelValue` accordingly. For persistent storage, you can call a backend API or write to local storage in the event handler.
