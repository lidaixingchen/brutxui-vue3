---
title: Menu
description: A navigation menu component supporting horizontal and vertical modes, nested structures with fold animations, and vue-router pushing.
---

# Menu

Used for site headers or sidebars, supporting `mode: 'horizontal' | 'vertical'`, multi-level nested `SubMenu` fold animations, and dynamic routing pushing with `vue-router`.

## Preview

<ComponentPreview>
  <MenuDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="menu" />

## Usage

### Vertical Mode

```vue
<script setup>
import { ref } from 'vue'
import { Menu, MenuItem, SubMenu } from 'brutx-ui-vue'

const active = ref('1')
</script>

<template>
    <Menu default-active="1" mode="vertical" @select="idx => active = idx">
        <MenuItem index="1">Home</MenuItem>
        <SubMenu index="sub-admin" title="Admin Panel">
            <MenuItem index="admin-users">Users</MenuItem>
            <MenuItem index="admin-settings">Settings</MenuItem>
        </SubMenu>
        <MenuItem index="3" disabled>Disabled Item</MenuItem>
    </Menu>
</template>
```

### Horizontal Mode

Set `mode="horizontal"` to align items horizontally. Under horizontal mode, nested `SubMenu` lists will display as absolutely-positioned hover dropdowns instead of collapsing inline.

```vue
<script setup>
import { ref } from 'vue'
import { Menu, MenuItem, SubMenu } from 'brutx-ui-vue'

const active = ref('home')
</script>

<template>
    <Menu default-active="home" mode="horizontal" @select="idx => active = idx">
        <MenuItem index="home">Home</MenuItem>
        <SubMenu index="products" title="Products">
            <MenuItem index="product-1">Cloud Servers</MenuItem>
            <MenuItem index="product-2">Databases</MenuItem>
        </SubMenu>
        <MenuItem index="about">About</MenuItem>
    </Menu>
</template>
```

### Routing Mode

Set `router` to `true` to auto-push routes on click. If `route` prop is not explicitly specified on a `MenuItem`, its `index` attribute will be used as the target path.

```vue
<template>
    <Menu router default-active="/home" mode="vertical">
        <MenuItem index="/home">Home</MenuItem>
        <MenuItem index="/users" :route="{ name: 'UsersList' }">Users</MenuItem>
        <MenuItem index="/settings">Settings</MenuItem>
    </Menu>
</template>
```

## Subcomponents

| Component | Description |
|-----------|-------------|
| `Menu` | Root menu component providing context state |
| `MenuItem` | Menu item component |
| `SubMenu` | Submenu component for nested and collapsible contents |

## Props

### Menu

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'horizontal' \| 'vertical'` | `'vertical'` | Alignment mode |
| `defaultActive` | `string` | `''` | Key of the default active menu item |
| `router` | `boolean` | `false` | Enable vue-router redirection modes |
| `class` | `string` | — | Custom class list |

### MenuItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `index` | `string` | — | Required, unique key identifying the menu item |
| `disabled` | `boolean` | `false` | Disable item interaction |
| `route` | `string \| object` | — | Target route path or object |
| `class` | `string` | — | Custom class list |

### SubMenu

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `index` | `string` | — | Required, unique key identifying the sub-menu |
| `title` | `string` | `''` | Title label (prioritized below `title` slot) |
| `disabled` | `boolean` | `false` | Disable entire sub-menu interaction |
| `triggerClass` | `string` | — | Custom header trigger class list |
| `class` | `string` | — | Custom wrapper class list |

## Events

### Menu

| Event | Parameters | Description |
|-------|------------|-------------|
| `select` | `string` | Emitted when a menu item is clicked and selected, parameter is the active `index` |

## Slots

### SubMenu

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Nested submenu items (e.g. `MenuItem` or nested `SubMenu`) |
| `title` | — | Custom header title trigger elements |

## Accessibility

- **Keyboard Interaction**: Supports using `Enter` or `Space` keys to select `MenuItem` or expand/collapse `SubMenu`.
- **ARIA Attributes**: The root component automatically sets `role="menubar"`, and each menu item sets `role="menuitem"`. The submenu trigger automatically manages `aria-haspopup="true"` and `aria-expanded` attributes.
- **Reduced Motion**: Fold animation in vertical mode respects `prefers-reduced-motion` settings and automatically downgrades (if applicable).

