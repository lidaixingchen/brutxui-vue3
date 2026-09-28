---
title: Date Picker
description: Neo-brutalist date picker component family supporting single date, date range, date-time, week/month/year selection, built on v-calendar and reka-ui Popover.
translated: true
---

# Date Picker

A neo-brutalist style date picker component family built on v-calendar and reka-ui Popover. It provides 7 ready-to-use pickers plus standalone panels and a reusable footer. Popup pickers share trigger style variants, while TimePicker uses its own layout of time dropdowns.

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
import { DatePicker } from 'brutx-ui-vue/date-picker'

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
import { DatePicker } from 'brutx-ui-vue/date-picker'

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
import { DatePickerRange } from 'brutx-ui-vue/date-picker'

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
import { DateTimePicker } from 'brutx-ui-vue/date-picker'

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

`TimePicker` combines Select components for hours, minutes, and optional seconds, configured through `disabled`, `showSeconds`, `timeStep`, `embedded`, and `ariaLabel`. The popup date-picker props `open`, `readonly`, `clearable`, `size`, `variant`, `shortcuts`, `minDate`, `maxDate`, and `displayFormat` are not part of its public props.

```vue
<script setup>
import { ref } from 'vue'
import { TimePicker } from 'brutx-ui-vue/date-picker'

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
import { WeekPicker } from 'brutx-ui-vue/date-picker'

const week = ref(null)
</script>

<template>
    <WeekPicker v-model="week" :week-starts-on="1" placeholder="Select week" />
</template>
```

`weekStartsOn`: `0` = week starts on Sunday, `1` = week starts on Monday (default). After selecting any date, `modelValue` automatically aligns to the start of that week, and the entire week is highlighted.

> **Note**: The `weekStartsOn` default (`1`, Monday) is not derived from the `useLocale` regional setting — a known limitation. ISO 8601 and Chinese regional conventions both start weeks on Monday; if your business needs Sunday as the week start (e.g. en-US convention), pass `weekStartsOn: 0` explicitly.

### MonthPicker - Month Selection

```vue
<script setup>
import { ref } from 'vue'
import { MonthPicker } from 'brutx-ui-vue/date-picker'

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
import { YearPicker } from 'brutx-ui-vue/date-picker'

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
import { DatePicker } from 'brutx-ui-vue/date-picker'

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

`displayFormat` only affects the string shown in the input. It does not change the types of `modelValue`, `minDate`, `maxDate`, `shortcuts`, or emitted payloads; those public APIs always use `Date`, `[Date, Date]`, or `null`. For cross-time-zone datetime consistency, normalize values in your application as `Date`, timestamps, or full ISO strings with explicit offsets before converting them to `Date`; do not rely on native parsing of arbitrary date strings.

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
| `DatePickerPanel` | Embeddable single-date panel |
| `DatePickerRangePanel` | Embeddable date-range panel |
| `DateTimePickerPanel` | Datetime panel combining a calendar and TimePicker |
| `WeekPickerPanel` | Week panel aligning selection to the week start |
| `MonthPickerPanel` | Month grid with year navigation |
| `YearPickerPanel` | Year grid with configurable years per page |
| `DatePickerPanelFooter` | Reusable Clear and Confirm buttons and their events |

## Data Types

```typescript
// Single date shortcut
interface DatePickerShortcut {
    label: string
    value: Date | (() => Date)
}

// Date range in start/end order
type DateRange = readonly [Date, Date]

// Date range shortcut
interface DatePickerRangeShortcut {
    label: string
    value: DateRange | (() => DateRange)
}
```

## Composables

The logic for popup panel triggering, display formatting, clearing, and confirmation in components like `DatePicker` has been extracted into a standalone `useDatePicker` composable. It can be used independently when you need to build a fully custom trigger or calendar panel. It manages the panel open/close state, synchronizes the display value with `modelValue`, and triggers `open` / `close` / `change` / `update:modelValue` events through the provided `emit`.

```ts
import { useDatePicker } from 'brutx-ui-vue/useDatePicker'
import type { UseDatePickerOptions } from 'brutx-ui-vue/useDatePicker'

