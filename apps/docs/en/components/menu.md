---
title: Menu
description: A navigation menu component supporting horizontal and vertical modes, nested structures with fold animations, and vue-router pushing.
---

# Menu

Used for site headers or sidebars, supporting `mode: 'horizontal' | 'vertical'`, multi-level nested `SubMenu` fold animations, and dynamic routing pushing with `vue-router`.

## Preview

Due to VitePress runtime environment constraints, please check the component preview within the Demo packages.

## Installation

<InstallationTabs componentName="menu" />

## Usage

### Vertical Mode

```vue
<script setup>
import { ref } from 'vue'
import { Menu, MenuItem, SubMenu } from 'brutx-ui-vue'

const active = ref('home')
</script>

<template>
    <Menu default-active="home" mode="vertical" v-model:active="active">
        <MenuItem index="home">Home</MenuItem>
        <SubMenu index="admin" title="Admin Panel">
            <MenuItem index="admin-users">Users</MenuItem>
            <MenuItem index="admin-settings">Settings</MenuItem>
        </SubMenu>
        <MenuItem index="disabled" disabled>Disabled Item</MenuItem>
    </Menu>
</template>
```

### Horizontal Mode

Set `mode="horizontal"` to align items horizontally. Under horizontal mode, nested `SubMenu` lists will display as absolutely-positioned hover dropdowns instead of collapsing inline.

```vue
<template>
    <Menu default-active="home" mode="horizontal">
        <MenuItem index="home">Home</MenuItem>
        <SubMenu index="products" title="Products">
            <MenuItem index="prod-server">Cloud Servers</MenuItem>
            <MenuItem index="prod-db">Databases</MenuItem>
        </SubMenu>
        <MenuItem index="about">About</MenuItem>
    </Menu>
</template>
```

### Routing Mode (Router)

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

## API

### Menu Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `mode` | `'horizontal' \| 'vertical'` | `'vertical'` | Alignment mode |
| `defaultActive` | `string` | `''` | Key of the default active menu item |
| `router` | `boolean` | `false` | Enable vue-router redirection modes |
| `class` | `string` | `undefined` | Custom class list |

### Menu Events

| Event | Parameters | Description |
|---|---|---|
| `select` | `(index: string) => void` | Emitted when a menu item is clicked and selected |

---

### MenuItem Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `index` | `string` | Required | Unique key identifying the menu item |
| `disabled` | `boolean` | `false` | Disable item interaction |
| `route` | `string \| object` | `undefined` | Target route path or object |
| `class` | `string` | `undefined` | Custom class list |

---

### SubMenu Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `index` | `string` | Required | Unique key identifying the sub-menu |
| `title` | `string` | `''` | Title label (prioritized below `title` slot) |
| `disabled` | `boolean` | `false` | Disable entire sub-menu interaction |
| `class` | `string` | `undefined` | Custom wrapper class list |
| `triggerClass` | `string` | `undefined` | Custom header trigger class list |

### SubMenu Slots

| Slot Name | Description |
|---|---|
| `default` | Nested submenu items (e.g. `MenuItem` or nested `SubMenu`) |
| `title` | Custom header title trigger elements |
