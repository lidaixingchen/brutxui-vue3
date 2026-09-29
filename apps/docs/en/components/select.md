---
title: Select
description: A select component that replaces the native browser dropdown with better accessibility support.
translated: true
---

# Select

A neo-brutalist style dropdown select built on top of reka-ui's Select primitive, with full sub-component support.

## Demo

<ComponentPreview>
  <SelectDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="select" />

## Usage

```vue
<script setup>
import { Select, SelectTrigger, SelectContent, SelectItem, SelectLabel } from 'brutx-ui-vue'
import { SelectGroup, SelectValue } from 'reka-ui'
</script>

<template>
    <Select>
        <SelectTrigger class="w-[280px]">
            <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
            <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="grape">Grape</SelectItem>
            </SelectGroup>
        </SelectContent>
    </Select>
</template>
```

### Custom Slot Composition and Attribute Binding

The default slot replaces the full selector and does not provide scoped slot arguments. When composing atomic controls, pass form name, required, and disabled to Select; bind the trigger id and disabled state directly in the slot content.

```vue
<script setup>
import { ref } from 'vue'
import { Select, SelectTrigger, SelectContent, SelectItem } from 'brutx-ui-vue'
import { SelectValue } from 'reka-ui'
const isDisabled = ref(false)
</script>

<template>
    <Select name="fruit" required :disabled="isDisabled">
        <SelectTrigger id="fruit-select" :disabled="isDisabled" class="w-[280px]">
            <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
    </Select>
</template>
```

### Unified Usage

In addition to using individual atomic components, you can use the pre-packaged unified `Select` component, which supports passing an `options` array and automatically grouping items.

```vue
<script setup>
import { ref } from 'vue'
import { Select } from 'brutx-ui-vue'

const selectedValue = ref('')

const foodOptions = [
    { label: 'Apple', value: 'apple', category: 'fruits', categoryName: 'Fruits' },
    { label: 'Banana', value: 'banana', category: 'fruits', categoryName: 'Fruits' },
    { label: 'Carrot', value: 'carrot', category: 'vegetables', categoryName: 'Vegetables' },
    { label: 'Potato', value: 'potato', category: 'vegetables', categoryName: 'Vegetables' },
    { label: 'Milk', value: 'milk' } // ungrouped
]
</script>

<template>
    <!-- Basic Usage -->
    <Select
        v-model="selectedValue"
        :options="foodOptions"
        placeholder="Select your food"
        class="w-[280px]"
    />

    <!-- Auto Grouping Usage -->
    <Select
        v-model="selectedValue"
        :options="foodOptions"
        group-field="category"
        group-label="categoryName"
        placeholder="Select food (Grouped)"
        class="w-[280px]"
    />
</template>
```

### Using v-model

```vue
<script setup>
import { ref } from 'vue'
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from 'brutx-ui-vue'
import { SelectValue } from 'reka-ui'

const selectedFruit = ref('')
</script>

<template>
    <Select v-model="selectedFruit">
        <SelectTrigger class="w-[280px]">
            <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
        </SelectContent>
    </Select>
</template>
```

## Sub-components

| Component | Description |
|-----------|-------------|
| `Select` | Unified selector with an options data source and slot composition, built on Reka UI primitives |
| `SelectRoot` | Reka UI root primitive that provides context for atomic composition (import from reka-ui) |
| `SelectValue` | Reka UI primitive that displays the selected value or placeholder (import from reka-ui) |
| `SelectGroup` | Reka UI primitive that groups options (import from reka-ui) |
| `SelectTrigger` | Button that opens the dropdown |
| `SelectContent` | Dropdown content panel |
| `SelectItem` | Selectable option |
| `SelectLabel` | Group label |
| `SelectSeparator` | Visual separator |
| `SelectScrollUpButton` | Scroll up indicator |
| `SelectScrollDownButton` | Scroll down indicator |

## API Reference

<span id="select-unified-component"></span>
<span id="select-atomic-component"></span>
<span id="selecttrigger"></span>
<span id="selectcontent"></span>
<span id="selectitem"></span>
<span id="selectvalue"></span>
<span id="selectlabel"></span>
<span id="selectseparator"></span>
<span id="selectscrollupbutton"></span>
<span id="selectscrolldownbutton"></span>
<span id="selecttrigger-events"></span>

<ComponentApi name="select" />

### Reka UI Primitives

The unified Select props, events, and slots are listed above. When composing atomic controls, headless primitives such as SelectRoot and SelectValue come from reka-ui and should be imported from reka-ui; their remaining prop and slot contracts are defined by Reka UI.

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to open the dropdown, `Escape` to close, and arrow keys to navigate options
- **ARIA Attributes**: Automatically manages `aria-expanded`, `aria-haspopup`, `aria-activedescendant`, etc.
- **Focus Management**: Focus is trapped within the dropdown when open; focus returns to the trigger when closed
