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
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from 'brutx-ui-vue'
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
    SelectValue,
} from 'brutx-ui-vue'

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
| `Select` | Root component (re-exported as `SelectRoot` from reka-ui) |
| `SelectTrigger` | Button that opens the dropdown |
| `SelectContent` | Dropdown content panel |
| `SelectItem` | Selectable option |
| `SelectValue` | Displays the selected value |
| `SelectGroup` | Groups options together |
| `SelectLabel` | Group label |
| `SelectSeparator` | Visual separator |
| `SelectScrollUpButton` | Scroll up indicator |
| `SelectScrollDownButton` | Scroll down indicator |

## Props

### Select (Unified Component)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | `[]` | Options data source, where each item contains `label`, `value`, `disabled`, etc. |
| `groupField` | `string` | — | The key to group options by (e.g., `category`) |
| `groupLabel` | `string` | — | The key containing the group display label in options (e.g., `categoryName`), defaults to the value of `groupField` |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `disabled` | `boolean` | `false` | Whether disabled |
| `required` | `boolean` | `false` | Whether required |
| `name` | `string` | — | Form field name |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Trigger size |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Border style variant |
| `errorMessage` | `string` | — | Error message text |
| `clearable` | `boolean` | `false` | Whether clearable |
| `position` | `'popper' \| 'item-aligned'` | `'popper'` | Dropdown menu positioning strategy |
| `class` | `string` | — | Root component (trigger) CSS class |
| `triggerClass` | `string` | — | Custom trigger CSS class |
| `contentClass` | `string` | — | Custom dropdown content panel CSS class |
| `itemVariant` | `'default' \| 'primary' \| 'secondary'` | `'default'` | Option selection variant |

### Select (Atomic Component)

Root component that inherits all props from reka-ui `SelectRoot`. Common props are listed below:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | — | Selected value, supports `v-model` |
| `defaultValue` | `string` | — | Default selected value |
| `open` | `boolean` | — | Whether the dropdown is expanded, supports `v-model:open` |
| `defaultOpen` | `boolean` | `false` | Whether expanded by default |
| `disabled` | `boolean` | `false` | Whether disabled |
| `required` | `boolean` | `false` | Whether required |
| `name` | `string` | — | Form field name |

### SelectTrigger

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Trigger size |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Border style variant |
| `errorMessage` | `string` | — | Error message text, only displayed when `variant="error"` |
| `disabled` | `boolean` | `false` | Whether disabled |
| `clearable` | `boolean` | `false` | Show clear button on hover |
| `modelValue` | `string \| number \| null` | — | Current selected value (for clearable) |
| `class` | `string` | — | Custom CSS class |
| `iconClass` | `string` | — | Custom icon CSS class |

### SelectContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'popper' \| 'item-aligned'` | `'popper'` | Positioning strategy |
| `class` | `string` | — | Custom CSS class |

### SelectItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — (required) | Option value |
| `disabled` | `boolean` | `false` | Whether disabled |
| `variant` | `'default' \| 'primary' \| 'secondary'` | `'default'` | Option style variant |
| `class` | `string` | — | Custom CSS class |
| `indicatorClass` | `string` | — | Custom selected indicator CSS class |
| `iconClass` | `string` | — | Custom check icon CSS class |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | Check icon size |

### SelectValue

Displays the selected value, inherits all props from reka-ui `SelectValue`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | — | Placeholder text |

### SelectLabel

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

### SelectSeparator

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

### SelectScrollUpButton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | Up arrow icon size |

### SelectScrollDownButton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | Down arrow icon size |

## SelectTrigger Events

| Event | Payload | Description |
| --- | --- | --- |
| `clear` | — | Triggered when clear button is clicked |

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to open the dropdown, `Escape` to close, and arrow keys to navigate options
- **ARIA Attributes**: Automatically manages `aria-expanded`, `aria-haspopup`, `aria-activedescendant`, etc.
- **Focus Management**: Focus is trapped within the dropdown when open; focus returns to the trigger when closed
