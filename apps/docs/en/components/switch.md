---
title: Switch
description: Toggle switch component for quick true/false boolean state switching.
translated: true
---

# Switch

A Neo-Brutalism sliding switch built on reka-ui's Switch primitive, featuring a bold border, a fixed hard shadow, and a solid thumb, with v-model support.

## Demo

<ComponentPreview>
  <SwitchDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="switch" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const enabled = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch id="airplane-mode" v-model="enabled" />
        <Label for="airplane-mode">Airplane mode</Label>
    </div>
</template>
```

Use `defaultValue` to set the initial uncontrolled state at mount:

```vue
<Switch :default-value="true" aria-label="Receive notifications" />
```

### Status Labels

Enable `showLabels` to display the current state inside the thumb. The built-in labels are `I` for on and `O` for off. Customize the text or symbols with `checkedLabel` and `uncheckedLabel`; omitted values use the locale's `switch.checkedLabel` and `switch.uncheckedLabel` text.

The thumb has limited space, so single characters such as “✓ / ×” are recommended. Place longer descriptions in an external `Label`. The label color is paired with the thumb background. Decorative text is hidden with `aria-hidden`; `aria-checked` conveys the accessible state, and `ariaLabel` sets the control's accessible name.

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const power = ref(true)
const sync = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch id="device-power" v-model="power" show-labels />
        <Label for="device-power">Main Equipment Power</Label>
    </div>
    <div class="flex items-center gap-3">
        <Switch id="auto-sync" v-model="sync" show-labels checked-label="✓" unchecked-label="×" />
        <Label for="auto-sync">Auto sync</Label>
    </div>
</template>
```

### Switch Motion

The outer frame and hard shadow remain fixed during hover, press, and state changes. The thumb moves horizontally over 180ms with `ease-brutal-snap`, while the track changes color over 120ms. Keyboard focus indicators appear immediately.

When the system enables reduced motion (`prefers-reduced-motion: reduce`), the thumb position and track color change immediately.

### Disabled State

```vue
<template>
    <Switch disabled />
</template>
```

### Custom Accessibility Label

Associate a visible name using `id` and a `Label` with `for`, or wrap the switch in a `Label`. Clicking the associated label toggles the switch. Use `ariaLabelledby` to reference another naming element with the highest priority, or `ariaLabel` to provide an explicit name. The locale fallback is used only without an explicit name or associated label.

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const sync = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch v-model="sync" aria-label="Auto-sync data" />
        <Label>Auto sync</Label>
    </div>
</template>
```

### Native Forms

Set `name` to submit the enabled, checked switch as `name/value` with its owning native `<form>`. The default `value` is `on`. Off or disabled fields are omitted. Combine `required` with `name` to require the switch to be on for native validation.

```vue
<script setup>
import { Button, Switch, Label } from 'brutx-ui-vue'
</script>

<template>
    <form>
        <Switch id="notifications" name="notifications" value="enabled" :default-value="true" required />
        <Label for="notifications">Receive notifications</Label>
        <Button type="submit">Submit</Button>
        <Button type="reset">Reset</Button>
    </form>
</template>
```

A native form reset restores an uncontrolled switch to its `defaultValue` at mount without playing the toggle sound. Controlled state remains determined by `v-model`; update the binding in the form's `reset` handler when needed. Cancelling the reset event preserves the current state.

## API Reference

<ComponentApi name="switch" />

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to toggle switch state
- **ARIA attributes**: Automatically manages `role="switch"`, `aria-checked`, and `aria-required`; supports a visible associated Label, `ariaLabelledby`, and an explicit `ariaLabel`
- **Focus management**: Focusable via Tab key, uses `--brutal-ring` token for visible focus ring
- **Reduced motion**: Respects `prefers-reduced-motion` by disabling thumb and track transitions
- **Label isolation**: `showLabels` status labels carry `aria-hidden="true"`; `aria-checked` conveys the switch state

