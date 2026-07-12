# Brutx UI

A Neo-Brutalist styled Vue 3 component library with rich CLI tool support. Copy components into your codebase for full customization and control.

**[中文](/packages/ui/README.md)**

[![npm version](https://img.shields.io/npm/v/brutx-ui-vue.svg?style=flat-square&color=FF6B6B)](https://www.npmjs.com/package/brutx-ui-vue)
[![npm downloads](https://img.shields.io/npm/dm/brutx-ui-vue.svg?style=flat-square)](https://www.npmjs.com/package/brutx-ui-vue)
[![License: MIT](https://img.shields.io/badge/License-MIT-4ECDC4.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-FFE66D.svg?style=flat-square)](https://www.typescriptlang.org/)

## Features

- **CLI Tool**: Setup, add, update, remove, and debug components via `npx brutx-vue@latest`.
- **Full Control**: Components are copied directly to your directory. You own the code and can customize every line.
- **Neo-Brutalist Style**: Bold borders, offset hard shadows, neon accent colors, zero compromises.
- **Tailwind-ready Tokens**: Built on CSS custom properties. Out-of-the-box support for dark mode via `.dark`.
- **Modern Headless Primitives**: Powered by reka-ui headless primitives, CVA variants, and tailwind-merge `cn()`.
- **Internationalization**: Lightweight built-in `useLocale()` composable for runtime language switching.
- **4 Theme Presets**: Built-in presets for Classic, Pastel, Mono, and Warm themes.

## Quick Start

Initialize your project and add components using the CLI:

```bash
# Initialize your project config (generates components.json)
npx brutx-vue@latest init

# Add specific components
npx brutx-vue@latest add button card badge

# Or add all components at once
npx brutx-vue@latest add --all
```

## Usage

Once components are added to your project (default `@/components/ui`), import and use them:

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Welcome to Brutx</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <Input placeholder="Email" />
      <Button variant="primary">Get Started</Button>
      <Button variant="outline" size="sm">
        Learn More
      </Button>
    </CardContent>
  </Card>
</template>
```

## CLI Commands

`brutx-vue` CLI provides a suite of commands to help you manage your local components:

| Command | Options / Flags | Description |
| :--- | :--- | :--- |
| `init` | - | Initialize components config `components.json` in your project root |
| `add <components...>` | `--all`, `--overwrite`, `--yes` | Copy specified components (or all) to your project. Use `--overwrite` to replace existing ones |
| `remove <components...>` | `--dry-run`, `--yes` | Safely delete components and clean up unused locales or composables automatically |
| `list` | - | List all available components to install and the ones already installed |
| `info <component>` | - | View detailed component metadata including external dependencies and descriptions |
| `diff <component>` | - | Compare line-by-line differences between your local component and the latest registry version |
| `update` | `--dry-run`, `--all`, `--yes` | Automatically check and update installed components. Use `--dry-run` to preview first |
| `doctor` | `--fix`, `--yes` | Diagnose and automatically fix 8 types of issues including config, dependencies, and CSS tokens |
| `create <name>` | - | Scaffold new custom component or block files following the library structures |

## Claude Code Skill

BrutxUI provides a Claude Code Skill that allows AI assistants to generate compliant Neo-Brutalist component code based on the library structure.

### Installation

Copy the `skills/brutxui/` directory to your global Claude Code configuration directory:

```bash
# Windows
xcopy /E /I skills\brutxui %USERPROFILE%\.claude\skills\brutxui

# macOS / Linux
cp -r skills/brutxui ~/.claude/skills/brutxui
```

### Usage

Simply describe your layout requirements to Claude:
- "Create a login form with BrutxUI"
- "Help me build a Neo-Brutalist pricing page"

## Customization & Custom Tokens

- **Dark Mode**: Add or remove the `.dark` class on `html` or `body` element.
- **Custom Visual Properties**: Customize visual attributes by overriding CSS variables (e.g. `--brutal-border-width`, `--brutal-radius`, `--brutal-shadow-offset-x`).
- **Theme Presets**: `.theme-classic` (default) · `.theme-pastel` (soft) · `.theme-mono` (mono) · `.theme-warm` (warm).

## License

Licensed under the [MIT License](../../LICENSE).
