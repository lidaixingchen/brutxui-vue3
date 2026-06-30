---
title: Date Picker
description: Neo-brutalist date picker component family supporting single date, date range, date-time, week/month/year selection, built on v-calendar and reka-ui Popover.
translated: true
---

# Date Picker

A neo-brutalist style date picker component family built on v-calendar and reka-ui Popover. It provides 7 components covering various date selection scenarios, all sharing unified style variants, internationalization, and accessibility support.

## Demo

<ComponentPreview>
  <DatePickerDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="date-picker" />

**Additional dependency required:**

```bash
pnpm add v-calendar
```

## Usage

### DatePicker - Single Date Selection

```vue
<script setup>
import { ref } from 'vue'
import { DatePicker } from 'brutx-ui-vue'

const date = ref(null)
</script>

<template>
    <DatePicker v-model="date" placeholder="Select date" />
</template>
```

### With Shortcuts

```vue
<script setup>
import { ref } from 'vue'
import { DatePicker } from 'brutx-ui-vue'

const date = ref(null)

const shortcuts = [
    { label: 'Today', value: () => new Date() },
    { label: 'Tomorrow', value: () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return d
    }},
    { label: 'In a week', value: () => {
        const d = new Date()
        d.setDate(d.getDate() + 7)
        return d
    }},
]
</script>

<template>
    <DatePicker v-model="date" :shortcuts="shortcuts" :clearable="true" />
</template>
```

### DatePickerRange - Date Range Selection

```vue
<script setup>
import { ref } from 'vue'
import { DatePickerRange } from 'brutx-ui-vue'

const dateRange = ref(null)
</script>

<template>
    <DatePickerRange
        v-model="dateRange"
        start-placeholder="Start date"
        end-placeholder="End date"
    />
</template>
```

### DateTimePicker - Date Time Selection

```vue
<script setup>
import { ref } from 'vue'
import { DateTimePicker } from 'brutx-ui-vue'

const dateTime = ref(null)
</script>

<template>
    <DateTimePicker
        v-model="dateTime"
        placeholder="Select date and time"
        :show-seconds="true"
    />
</template>
```

`DateTimePicker` supports time step configuration:

```vue
<template>
    <DateTimePicker
        v-model="dateTime"
        :time-step="{ hour: 2, minute: 15, second: 10 }"
    />
</template>
```

### TimePicker - Time Only Selection

```vue
<script setup>
import { ref } from 'vue'
import { TimePicker } from 'brutx-ui-vue'

const time = ref(null)
</script>

<template>
    <TimePicker v-model="time" :show-seconds="true" />
</template>
```

### WeekPicker - Week Selection

```vue
<script setup>
import { ref } from 'vue'
import { WeekPicker } from 'brutx-ui-vue'

const week = ref(null)
</script>

<template>
    <WeekPicker v-model="week" :week-starts-on="1" placeholder="Select week" />
</template>
```

`weekStartsOn`: `0` = week starts on Sunday, `1` = week starts on Monday (default). After selecting any date, `modelValue` automatically aligns to the start of that week, and the entire week is highlighted.

### MonthPicker - Month Selection

```vue
<script setup>
import { ref } from 'vue'
import { MonthPicker } from 'brutx-ui-vue'

const month = ref(null)
</script>

<template>
    <MonthPicker v-model="month" placeholder="Select month" />
</template>
```

### YearPicker - Year Selection

```vue
<script setup>
import { ref } from 'vue'
import { YearPicker } from 'brutx-ui-vue'

const year = ref(null)
</script>

<template>
    <YearPicker v-model="year" placeholder="Select year" />
</template>
```

### Disabled and Read-only

```vue
<template>
    <DatePicker v-model="date" disabled />
    <DatePicker v-model="date" readonly />
</template>
```

### Date Range Constraints

```vue
<script setup>
import { ref } from 'vue'
import { DatePicker } from 'brutx-ui-vue'

const date = ref(null)
const minDate = new Date(2026, 0, 1)
const maxDate = new Date(2026, 11, 31)
</script>

<template>
    <DatePicker v-model="date" :min-date="minDate" :max-date="maxDate" />
</template>
```

### Custom Display Format

Supports `YYYY`, `YY`, `MM`, `DD`, `HH`, `mm`, `ss`, `WW` (ISO week number) tokens:

```vue
<template>
    <DatePicker v-model="date" display-format="YYYY/MM/DD" />
    <DateTimePicker v-model="dt" display-format="YYYY-MM-DD HH:mm:ss" />
    <WeekPicker v-model="week" display-format="YYYY-WW" />
    <YearPicker v-model="year" display-format="YY" />
</template>
```

