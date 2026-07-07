---
title: Command
description: Command palette component supporting keyboard shortcuts, grouped filtering, and quick command execution.
translated: true
---

# Command

A neo-brutalist style command palette component for search and navigation. Built on reka-ui's Listbox primitive with built-in search filtering.

## Demo

<ComponentPreview>
  <CommandDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="command" />

## Usage

```vue
<script setup>
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from 'brutx-ui-vue'
</script>

<template>
    <Command>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup title="Suggestions">
                <CommandItem value="calendar">Calendar</CommandItem>
                <CommandItem value="search">Search Emoji</CommandItem>
                <CommandItem value="calculator">Calculator</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup title="Settings">
                <CommandItem value="profile">
                    Profile
                    <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem value="billing">
                    Billing
                    <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem value="settings">
                    Settings
                    <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
            </CommandGroup>
        </CommandList>
    </Command>
</template>
```

## Search Filtering

Text entered in `CommandInput` automatically filters `CommandItem` elements. The matching logic is based on item text content. When all items are filtered out, `CommandEmpty` is automatically displayed; when all items within a group are filtered out, that group is automatically hidden.

```vue
<Command>
    <CommandInput />
    <CommandList>
        <CommandEmpty />
        <CommandGroup title="Suggestions">
            <CommandItem value="calendar">Calendar</CommandItem>
            <CommandItem value="search">Search Emoji</CommandItem>
        </CommandGroup>
        <CommandGroup title="Settings">
            <CommandItem value="profile">Profile</CommandItem>
        </CommandGroup>
    </CommandList>
</Command>
```

### Disable Internal Filtering

When an external component handles filtering logic (e.g., Combobox), use `disable-filter` to disable Command's internal search filtering to avoid double-filtering conflicts:

```vue
<Command disable-filter>
    <CommandInput v-model="searchQuery" />
    <CommandList>
        <CommandEmpty />
        <CommandGroup>
            <CommandItem
                v-for="item in filteredItems"
                :key="item.value"
                :value="item.value"
            >
                {{ item.label }}
            </CommandItem>
        </CommandGroup>
    </CommandList>
</Command>
```

### Search Widget Recipe

New code can compose `Command disable-filter` directly for search input, grouped results, recent searches, and loading states.

```vue
<script setup>
import { computed, ref } from 'vue'
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from 'brutx-ui-vue'

const query = ref('')
const suggestions = [
    { label: 'Button', value: 'button', group: 'Components' },
    { label: 'Theming', value: 'theming', group: 'Docs' },
]

const filteredItems = computed(() =>
    suggestions.filter(item => item.label.toLowerCase().includes(query.value.toLowerCase()))
)
</script>

<template>
    <Command disable-filter class="w-full max-w-lg border-3 border-brutal shadow-brutal">
        <CommandInput v-model="query" placeholder="Search components or docs..." />
        <CommandList>
            <CommandEmpty />
            <CommandGroup title="Search Results">
                <CommandItem v-for="item in filteredItems" :key="item.value" :value="item.value">
                    {{ item.label }}
                </CommandItem>
            </CommandGroup>
        </CommandList>
    </Command>
</template>
```

## Command Dialog

Use `CommandDialog` to create a modal command palette:

```vue
<script setup>
import { ref } from 'vue'
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from 'brutx-ui-vue'

const open = ref(false)
</script>

<template>
    <button @click="open = true">Open Command Palette</button>
    <CommandDialog v-model:open="open">
        <CommandInput placeholder="Type a command..." />
        <CommandList>
            <CommandEmpty />
            <CommandGroup title="Actions">
                <CommandItem value="new">New File</CommandItem>
                <CommandItem value="open">Open File</CommandItem>
            </CommandGroup>
        </CommandList>
    </CommandDialog>
</template>
```

## Sub-components

| Component | Description |
|------|------|
| `Command` | Root container, manages filter state, built on `ListboxRoot` |
| `CommandDialog` | Modal dialog wrapper, built on `DialogRoot` |
| `CommandInput` | Search input field, automatically filters items on input |
| `CommandList` | Scrollable list container, built on `ListboxContent` |
| `CommandEmpty` | Displayed when there are no matching results |
| `CommandGroup` | Grouped section with title, automatically hidden when filtered empty |
| `CommandItem` | Selectable item, built on `ListboxItem`, supports `@select` event |
| `CommandSeparator` | Visual separator between groups |
| `CommandShortcut` | Keyboard shortcut hint |

