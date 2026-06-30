---
title: Tags Input
description: A tags input component for adding tags or categories by typing or pasting, with keyboard shortcuts and backspace deletion support.
translated: true
---

# Tags Input

A neo-brutalist style tag entry component built on reka-ui primitives. Commonly used in form scenarios such as article tags, email recipients, and keyword filtering. Supports keyboard shortcuts, delimiter-based auto-add, and multiple color variants.

## Demo

<ComponentPreview>
  <TagsInputDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="tags-input" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import {
    TagsInput,
    TagsInputInput,
    TagsInputItem,
    TagsInputItemText,
    TagsInputItemDelete
} from 'brutx-ui-vue'

const tags = ref(['vue', 'css'])
</script>

<template>
    <TagsInput v-model="tags">
        <TagsInputItem v-for="tag in tags" :key="tag" :value="tag">
            <TagsInputItemText>{{ tag }}</TagsInputItemText>
            <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput placeholder="Add tag..." />
    </TagsInput>
</template>
```

## Variants

You can customize the color scheme of individual tags using the `variant` prop on `TagsInputItem`:

| Variant | Description |
|---------|-------------|
| `primary` | Default coral background with black bold border |
| `secondary` | Mint green background |
| `accent` | Brutal yellow background |
| `success` | Classic green background |
| `danger` | Classic red background |
| `default` | Plain white background |

```vue
<template>
    <TagsInputItem value="css" variant="secondary">
        <TagsInputItemText>CSS</TagsInputItemText>
        <TagsInputItemDelete />
    </TagsInputItem>
</template>
```

## Sub-components

| Component | Description |
|-----------|-------------|
| `TagsInput` | Root component that manages the tag list state |
| `TagsInputInput` | Text input field |
| `TagsInputItem` | Individual tag item container |
| `TagsInputItemText` | Tag text content |
| `TagsInputItemDelete` | Tag delete button |

## Props

### TagsInput

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `Array<T>` | `[]` | Tag data list, supports `v-model` two-way binding |
| `defaultValue` | `Array<T>` | `[]` | Default tag list in uncontrolled mode |
| `disabled` | `boolean` | `false` | Whether to disable input |
| `max` | `number` | `0` | Maximum number of tags allowed; `0` means no limit |
| `addOnPaste` | `boolean` | `false` | Whether to auto-add tags on paste based on delimiter |
| `addOnTab` | `boolean` | `false` | Whether to add a tag when pressing the Tab key |
| `addOnBlur` | `boolean` | `false` | Whether to add a tag when the input loses focus |
| `duplicate` | `boolean` | `false` | Whether to allow adding duplicate tags |
| `delimiter` | `string \| RegExp` | `','` | Delimiter that triggers tag addition; supports regular expressions |
| `dir` | `'ltr' \| 'rtl'` | — | Reading direction; inherits global config when not set |
| `convertValue` | `(value: string) => T` | — | Function to convert the input string to the target type; required when using objects as values |
| `displayValue` | `(value: T) => string` | `value.toString()` | Function to customize the displayed tag value |
| `ariaLabel` | `string` | locale default (`tagsInput.label`) | Accessibility label; falls back to the locale default when not provided |
| `name` | `string` | — | Form field name |
| `required` | `boolean` | — | Whether the field is required |

### TagsInputInput

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | — | Input placeholder text |
| `autoFocus` | `boolean` | — | Whether to auto-focus on mount |
| `maxLength` | `number` | — | Maximum character limit |

### TagsInputItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `AcceptableInputValue` | — (required) | Tag value, supports `string \| number \| bigint \| Record<string, any>` |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success'` | `'primary'` | Visual color variant of the tag |
| `disabled` | `boolean` | `false` | Whether to disable this tag |

### TagsInputItemDelete

Inherits base Primitive attributes, no additional props.

### TagsInputItemText

Inherits base Primitive attributes, no additional props.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `Array<T>` | Triggered when the tag list changes |
| `addTag` | `T` | Triggered when a tag is successfully added |
| `removeTag` | `T` | Triggered when a tag is successfully removed |
| `invalid` | `T` | Triggered when a tag is invalid (exceeds maximum count or is a duplicate) |

## Slots

### TagsInput

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | `{ modelValue: Array<T> }` | Default slot for placing `TagsInputItem` and `TagsInputInput` |

### TagsInputItemDelete

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Custom delete button content; defaults to an X icon |

## Accessibility

- **ARIA Attributes**: TagsInput provides `aria-label` via locale by default (e.g., "Tags Input" in English); falls back to `t('tagsInput.label')` when not provided
- **Custom Labels**: When a more specific description is needed (e.g., "Article tags", "Recipients"), use the `ariaLabel` prop to customize

```vue
<script setup>
import { ref } from 'vue'
import {
    TagsInput,
    TagsInputInput,
    TagsInputItem,
    TagsInputItemText,
    TagsInputItemDelete
} from 'brutx-ui-vue'

const tags = ref(['vue', 'css'])
</script>

<template>
    <TagsInput v-model="tags" aria-label="Article tags">
        <TagsInputItem v-for="tag in tags" :key="tag" :value="tag">
            <TagsInputItemText>{{ tag }}</TagsInputItemText>
            <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput placeholder="Add tag..." />
    </TagsInput>
</template>
```

## FAQ

**Q: How do I use objects as tag values instead of strings?**

A: When tag values are objects, you must provide a `convertValue` function to convert the input string to the target object type. It is also recommended to provide a `displayValue` function to customize the tag display text. If `convertValue` is not provided, the component will use strings as tag values.

**Q: Why doesn't adding a tag work after setting the `max` attribute?**

A: When the number of tags reaches the `max` limit, new tags will not be added and the `invalid` event will be triggered. You can listen to this event to display a message to the user. If `max` is set to `0`, there is no limit on the number of tags.

**Q: How do I automatically split multiple tags on paste?**

A: Set `addOnPaste` to `true`, and text containing delimiters will be automatically split into multiple tags when pasted. The default delimiter is a comma (`,`), which can be customized via the `delimiter` prop (supports strings and regular expressions). For example, set `delimiter=";"` to split by semicolons.
