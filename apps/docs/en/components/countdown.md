---
title: Countdown
description: Countdown timer based on absolute timestamp differences, with a stable SSR first frame, formatting, millisecond refreshes, sleep calibration, and finish notifications.
---

# Countdown

Precise countdown timer calculated from absolute timestamp differences. Self-calibrates when recovering from background tab throttling to eliminate cumulative timer drift, paired with accessible screen reader announcements. To keep SSR hydration consistent, both the server and the client's initial render show placeholder text; the browser clock is read and timing starts after mount.

## Preview

<ComponentPreview>
  <CountdownDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="countdown" />

## Usage

```vue
<script setup>
import { onMounted, ref } from 'vue'
import { Countdown } from 'brutx-ui-vue'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const targetTime = ref<number | null>(null)

onMounted(() => {
    targetTime.value = Date.now() + ONE_DAY_MS
})
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

### SSR First Frame and Custom Content

During SSR and hydration, the component displays `placeholder` (default `-`) first, then calculates the remaining time from `value` after mount. The default slot's `formatted` value is also placeholder text until then; `remaining` is `0` and `isFinished` is `false`. `isReady` becomes `true` after mount and the first calculation; `remaining` and `isFinished` then reflect the current target.

```vue
<Countdown :value="targetTime">
    <template #default="{ formatted, isReady }">
        {{ isReady ? formatted : 'Preparing countdown' }}
    </template>
</Countdown>
```

### Millisecond Refresh and Escaping

Including `SSS` in the `format` string automatically enables high-frequency (~30fps) refreshes. Literal letters matching format tokens (like `D`, `H`, `m`, `s`) can be escaped inside brackets `[...]`:

```vue
<script setup>
import { onMounted, ref } from 'vue'

const ONE_MINUTE_MS = 60 * 1000
const targetTime = ref<number | null>(null)

onMounted(() => {
    targetTime.value = Date.now() + ONE_MINUTE_MS
})
</script>

<template>
    <Countdown
        title="Flash Sale"
        :value="targetTime"
        format="mm:ss.SSS"
        variant="card"
    />
</template>
```

### Finish and Change Events

Listen to the `@finish` event when countdown hits zero, and monitor `@change` for remaining milliseconds:

```vue
<script setup>
import { onMounted, ref } from 'vue'
import { Countdown } from 'brutx-ui-vue'

const FIVE_SECONDS_MS = 5 * 1000
const targetTime = ref<number | null>(null)

onMounted(() => {
    targetTime.value = Date.now() + FIVE_SECONDS_MS
})

function onFinish() {
    console.log('Countdown reached zero!')
}

function onChange(remainingMs: number) {
    console.log('Remaining milliseconds:', remainingMs)
}
</script>

<template>
    <Countdown
        :value="targetTime"
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

## API Reference

<ComponentApi name="countdown" />

## Accessibility

- **Keyboard Interaction**: Pure temporal display component that does not trap keyboard input; embedded interactive controls follow standard focus flow.
- **ARIA Attributes**: Keeps `aria-live` quiet during high-frequency ticks to avoid screen reader spam; triggers a single `aria-live="polite"` speech announcement when countdown reaches zero.
- **Focus Management**: Non-modal inline layout without focus traps, respecting assistive cursor navigation.
- **Number Layout**: Uses monospace numerals (`font-mono`) to reduce width changes during updates. Remaining time is calculated from the current clock and timer scheduling begins after mount. Custom default slots can use `isReady` to distinguish the placeholder first frame from calculated values.
