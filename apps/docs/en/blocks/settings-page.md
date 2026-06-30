---
title: Settings Page
description: Settings page section with tab navigation and form controls.
translated: true
---

# Settings Page

A neo-brutalist settings page featuring tab navigation, form controls (Input and Switch), and a save button.

## Demo

<ComponentPreview>
  <SettingsPageDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="settings-page" />

## Usage

```vue
<script setup>
import SettingsPage from '@/components/ui/settings-page/SettingsPage.vue'
import type { SettingsTab } from '@/components/ui/settings-page/SettingsPage.vue'

const tabs: SettingsTab[] = [
    { label: 'General', value: 'general' },
    { label: 'Notifications', value: 'notifications' },
    { label: 'Security', value: 'security' },
]

function handleSave(payload) {
    console.log('Save:', payload)
    // payload: { tab: string; values: Record<string, unknown> }
}
</script>

<template>
    <SettingsPage
        title="Settings"
        :tabs="tabs"
        default-tab="general"
        @save="handleSave"
    />
</template>
```

### Custom Tab Content

```vue
<script setup>
import SettingsPage from '@/components/ui/settings-page/SettingsPage.vue'

const tabs = [
    { label: 'Profile', value: 'profile' },
    { label: 'Account', value: 'account' },
]
</script>

<template>
    <SettingsPage
        title="My Settings"
        :tabs="tabs"
        @save="handleSave"
    >
        <template #tab-profile="{ values, setValue }">
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <label class="font-bold text-sm">Display Name</label>
                    <input
                        class="h-10 max-w-xs border-3 border-brutal bg-brutal-bg px-3"
                        :value="values.displayName ?? ''"
                        @input="setValue('displayName', $event.target.value)"
                    />
                </div>
            </div>
        </template>
    </SettingsPage>
</template>
```

## Data Types

```ts
interface SettingsTab {
    label: string
    value: string
}
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `settingsPage.defaultTitle` | Page title |
| `tabs` | `SettingsTab[]` | `[]` | Tab configuration list |
| `modelValue` | `string` | — | Currently active tab (v-model) |
| `defaultTab` | `string` | — | Default active tab |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
|------|------|------|
| `save` | `{ tab: string; values: Record<string, unknown> }` | Triggered when the save button is clicked, includes current tab and form values |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `header` | — | Replace/extend the section header |
| `default` | — | Replace the section body content (including tabs and save button) |
| `footer` | — | Replace/extend the section footer |
| `tab-{value}` | `{ values: Record<string, unknown>; setValue: (key: string, val: unknown) => void }` | Custom tab content, provides form values and setter function |

## Accessibility

- **Keyboard**: Supports `Tab` to navigate between tabs and form controls, `Enter` / `Space` to switch tabs
- **ARIA attributes**: Tabs use `role="tablist"` and `role="tab"`, content area uses `role="tabpanel"`
- **Focus management**: Focus stays on the tab trigger when switching tabs
