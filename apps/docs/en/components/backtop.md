---
title: Backtop
description: Scroll-to-top shortcut button supporting throttle optimization and high-contrast retro borders.
---

# Backtop

A shortcut button that triggers smooth scrolling back to the top of its viewport. Features custom throttle protections on scroll events and classical brutalist card layouts.

## Preview

<ComponentPreview>
  <BacktopDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="backtop" />

## Usage

### Basic Global Usage

Include `<Backtop>` inside your main wrapper template. The shortcut button appears automatically once page scroll offset passes 200px.

```vue
<script setup>
import { Backtop } from 'brutx-ui-vue'
</script>

<template>
    <Backtop :visibility-height="200" />
</template>
```

### Local Target Scroll Container

Target scroll containers that have `overflow-y: auto` by assigning the selector ID or element reference to the `target` prop.

```vue
<template>
    <div id="my-scroll-box" class="h-60 overflow-y-auto relative">
        <div class="h-[800px]">...</div>
        
        <!-- target binds element selector -->
        <Backtop target="#my-scroll-box" :visibility-height="100" />
    </div>
</template>
```

### Custom Positioning and Themes

Apply customized alignment offsets via `right` or `bottom` coordinates, and toggle color layouts by modifying `variant`.

```vue
<template>
    <Backtop 
        :right="80" 
        :bottom="80" 
        variant="accent" 
        :visibility-height="150" 
    />
</template>
```

## API Reference

<span id="backtop-1"></span>
<span id="backtop-2"></span>

<ComponentApi name="backtop" />

## Accessibility

- **Keyboard**: The button supports focus with Tab and activation with Enter or Space.
- **ARIA Semantics**: The button uses the localized `backtop.backToTop` message as its accessible name.
- **Scrolling**: Activation requests native scrolling with `{ top: 0, behavior: 'smooth' }`; the browser controls the resulting scrolling behavior.
