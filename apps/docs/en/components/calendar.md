---
title: Calendar
description: Calendar component supporting date selection and range selection, combining neo-brutalist borders with hard shadow design.
translated: true
---

# Calendar

A neo-brutalist style calendar component built on v-calendar DatePicker, supporting single date and date range selection. It features the signature brutal style with thick borders and hard shadows, along with visual feedback for selected state, range state, and today highlight.

## Demo

<ComponentPreview>
  <CalendarDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="calendar" />

**Additional dependency required:**

```bash
pnpm add v-calendar
```

## Usage

### Single Date Selection

```vue
<script setup>
import { ref } from 'vue'
import { Calendar } from 'brutx-ui-vue/calendar'

const date = ref(null)
</script>

<template>
    <Calendar v-model="date" />
</template>
```

### Date Range Selection

```vue
<script setup>
import { ref } from 'vue'
import { Calendar } from 'brutx-ui-vue/calendar'

const dateRange = ref(null)
</script>

<template>
    <Calendar v-model="dateRange" :is-range="true" />
</template>
```

### Disabled State

```vue
<template>
    <Calendar :disabled="true" />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `Date \| Date[] \| null` | `undefined` | Selected date, supports v-model binding. `Date` for single mode, `[Date, Date]` for range mode |
| `isRange` | `boolean` | `false` | Whether to enable date range selection mode |
| `disabled` | `boolean` | `false` | Disables the calendar, making it semi-transparent and non-interactive |
| `events` | `CalendarEvent[]` | `[]` | Event markers data, displays event indicators on corresponding dates |
| `eventRenderer` | `(event: CalendarEvent) => VNode \| string` | — | Custom event render function, returns a VNode or string |
| `mode` | `'default' \| 'card'` | `'default'` | Event display mode: `default` shows dot indicators with Tooltip, `card` shows adaptive-height cards with capsule badges |
| `class` | `string` | `undefined` | Custom CSS class name |

## Events

| Event | Payload | Description |
|------|------|------|
| `update:modelValue` | `Date \| Date[] \| null` | Emitted when the selected date changes |

## Slots

The Calendar component exposes the following slots via v-calendar's DatePicker, which can be used to customize the header and date cells:

| Slot | Scope | Description |
|------|--------|------|
| `header-prev-button` | — | Custom previous month navigation button (defaults to ChevronLeft icon) |
| `header-title` | `{ title: string }` | Custom header title (defaults to bold uppercase display) |
| `header-next-button` | — | Custom next month navigation button (defaults to ChevronRight icon) |
| `day-content` | `{ day: object, dayProps: object, dayEvents: object }` | Custom date cell content |

## Event Markers

Use the `events` prop to mark events on the calendar. Two display modes are supported.

### Data Type

```ts
interface CalendarEvent {
    date: Date | string    // Event date
    title: string          // Event title
    [key: string]: unknown // Additional custom fields
}
```

### Default Mode

Dot indicators with Tooltip, ideal for calendars with fewer events:

```vue
<script setup>
import { Calendar } from 'brutx-ui-vue/calendar'

const events = [
    { date: '2025-07-15', title: 'Team Meeting' },
    { date: '2025-07-20', title: 'Product Launch' },
    { date: '2025-07-20', title: 'Code Review' },
]
</script>

<template>
    <Calendar :events="events" />
</template>
```

### Card Mode

Adaptive-height cards with capsule badges, ideal for calendars with many events:

```vue
<script setup>
import { Calendar } from 'brutx-ui-vue/calendar'

const events = [
    { date: '2025-07-15', title: 'Team Meeting' },
    { date: '2025-07-20', title: 'Product Launch' },
    { date: '2025-07-20', title: 'Code Review' },
]
</script>

<template>
    <Calendar :events="events" mode="card" />
</template>
```

### Custom Event Rendering

Use `eventRenderer` to customize how events are rendered:

```vue
<script setup>
import { Calendar } from 'brutx-ui-vue/calendar'
import { h } from 'vue'

const events = [
    { date: '2025-07-15', title: 'Team Meeting', color: 'red' },
    { date: '2025-07-20', title: 'Product Launch', color: 'blue' },
]

function renderEvent(event) {
    return h('span', { style: { color: event.color } }, event.title)
}
</script>

<template>
    <Calendar :events="events" :event-renderer="renderEvent" />
</template>
```

## Accessibility

- **Keyboard Interaction**: Supported via v-calendar's built-in support; use arrow keys to navigate between dates, `Enter` / `Space` to select a date, `Escape` to close the popup panel (if applicable)
- **ARIA Attributes**: v-calendar automatically manages semantic attributes such as `role="grid"` and `role="gridcell"` for the date grid
- **Focus Management**: Navigation buttons can be focused via `Tab` key, and date cells support arrow key navigation