## Programmatic Control

`Command` exposes a `filterSearch` reactive reference via `defineExpose`, allowing parent components to programmatically read or set the search keyword, thereby triggering item filtering without relying on `CommandInput`.

> Note: Writing to `filterSearch` only triggers filtering logic when internal filtering is enabled (i.e., `disable-filter` is not set); when `disableFilter` is `true`, internal filtering is disabled and writes will not affect item display.

```vue
<script setup>
import { ref } from 'vue'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from 'brutx-ui-vue'

const commandRef = ref()
</script>

<template>
    <Command ref="commandRef">
        <CommandInput />
        <CommandList>
            <CommandEmpty />
            <CommandGroup title="Suggestions">
                <CommandItem value="calendar">Calendar</CommandItem>
                <CommandItem value="search">Search Emoji</CommandItem>
                <CommandItem value="calculator">Calculator</CommandItem>
            </CommandGroup>
        </CommandList>
    </Command>

    <button @click="commandRef?.filterSearch = 'cal'">Trigger search "cal" externally</button>
    <button @click="commandRef?.filterSearch = ''">Clear search</button>
</template>
```

### Exposed API

| Method/Property | Type | Description |
|-----------|------|------|
| `filterSearch` | `Ref<string>` | Current search keyword, readable and writable; writing triggers internal filtering logic (requires `disableFilter` to be `false`) |

## Props

### Command

| Prop | Type | Default | Description |
|------|------|--------|------|
| `disableFilter` | `boolean` | `false` | Disables internal search filtering, for scenarios where external filtering is used |
| `class` | `string` | — | Custom CSS class name |

### CommandInput

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `string` | — | Input field value, supports `v-model` |
| `placeholder` | `string` | `t('command.placeholder')` | Placeholder text |
| `class` | `string` | — | Custom CSS class name |

### CommandItem

| Prop | Type | Default | Description |
|------|------|--------|------|
| `value` | `string` | — | Unique identifier value for the item |
| `disabled` | `boolean` | — | Whether the item is disabled |
| `class` | `string` | — | Custom CSS class name |

### CommandGroup

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | — | Group title text |
| `class` | `string` | — | Custom CSS class name |

### CommandList

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Custom CSS class name |

### CommandEmpty

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Custom CSS class name |

### CommandSeparator

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Custom CSS class name |

### CommandShortcut

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Custom CSS class name |

### CommandDialog

| Prop | Type | Default | Description |
|------|------|--------|------|
| `open` | `boolean` | `false` | Whether the dialog is open, supports `v-model:open` |
| `title` | `string` | `t('command.dialogTitle')` | Dialog title (for accessibility) |
| `description` | `string` | `t('command.dialogDescription')` | Dialog description (for accessibility) |
| `class` | `string` | — | Custom CSS class name |

## Events

### CommandInput

| Event | Payload | Description |
|------|------|------|
| `update:modelValue` | `string` | Triggered when the input value changes |

### CommandItem

| Event | Payload | Description |
|------|------|------|
| `select` | `string` | Triggered when an item is selected |

### CommandDialog

| Event | Payload | Description |
|------|------|------|
| `update:open` | `boolean` | Triggered when the dialog open/close state changes |

## Slots

| Component | Slot | Description |
|------|------|------|
| `Command` | `default` | For placing `CommandInput`, `CommandList` and other child components |
| `CommandDialog` | `default` | For placing `CommandInput`, `CommandList` and other child components |
| `CommandList` | `default` | For placing `CommandEmpty`, `CommandGroup` and other child components |
| `CommandGroup` | `default` | For placing `CommandItem` child components |
| `CommandItem` | `default` | For placing item content and `CommandShortcut` |
| `CommandEmpty` | `default` | Custom display content when there are no matching results, defaults to `t('command.emptyText')` |
| `CommandShortcut` | `default` | For placing shortcut key text |

## Accessibility

- **Keyboard**: Supports `↑` / `↓` to move focus up and down, `Enter` to select the current item, `Escape` to close the dialog (when inside CommandDialog)
- **ARIA Attributes**: CommandDialog supports `title` and `description` props for accessibility
- **Focus Management**: Focus is trapped within the component when the dialog is open; focus is restored when closed
