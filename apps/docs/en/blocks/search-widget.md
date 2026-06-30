---
title: Search Widget
description: Search component block with an input field and grouped suggestion list.
translated: true
---

# Search Widget

A Neo-Brutalist search component featuring a Command input and grouped suggestion list, supporting real-time filtering and selection.

## Demo

<ComponentPreview>
  <SearchWidgetDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="search-widget" />

## Usage

### Basic Usage

```vue
<script setup>
import SearchWidget from '@/components/ui/search-widget/SearchWidget.vue'
import type { SearchSuggestion } from '@/components/ui/search-widget/SearchWidget.vue'

const suggestions: SearchSuggestion[] = [
    { label: 'Dashboard', value: 'dashboard', group: 'Pages' },
    { label: 'Settings', value: 'settings', group: 'Pages' },
    { label: 'Vue 3', value: 'vue3', group: 'Technologies' },
    { label: 'Tailwind CSS', value: 'tailwind', group: 'Technologies' },
]

function handleSearch(value: string) {
    console.log('Search:', value)
}

function handleSelect(suggestion: SearchSuggestion) {
    console.log('Selected:', suggestion)
}
</script>

<template>
    <SearchWidget
        placeholder="Search..."
        :suggestions="suggestions"
        @search="handleSearch"
        @select="handleSelect"
    />
</template>
```

### Ungrouped Suggestions

```vue
<script setup>
import SearchWidget from '@/components/ui/search-widget/SearchWidget.vue'

const suggestions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
]
</script>

<template>
    <SearchWidget
        :suggestions="suggestions"
        @select="(s) => console.log(s)"
    />
</template>
```

### Recent Searches

When the input is empty and `recent` is not empty, the dropdown displays a "Recent Searches" group (title taken from locale `searchWidget.recentSearches`). Clicking an item fills the input with that item's `label` and triggers the `select` event.

```vue
<script setup>
import SearchWidget from '@/components/ui/search-widget/SearchWidget.vue'
import type { SearchSuggestion } from 'brutx-ui-vue'

const recent: SearchSuggestion[] = [
    { label: 'Button', value: 'button' },
    { label: 'Theming', value: 'theming' },
]
</script>

<template>
    <SearchWidget :recent="recent" @select="(s) => console.log(s)" />
</template>
```

### Loading State

Set `loading` to `true` to display a `Spinner` at the bottom of the suggestion list, useful for async search scenarios.

```vue
<script setup>
import { ref } from 'vue'
import SearchWidget from '@/components/ui/search-widget/SearchWidget.vue'

const loading = ref(false)

function handleSearch(value) {
    loading.value = true
    fetchResults(value).finally(() => { loading.value = false })
}
</script>

<template>
    <SearchWidget :loading="loading" :suggestions="suggestions" @search="handleSearch" />
</template>
```

## Data Types

### SearchSuggestion

| Field | Type | Description |
| --- | --- | --- |
| `label` | `string` | Suggestion display text |
| `value` | `string` | Suggestion value |
| `group` | `string` | Optional group name |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | `string` | locale: `searchWidget.defaultPlaceholder` | Input placeholder text |
| `suggestions` | `SearchSuggestion[]` | `[]` | Suggestion list data |
| `recent` | `SearchSuggestion[]` | `[]` | Recent search record list |
| `loading` | `boolean` | `false` | Whether to show loading state |
| `iconSize` | `IconSize` | `'default'` | Search icon size |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
| --- | --- | --- |
| `search` | `[value: string]` | Emitted when input content changes |
| `select` | `[suggestion: SearchSuggestion]` | Emitted when a suggestion is selected |

## Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `actions` | — | Extra action area |

## Accessibility

- The search input has `role="combobox"` and `aria-expanded` attributes, indicating it is an expandable combo box
- The suggestion list uses `role="listbox"` and `role="option"` to identify options
- Keyboard navigation is supported: `Arrow Up/Down` to switch options, `Enter` to select, `Escape` to close the dropdown
- Both empty and loading states provide corresponding ARIA announcement messages
