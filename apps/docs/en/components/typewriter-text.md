---
title: TypewriterText Typewriter Text
description: A typewriter animation component that displays text character by character, supporting loop playback, cursor blinking, and accessibility.
translated: true
---

# TypewriterText Typewriter Text

Neobrutalist-style typewriter effect text component that displays text character by character with a blinking cursor animation. Suitable for landing pages, welcome messages, code demonstrations, and similar scenarios.

## Demo

<ComponentPreview>
    <TypewriterTextDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="typewriter-text" />

## Usage

```vue
<script setup>
import { TypewriterText } from 'brutx-ui-vue'
</script>

<template>
    <TypewriterText
        text="Welcome to BrutxUI!"
        :speed="80"
        cursor
    />
</template>
```

### Loop Playback

```vue
<template>
    <TypewriterText
        text="Continuous typing effect..."
        :speed="60"
        :delay="2000"
        loop
        cursor
    />
</template>
```

### Event Listening

```vue
<script setup>
import { TypewriterText } from 'brutx-ui-vue'

function onStart() {
    console.log('Typing started')
}

function onComplete() {
    console.log('Typing completed')
}
</script>

<template>
    <TypewriterText
        text="Callback triggered after typing completes"
        :speed="80"
        @start="onStart"
        @complete="onComplete"
    />
</template>
```

## Variants

| Variant | CSS Class |
|------|--------|
| `normal` | `font-normal` |
| `medium` | `font-medium` |
| `bold` | `font-bold` |
| `black` | `font-black` |

## Sizes

| Size | CSS Class | Cursor Height |
|------|--------|----------|
| `sm` | `text-sm` | `h-3` |
| `default` | `text-base` | `h-4` |
| `lg` | `text-lg` | `h-5` |
| `xl` | `text-xl` | `h-6` |
| `2xl` | `text-2xl` | `h-7` |

```vue
<template>
    <TypewriterText
        text="Large bold text"
        size="xl"
        weight="bold"
        :speed="100"
    />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `text` | `string` | — (required) | Text to display |
| `speed` | `number` | `50` | Typing speed (ms per character) |
| `delay` | `number` | `0` | Delay time before typing starts (ms). In loop mode, also used as the interval between each restart |
| `loop` | `boolean` | `false` | Whether to loop playback |
| `cursor` | `boolean` | `true` | Whether to show the cursor. The cursor is only visible during typing; in non-loop mode, it automatically hides after typing completes |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | Text size |
| `weight` | `'normal' \| 'medium' \| 'bold' \| 'black'` | `'normal'` | Text weight |
| `class` | `string` | — | Custom class name |

## Events

| Event | Payload | Description |
|------|------|------|
| `start` | — | Triggered when typing starts |
| `complete` | — | Triggered when typing completes |

## Accessibility

- **ARIA attributes**: The component uses `aria-live="polite"` to ensure screen readers can detect text changes; the cursor uses `aria-hidden="true"` to mark it as a decorative element
- **Motion reduction**: When the user prefers `prefers-reduced-motion: reduce`, the full text is displayed immediately, skipping the animation; this preference responds to system setting changes in real time

## FAQ

**Q: What happens when the `text` prop changes?**

A: When the `text` prop changes, the typing animation restarts.

**Q: How are timers handled when the component is unmounted?**

A: All timers (including typing timers and delay start timers) are automatically cleaned up when the component is unmounted to avoid memory leaks.

**Q: What is the behavior in loop mode?**

A: In loop mode, after typing completes, it waits for `delay` milliseconds before restarting.

**Q: How do I customize styles?**

A: The component root element always has the `brutx-typewriter` CSS class, which can be used for custom style overrides.