## Sub-components

| Component | Purpose |
|------|------|
| `DatePicker` | Single date selection |
| `DatePickerRange` | Date range selection (start and end dates) |
| `DateTimePicker` | Date + time selection |
| `TimePicker` | Time only selection (hours/minutes/seconds) |
| `WeekPicker` | Week selection (full week highlight) |
| `MonthPicker` | Month selection |
| `YearPicker` | Year selection |

## Data Types

```typescript
// Single date shortcut
interface DatePickerShortcut {
    label: string
    value: Date | (() => Date)
}

// Date range shortcut
interface DatePickerRangeShortcut {
    label: string
    value: [Date, Date] | (() => [Date, Date])
}
```

## Composables

The logic for popup panel triggering, display formatting, clearing, and confirmation in components like `DatePicker` has been extracted into a standalone `useDatePicker` composable. It can be used independently when you need to build a fully custom trigger or calendar panel. It manages the panel open/close state, synchronizes the display value with `modelValue`, and triggers `open` / `close` / `change` / `update:modelValue` events through the provided `emit`.

```ts
import { useDatePicker } from 'brutx-ui-vue'
import type { UseDatePickerOptions } from 'brutx-ui-vue'

const emit = defineEmits<{
    'update:modelValue': [value: Date | null]
    'change': [value: Date | null]
    'open': []
    'close': []
}>()

const {
    open,                  // Whether the panel is open
    displayValue,          // Current displayed value in the panel (temporary value before confirmation)
    formattedDisplay,      // Formatted display string
    handlePanelUpdate,     // Panel value update callback
    handlePanelConfirm,    // Panel confirm callback
    handlePanelClear,      // Panel clear callback
    handleClearClick,      // Trigger clear button click callback
    handleTriggerKeydown,  // Trigger keyboard event callback
} = useDatePicker({
    modelValue,
    displayFormat: 'YYYY-MM-DD',
    disabled: false,
    readonly: false,
    emit,
})
```

### UseDatePickerOptions

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `MaybeRefOrGetter<Date \| null>` | `null` | Currently selected date (supports v-model) |
| `displayFormat` | `MaybeRefOrGetter<string>` | `'YYYY-MM-DD'` | Display format (supports `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss`, `WW` tokens) |
| `disabled` | `MaybeRefOrGetter<boolean>` | `false` | Whether disabled |
| `readonly` | `MaybeRefOrGetter<boolean>` | `false` | Whether read-only |
| `emit` | `DatePickerEmit` | — | Event emission function (required, type consistent with component emits) |

### Return Values

| Prop | Type | Description |
|------|------|------|
| `open` | `Ref<boolean>` | Whether the panel is open |
| `displayValue` | `Ref<Date \| null>` | Current displayed value in the panel |
| `formattedDisplay` | `ComputedRef<string>` | Formatted string according to `displayFormat` |
| `handlePanelUpdate(value)` | `(value: Date \| null) => void` | Called when the panel value updates, synchronizes `displayValue` and triggers `update:modelValue` |
| `handlePanelConfirm(value)` | `(value: Date \| null) => void` | Called when the panel is confirmed, triggers `update:modelValue` / `change` and closes the panel |
| `handlePanelClear()` | `() => void` | Called when the panel is cleared, triggers `update:modelValue(null)` / `change(null)` |
| `handleClearClick(event)` | `(event: MouseEvent) => void` | Trigger clear button click callback, prevents event propagation and clears the value |
| `handleTriggerKeydown(event)` | `(event: KeyboardEvent) => void` | Trigger keyboard event callback, `Enter` / `Space` opens the panel |

> Note: `emit` must be a function conforming to the `DatePickerEmit` signature (i.e., the return value of component `defineEmits`). `useDatePicker` does not automatically manage `onMounted` / `onUnmounted` side effects and can be called at any time.

## Programmatic Control

`DatePicker`, `DateTimePicker`, `WeekPicker`, `MonthPicker`, and `YearPicker` expose an `open` reactive ref via `defineExpose`, allowing parent components to programmatically open or close the date panel. `open` is a `Ref<boolean>` that is two-way bound with the internal Popover, and can be read and written directly.

> Note: `DatePickerRange` and `TimePicker` do not expose `open`. `DatePicker`, `DateTimePicker`, `WeekPicker`, `MonthPicker`, and `YearPicker` also support `v-model:open` two-way binding. Using `v-model:open` is recommended over directly manipulating the ref.

