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

## API Reference

<span id="tagsinput"></span>
<span id="tagsinputinput"></span>
<span id="tagsinputitem"></span>
<span id="tagsinputitemdelete"></span>
<span id="tagsinputitemtext"></span>
<span id="tagsinput-1"></span>
<span id="tagsinputitemdelete-1"></span>

<ComponentApi name="tags-input" />

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