const props = defineProps<{ modelValue?: Date | null }>()

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
    modelValue: () => props.modelValue ?? null,
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
| `displayFormat` | `MaybeRefOrGetter<string>` | `'YYYY-MM-DD'` | Display format (supports `YYYY`, `YY`, `MM`, `DD`, `HH`, `mm`, `ss`, `WW` tokens) |
| `disabled` | `MaybeRefOrGetter<boolean>` | `false` | Whether disabled |
| `readonly` | `MaybeRefOrGetter<boolean>` | `false` | Prevents opening the panel internally |
| `openProp` | `MaybeRefOrGetter<boolean \| undefined>` | `undefined` | Controlled open state; omitted values use internal state |
| `emitUpdateOpen` | `(value: boolean) => void` | — | Called on open-state requests to synchronize controlled state with openProp |
| `emit` | `DatePickerEmit` | — | Event emission function (required, type consistent with component emits) |

### Return Values

| Prop | Type | Description |
|------|------|------|
| `open` | `Ref<boolean>` | Whether the panel is open |
| `displayValue` | `Readonly<Ref<Date \| null>>` | Current panel selection, read-only to the caller |
| `formattedDisplay` | `ComputedRef<string>` | Formatted string according to `displayFormat` |
| `handlePanelUpdate(value)` | `(value: Date \| null) => void` | Called when the panel value updates, synchronizes `displayValue` and triggers `update:modelValue` |
| `handlePanelConfirm(value)` | `(value: Date \| null) => void` | Called when the panel is confirmed, triggers `update:modelValue` / `change` and closes the panel |
| `handlePanelClear()` | `() => void` | Called when the panel is cleared, triggers `update:modelValue(null)` / `change(null)` |
| `handleClearClick(event)` | `(event: Event) => void` | Trigger clear callback, stops propagation and clears the value |
| `handleTriggerKeydown(event)` | `(event: KeyboardEvent) => void` | Prevents Enter / Space defaults when disabled or read-only; the trigger primitive handles ordinary opening |

> Note: `emit` must conform to the `DatePickerEmit` signature. Call the composable within `setup()` or a managed Vue effect scope so its reactive watchers are disposed of appropriately.

## Programmatic Control

`DatePicker`, `DateTimePicker`, `WeekPicker`, `MonthPicker`, and `YearPicker` expose an `open` reactive ref via `defineExpose`, allowing parent components to programmatically open or close the date panel. `open` is a writable reference bound to the internal Popover. Controlled writes emit `update:open` and take effect when the parent updates `open`. `readonly` blocks requests to open the panel internally.

> Note: `DatePickerRange` and `TimePicker` do not expose `open`. `DatePicker`, `DateTimePicker`, `WeekPicker`, `MonthPicker`, and `YearPicker` also support `v-model:open` two-way binding. Using `v-model:open` is recommended over directly manipulating the ref.

```vue
<script setup>
import { ref } from 'vue'
import { DatePicker } from 'brutx-ui-vue/date-picker'
import { Button } from 'brutx-ui-vue/button'

const pickerRef = ref()
const date = ref(null)
</script>

<template>
    <DatePicker ref="pickerRef" v-model="date" />

    <Button @click="pickerRef && (pickerRef.open = true)">Open Panel</Button>
    <Button @click="pickerRef && (pickerRef.open = false)">Close Panel</Button>
</template>
```

<span id="methods"></span>

## API Reference

<span id="datepicker"></span>
<span id="datepickerrange"></span>
<span id="datetimepicker"></span>
<span id="timepicker"></span>
<span id="weekpicker"></span>
<span id="monthpicker"></span>
<span id="yearpicker"></span>

<ComponentApi name="date-picker" />

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