```vue
<script setup>
import { ref } from 'vue'
import { DatePicker } from 'brutx-ui-vue'

const pickerRef = ref()
const date = ref(null)
</script>

<template>
    <DatePicker ref="pickerRef" v-model="date" />

    <button @click="pickerRef?.open = true">Open Panel</button>
    <button @click="pickerRef?.open = false">Close Panel</button>
</template>
```

### Methods

| Method/Property | Type | Description |
|----------|------|------|
| `open` | `Ref<boolean>` | Panel open/close state, readable and writable; set to `true` to open, `false` to close |

## Props

### DatePicker

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | Selected date, supports v-model |
| `open` | `boolean` | — | Panel open state, supports v-model:open two-way binding |
| `displayFormat` | `string` | `'YYYY-MM-DD'` | Display format (supports `YYYY`, `YY`, `MM`, `DD`, `HH`, `mm`, `ss`, `WW` tokens) |
| `placeholder` | `string` | — | Placeholder text |
| `minDate` | `Date` | — | Minimum selectable date |
| `maxDate` | `Date` | — | Maximum selectable date |
| `disabled` | `boolean` | `false` | Disabled state |
| `readonly` | `boolean` | `false` | Read-only state |
| `clearable` | `boolean` | `false` | Whether clearable |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Input size |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Input variant |
| `shortcuts` | `DatePickerShortcut[]` | `[]` | Shortcut options |
| `name` | `string` | — | Form field name |
| `id` | `string` | — | Component ID |
| `ariaLabel` | `string` | — | Accessibility label |

### DatePickerRange

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `[Date, Date] \| null` | `null` | Selected date range |
| `displayFormat` | `string` | `'YYYY-MM-DD'` | Display format (supports `YYYY`, `YY`, `MM`, `DD`, `HH`, `mm`, `ss`, `WW` tokens) |
| `startPlaceholder` | `string` | — | Start date placeholder |
| `endPlaceholder` | `string` | — | End date placeholder |
| `separator` | `string` | — | Separator |
| `minDate` | `Date` | — | Minimum selectable date |
| `maxDate` | `Date` | — | Maximum selectable date |
| `disabled` | `boolean` | `false` | Disabled state |
| `clearable` | `boolean` | `false` | Whether clearable |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Input size |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Input variant |
| `shortcuts` | `DatePickerRangeShortcut[]` | `[]` | Shortcut options |
| `name` | `string` | — | Form field name |
| `id` | `string` | — | Component ID |
| `ariaLabel` | `string` | — | Accessibility label |

### DateTimePicker

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | Selected date and time |
| `open` | `boolean` | — | Panel open state, supports v-model:open two-way binding |
| `displayFormat` | `string` | `'YYYY-MM-DD HH:mm'` | Display format; defaults to `'YYYY-MM-DD HH:mm:ss'` when `showSeconds` is `true` |
| `showSeconds` | `boolean` | `false` | Whether to show seconds |
| `timeStep` | `{ hour?: number; minute?: number; second?: number }` | `{ hour: 1, minute: 1, second: 1 }` | Time step |
| `placeholder` | `string` | — | Placeholder text |
| `minDate` | `Date` | — | Minimum selectable date |
| `maxDate` | `Date` | — | Maximum selectable date |
| `disabled` | `boolean` | `false` | Disabled state |
| `readonly` | `boolean` | `false` | Read-only state |
| `clearable` | `boolean` | `false` | Whether clearable |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Input size |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Input variant |
| `shortcuts` | `DatePickerShortcut[]` | `[]` | Shortcut options |
| `name` | `string` | — | Form field name |
| `id` | `string` | — | Component ID |
| `ariaLabel` | `string` | — | Accessibility label |

### TimePicker

> Note: `TimePicker` is a pure time selector based on the Select component. It does not use a Popover popup panel, so it does not support Popover-related props such as `open`, `readonly`, `clearable`, `size`, `variant`, `shortcuts`, `minDate`, `maxDate`, and `displayFormat`.

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | Selected time |
| `showSeconds` | `boolean` | `false` | Whether to show seconds |
| `timeStep` | `{ hour?: number; minute?: number; second?: number }` | `{ hour: 1, minute: 1, second: 1 }` | Time step |
| `disabled` | `boolean` | `false` | Disabled state |
| `embedded` | `boolean` | `false` | Whether to render in embedded mode (no outer border) |
| `ariaLabel` | `string` | — | Accessibility label |

