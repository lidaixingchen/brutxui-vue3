---
title: Dropdown Menu
description: Dropdown menu component supporting nested submenus, checkbox menu items, and radio menu items.
translated: true
---

# Dropdown Menu

A neo-brutalist style dropdown menu built on reka-ui's DropdownMenu primitive, supporting menu items, checkboxes, radio groups, submenus, and keyboard shortcuts.

## Demo

<ComponentPreview>
  <DropdownMenuDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="dropdown-menu" />

## Usage

### Basic Usage

```vue
<script setup>
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuShortcut,
} from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline">Open Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
```

### Checkbox Items

Use `v-model` to bind checkbox state, supporting both `boolean` and `'indeterminate'` values.

```vue
<script setup>
import { ref } from 'vue'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
} from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'

const showStatusBar = ref(true)
const showActivityBar = ref(false)
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline">View</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuCheckboxItem v-model="showStatusBar">
                Status Bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem v-model="showActivityBar">
                Activity Bar
            </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
```

### Radio Items

```vue
<script setup>
import { ref } from 'vue'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioItem,
    DropdownMenuRadioGroup,
} from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'

const position = ref('bottom')
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline">Position</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuRadioGroup v-model="position">
                <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="left">Left</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
```

### Submenus

```vue
<script setup>
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline">Open Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem>New Tab</DropdownMenuItem>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>More Tools</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuItem>Save Page</DropdownMenuItem>
                    <DropdownMenuItem>Developer Tools</DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuSub>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
```

## Sub-components

| Component | Description |
| --- | --- |
| `DropdownMenu` | Root component, re-export of reka-ui DropdownMenuRoot |
| `DropdownMenuTrigger` | Button to open the menu, re-export of reka-ui |
| `DropdownMenuContent` | Dropdown content panel |
| `DropdownMenuItem` | Standard menu item |
| `DropdownMenuCheckboxItem` | Checkbox menu item |
| `DropdownMenuRadioItem` | Radio menu item |
| `DropdownMenuRadioGroup` | Radio item group, re-export of reka-ui |
| `DropdownMenuLabel` | Section label |
| `DropdownMenuSeparator` | Visual separator |
| `DropdownMenuShortcut` | Keyboard shortcut hint |
| `DropdownMenuSub` | Submenu container, re-export of reka-ui |
| `DropdownMenuSubTrigger` | Submenu trigger |
| `DropdownMenuSubContent` | Submenu content |
| `DropdownMenuGroup` | Menu item group, re-export of reka-ui |

## API Reference

<span id="dropdownmenucontent"></span>
<span id="dropdownmenuitem"></span>
<span id="dropdownmenucheckboxitem"></span>
<span id="dropdownmenuradioitem"></span>
<span id="dropdownmenulabel"></span>
<span id="dropdownmenuseparator"></span>
<span id="dropdownmenushortcut"></span>
<span id="dropdownmenusubtrigger"></span>
<span id="dropdownmenusubcontent"></span>
<span id="dropdownmenucheckboxitem-1"></span>

<ComponentApi name="dropdown-menu" />

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to open the menu, `Escape` to close the menu, arrow keys to navigate menu items
- **ARIA Attributes**: Automatically manages `aria-expanded`, `aria-haspopup`, `role="menu"` and other accessibility attributes
- **Focus Management**: Focus is trapped within the menu when open; focus returns to the trigger when closed
- **Submenu Navigation**: Supports expanding and navigating submenus via arrow keys
