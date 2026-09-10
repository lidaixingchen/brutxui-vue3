---
title: Countdown
description: Drift-free countdown timer based on absolute timestamp differences, supporting formatting, millisecond refreshes, sleep calibration, and finish notifications.
---

# Countdown

Precise countdown timer calculated from absolute timestamp differences. Self-calibrates when recovering from background tab throttling to eliminate cumulative timer drift, paired with accessible screen reader announcements.

## Preview

<ComponentPreview>
  <CountdownDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="countdown" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Countdown } from 'brutx-ui-vue'

const targetTime = ref(Date.now() + 1000 * 60 * 60 * 24)
</script>

<template>
    <!-- Basic countdown -->
    <Countdown title="Time Left" :value="targetTime" />

    <!-- Custom format and card layout -->
    <Countdown
        title="Deadline"
        :value="targetTime"
        format="DD [days] HH [hours] mm [mins] ss [secs]"
        variant="card"
    />
</template>
```

### Millisecond Refresh and Escaping

Including `SSS` in the `format` string automatically enables high-frequency (~30fps) refreshes. Literal letters matching format tokens (like `D`, `H`, `m`, `s`) can be escaped inside brackets `[...]`:

```vue
<template>
    <Countdown
        title="Flash Sale"
        :value="Date.now() + 60000"
        format="mm:ss.SSS"
        variant="card"
    />
</template>
```

### Finish and Change Events

Listen to the `@finish` event when countdown hits zero, and monitor `@change` for remaining milliseconds:

```vue
<script setup>
import { Countdown } from 'brutx-ui-vue'

function onFinish() {
    console.log('Countdown reached zero!')
}

function onChange(remainingMs: number) {
    console.log('Remaining milliseconds:', remainingMs)
}
</script>

<template>
    <Countdown
        :value="Date.now() + 5000"
        @finish="onFinish"
        @change="onChange"
    />
</template>
```

## Variants

| Variant | Description |
| ------- | ----------- |
| `default` | Default variant with lightweight inline layout and no extra border/background |
| `card` | Neo-Brutalist card with 3px solid border, hard drop shadow, padding, and rounded corners |
| `bordered` | Solid bordered card container without drop shadow |
| `subtle` | Highlighted subtle background card with solid border and hard drop shadow |

```vue
<template>
    <Countdown title="Default" :value="targetTime" variant="default" />
    <Countdown title="Card" :value="targetTime" variant="card" />
    <Countdown title="Bordered" :value="targetTime" variant="bordered" />
    <Countdown title="Subtle" :value="targetTime" variant="subtle" />
</template>
```

## Sizes

| Size | Title Font Size | Value Font Size |
| ---- | --------------- | --------------- |
| `sm` | `text-xs` | `text-2xl` |
| `default` | `text-sm` | `text-3xl sm:text-4xl` |
| `lg` | `text-base` | `text-4xl sm:text-5xl` |

```vue
<template>
    <Countdown title="Small" :value="targetTime" size="sm" variant="card" />
    <Countdown title="Default" :value="targetTime" size="default" variant="card" />
    <Countdown title="Large" :value="targetTime" size="lg" variant="card" />
</template>
```

## Exported Types

The component exports variant helper functions and format parsing utilities:

```ts
import type {
    CountdownProps,
    CountdownValue,
    CountdownEmits,
    CountdownVariantProps,
} from 'brutx-ui-vue'
import {
    countdownVariants,
    parseCountdownTarget,
    formatCountdown,
} from 'brutx-ui-vue'
```

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `value` | `number \| string \| Date \| null` | `undefined` | Target deadline timestamp (ms), Date object, or ISO date string |
| `format` | `string` | `'HH:mm:ss'` | Format template supporting `DD`, `D`, `HH`, `H`, `mm`, `m`, `ss`, `s`, `SSS`, `SS`, `S`, and `[...]` escapes |
| `title` | `string` | `undefined` | Countdown header title text |
| `prefix` | `string` | `undefined` | Prefix text before the time value |
| `suffix` | `string` | `undefined` | Suffix text after the time value |
| `placeholder` | `string` | `'-'` | Fallback placeholder text when target is missing or invalid |
| `variant` | `'default' \| 'card' \| 'bordered' \| 'subtle'` | `'default'` | Visual container variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size preset |
| `class` | `string` | `undefined` | Custom CSS class name |

## Events

| Event | Parameters | Description |
| ----- | ---------- | ----------- |
| `finish` | — | Emitted once when the countdown reaches zero |
| `change` | `remaining: number` | Emitted on every tick with the remaining time in milliseconds |

## Slots

| Slot | Scope | Description |
| ---- | ----- | ----------- |
| `default` | `{ remaining: number; formatted: string; isFinished: boolean }` | Custom content for the countdown value |
| `title` | `{ title?: string }` | Custom content for the title area |
| `prefix` | `{ prefix?: string }` | Custom content for the prefix area |
| `suffix` | `{ suffix?: string }` | Custom content for the suffix area |

## Accessibility

- **Keyboard Interaction**: Pure temporal display component that does not trap keyboard input; embedded interactive controls follow standard focus flow.
- **ARIA Attributes**: Keeps `aria-live` quiet during high-frequency ticks to avoid screen reader spam; triggers a single `aria-live="polite"` speech announcement when countdown reaches zero.
- **Focus Management**: Non-modal inline layout without focus traps, respecting assistive cursor navigation.
- **Motion Reduction**: Number characters use monospace numerals (`font-mono`) to prevent layout shifting on tick updates; outputs deterministic static placeholders during SSR to guarantee hydration consistency.