### WeekPicker

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | Selected week (aligned to week start date) |
| `open` | `boolean` | — | Panel open state, supports v-model:open two-way binding |
| `displayFormat` | `string` | `'YYYY-WW'` | Display format (supports `YYYY`, `YY`, `MM`, `DD`, `HH`, `mm`, `ss`, `WW` tokens) |
| `weekStartsOn` | `0 \| 1` | `1` | Week start day (0=Sunday, 1=Monday) |
| `placeholder` | `string` | — | Placeholder text |
| `minDate` | `Date` | — | Minimum selectable date |
| `maxDate` | `Date` | — | Maximum selectable date |
| `disabled` | `boolean` | `false` | Disabled state |
| `readonly` | `boolean` | `false` | Read-only state |
| `clearable` | `boolean` | `false` | Whether clearable |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Input size |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Input variant |
| `shortcuts` | `DatePickerShortcut[]` | `[]` | Shortcut options |
| `name` | `string` | — | Form field name |
| `id` | `string` | — | Component ID |
| `ariaLabel` | `string` | — | Accessibility label |

### MonthPicker

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | Selected month |
| `open` | `boolean` | — | Panel open state, supports v-model:open two-way binding |
| `displayFormat` | `string` | `'YYYY-MM'` | Display format (supports `YYYY`, `YY`, `MM` tokens) |
| `placeholder` | `string` | — | Placeholder text |
| `minDate` | `Date` | — | Minimum selectable date |
| `maxDate` | `Date` | — | Maximum selectable date |
| `disabled` | `boolean` | `false` | Disabled state |
| `readonly` | `boolean` | `false` | Read-only state |
| `clearable` | `boolean` | `false` | Whether clearable |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Input size |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Input variant |
| `name` | `string` | — | Form field name |
| `id` | `string` | — | Component ID |
| `ariaLabel` | `string` | — | Accessibility label |

### YearPicker

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | Selected year |
| `open` | `boolean` | — | Panel open state, supports v-model:open two-way binding |
| `displayFormat` | `string` | `'YYYY'` | Display format (supports `YYYY`, `YY` tokens) |
| `placeholder` | `string` | — | Placeholder text |
| `minDate` | `Date` | — | Minimum selectable date |
| `maxDate` | `Date` | — | Maximum selectable date |
| `disabled` | `boolean` | `false` | Disabled state |
| `readonly` | `boolean` | `false` | Read-only state |
| `clearable` | `boolean` | `false` | Whether clearable |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Input size |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Input variant |
| `name` | `string` | — | Form field name |
| `id` | `string` | — | Component ID |
| `ariaLabel` | `string` | — | Accessibility label |

## Events

| Event | Payload | Description |
|------|------|------|
| `update:modelValue` | `Date \| [Date, Date] \| null` | Emitted when the value changes, applies to all components |
| `change` | `Date \| [Date, Date] \| null` | Emitted when the panel closes and the value has changed, applies to all components except `TimePicker` |
| `open` | — | Emitted when the panel opens, applies to all components except `TimePicker` |
| `close` | — | Emitted when the panel closes, applies to all components except `TimePicker` |
| `update:open` | `boolean` | Emitted when the panel open state changes, used with `v-model:open`, applies to `DatePicker`, `DateTimePicker`, `WeekPicker`, `MonthPicker`, and `YearPicker` |

## Accessibility

### Keyboard Navigation

| Key | Action |
|------|------|
| `Enter` / `Space` | Open the panel |
| `Escape` | Close the panel |
| `Tab` | Switch between the input and the panel |

## FAQ

**Q: After installation, the component reports an error that the `v-calendar` module cannot be found?**

A: The `DatePicker` component depends on `v-calendar`, which is an additional dependency that needs to be installed manually: `pnpm add v-calendar`. After installation, restart the dev server and it should work normally.

**Q: Why doesn't `DatePickerRange` have an `open` prop?**

A: `DatePickerRange` and `TimePicker` do not expose the `open` reactive ref and do not support controlling the panel state via `v-model:open` two-way binding. If you need programmatic control of the panel, please use `DatePicker`, `DateTimePicker`, `WeekPicker`, `MonthPicker`, or `YearPicker`.

**Q: After selecting a date in WeekPicker, why does the displayed week start date not match expectations?**

A: The `weekStartsOn` prop of `WeekPicker` controls the week start day: `0` means the week starts on Sunday, `1` means the week starts on Monday (default). After selecting any date, `modelValue` automatically aligns to the start of that week. If the displayed result does not match expectations, please check whether the `weekStartsOn` setting meets your business requirements.
