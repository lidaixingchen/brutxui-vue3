---
title: CLI
description: Learn how to use the brutx-vue command-line tool
translated: true
---

# CLI

The `brutx-vue` CLI helps you initialize BrutxUI in your project and add components with a single command.

## Overview

```bash
npx brutx-vue@latest <command>
```

The CLI automatically handles dependency installation, file creation, and configuration updates.

## brutx-vue init

Initialize BrutxUI in your project. It sets up the base configuration:

```bash
npx brutx-vue@latest init
```

The init command will:

1. Detect your project framework (Vite, Nuxt, etc.)
2. Install required dependencies (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@lucide/vue`)
3. Create the `cn()` utility function in `src/lib/utils.ts`
4. Inject `--brutal-*` CSS custom properties into your stylesheet
5. Add BrutxUI styles (including Tailwind utility class layers) to your CSS
6. Set up the component directory structure

Init also supports monorepo workspace detection. If a `pnpm-workspace.yaml`, `lerna.json`, or `turbo.json` file is found, the CLI will detect the workspace root and offer to install shared dependencies there while keeping component-specific dependencies in the current package. Use `--workspace-root` to explicitly specify the workspace root.

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--yes` / `-y` | Skip prompts and use defaults | `false` |
| `--defaults` / `-d` | Use default configuration | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--force` / `-f` | Force overwrite existing configuration | `false` |
| `--silent` / `-s` | Silent output | `false` |
| `--vscode` | Generate VS Code snippets | Auto-detected |
| `--workspace-root <path>` | Specify monorepo workspace root directory | Auto-detected |

## brutx-vue add

Add individual components to your project:

```bash
npx brutx-vue@latest add <component...>
```

### Examples

Add a single component:

```bash
npx brutx-vue@latest add button
```

Add multiple components:

```bash
npx brutx-vue@latest add button card dialog input
```

Add all available components:

```bash
npx brutx-vue@latest add --all
```

### Version Pinning

Use the `@` syntax to pin a component to a specific version. This maps to the corresponding GitHub tag in the registry:

```bash
npx brutx-vue@latest add button@1.2.0
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--all` | Add all available components | `false` |
| `--yes` / `-y` | Skip confirmation prompts | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--overwrite` | Overwrite existing component files | `false` |
| `--path <path>` / `-p` | Specify the path to add components to | — |
| `--silent` / `-s` | Silent output | `false` |
| `--dry-run` | Simulate adding without writing files | `false` |
| `--registry <registry>` / `-r` | Specify registry path or URL | — |
| `--no-cache` | Skip registry cache | `false` |
| `--vscode` | Update VS Code snippets with new components | `false` |

## brutx-vue doctor

Check project configuration health and diagnose common issues:

```bash
npx brutx-vue@latest doctor
```

The doctor command will check:

1. Whether `components.json` exists and is valid
2. Whether the `$schema` field is present
3. Whether the `$version` config version is up to date
4. Whether the `style` field is present
5. Tailwind CSS file contains BrutxUI design tokens
6. Whether configured alias paths point to real files/directories
7. Whether required dependencies are installed (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`)
8. Whether the `cn()` utility function exists
9. File integrity of installed components

### Examples

Basic diagnostics:

```bash
npx brutx-vue@latest doctor
```

Auto-fix fixable issues:

```bash
npx brutx-vue@latest doctor --fix --yes
```

Apply only a specific fix:

```bash
npx brutx-vue@latest doctor --fix-only add-schema
```

Output JSON format report:

```bash
npx brutx-vue@latest doctor --json
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--cwd <path>` | Set working directory | Current directory |
| `--fix` | Auto-fix fixable issues | `false` |
| `--fix-only <fixId>` | Apply only the specified fix | — |
| `--json` | Output JSON format report | `false` |
| `--yes` / `-y` | Skip confirmation prompts | `false` |
| `--silent` / `-s` | Silent output | `false` |

### Output Example

```text
Brutx-Vue Doctor

  [PASS] components.json exists — components.json found.
  [PASS] $schema field present — $schema field is present.
  [PASS] config version — Configuration version is 1.
  [PASS] style field present — style is "brutalism".
  [PASS] tailwind.css contains BrutxUI tokens — CSS file contains BrutxUI tokens.
  [PASS] aliases.components → @/components — Directory exists.
  [PASS] aliases.utils → @/lib/utils — File exists.
  [PASS] tailwindcss installed — ^4.3.0 installed.
  [PASS] reka-ui installed — ^2.9.9 installed.
  [PASS] cn() function exists — cn() function found.

  Summary: 10 passed, 0 warnings, 0 errors
```

### Auto-Fixable Issues

| Issue | Fix Action |
| --- | --- |
| Missing `$schema` | Write schema URL |
| Missing or outdated `$version` | Update to current version |
| Missing `style` | Set to `brutalism` |
| CSS missing BrutxUI tokens | Inject CSS styles |
| Component directory missing | Create directory |
| Utils file missing | Create utils file |
| `cn()` function missing | Add cn() function |

## brutx-vue diff

Compare locally installed components against the latest registry versions:

```bash
npx brutx-vue@latest diff [components...]
```

### Examples

Compare a single component:

```bash
npx brutx-vue@latest diff button
```

Compare multiple components:

```bash
npx brutx-vue@latest diff button card dialog
```

Compare all installed components:

```bash
npx brutx-vue@latest diff --all
```

Output JSON format:

```bash
npx brutx-vue@latest diff --all --json
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--all` | Compare all installed components | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--registry <path>` / `-r` | Specify local registry path | — |
| `--json` | Output JSON format | `false` |
| `--silent` / `-s` | Silent output | `false` |
| `--no-cache` | Skip registry cache | `false` |

### Output Example

Compare a single component:

```text
Component Diff: button

  Status: MODIFIED (1 file changed)

  src/components/ui/button/Button.vue
    --- registry/src/components/ui/button/Button.vue
    +++ local/src/components/ui/button/Button.vue
    -  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    +  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
    +  loading?: boolean;

  Summary: 1 file modified, 0 files unchanged
```

Compare all components:

```text
Component Diff Report

  MODIFIED (2)
    — button    (1 file changed)
    — card      (2 files changed)

  UP-TO-DATE (5)
    — badge
    — dialog
    — input
    — select
    — toast

  Summary: 2 modified, 5 up-to-date, 0 local-only
```

## brutx-vue update

Check for and apply component updates from the registry. Components with local modifications will be flagged before overwriting:

```bash
npx brutx-vue@latest update [components...]
```

### Examples

Update a specific component:

```bash
npx brutx-vue@latest update button
```

Update all outdated components without prompts:

```bash
npx brutx-vue@latest update --all --yes
```

Preview which components have updates available:

```bash
npx brutx-vue@latest update --dry-run
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--all` / `-a` | Update all outdated components | `false` |
| `--yes` / `-y` | Skip confirmation prompts | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--dry-run` | Show which components would be updated without writing | `false` |
| `--registry <registry>` / `-r` | Specify registry URL | — |
| `--no-cache` | Skip registry cache | `false` |
| `--silent` / `-s` | Silent output | `false` |

## brutx-vue list

List all installed components in your project, including file counts and dependencies:

```bash
npx brutx-vue@latest list
```

### Examples

List installed components:

```bash
npx brutx-vue@latest list
```

Output as JSON:

```bash
npx brutx-vue@latest list --json
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--cwd <path>` | Set working directory | Current directory |
| `--json` | Output JSON format | `false` |
| `--silent` / `-s` | Silent output | `false` |

### Output Example

```text
Installed Components

  Name        Files   Dependencies
  ──────────  ──────  ────────────────────────
  badge       2       reka-ui
  button      3       reka-ui, @lucide/vue
  card        2       none
  dialog      2       reka-ui, @lucide/vue

  4 component(s) installed
```

## brutx-vue info

Show detailed information about a component, including registry metadata, local files, dependencies, and installation status:

```bash
npx brutx-vue@latest info <component>
```

### Examples

Show info for a component:

```bash
npx brutx-vue@latest info button
```

Output as JSON:

```bash
npx brutx-vue@latest info button --json
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--cwd <path>` | Set working directory | Current directory |
| `--json` | Output JSON format | `false` |
| `--registry <registry>` / `-r` | Specify registry path or URL | — |
| `--silent` / `-s` | Silent output | `false` |

## brutx-vue remove

Remove installed components from your project. Also detects and cleans up orphaned files (composables, utilities, locales) that are no longer referenced by any remaining component:

```bash
npx brutx-vue@latest remove <components...>
```

### Examples

Remove a single component:

```bash
npx brutx-vue@latest remove button
```

Remove multiple components:

```bash
npx brutx-vue@latest remove button card dialog
```

Preview removal without deleting files:

```bash
npx brutx-vue@latest remove button --dry-run
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--yes` / `-y` | Skip confirmation prompts | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--dry-run` | Show which files would be removed without deleting | `false` |
| `--silent` / `-s` | Silent output | `false` |

## brutx-vue create

Scaffold a new Vue 3 project with BrutxUI pre-configured. Creates the project, installs dependencies, and runs `init` automatically:

```bash
npx brutx-vue@latest create <project-name>
```

### Examples

Create a project with the default Vite + Vue 3 + TypeScript template:

```bash
npx brutx-vue@latest create my-app
```

Create a Nuxt 3 project:

```bash
npx brutx-vue@latest create my-app --template nuxt
```

Create a project using npm as the package manager:

```bash
npx brutx-vue@latest create my-app --package-manager npm
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--template <template>` / `-t` | Project template (`default`, `nuxt`) | `default` |
| `--package-manager <pm>` | Package manager to use (`pnpm`, `npm`, `yarn`, `bun`) | `pnpm` |
| `--cwd <path>` | The directory to create the project in | Current directory |
| `--yes` / `-y` | Skip confirmation prompts | `false` |

## `components.json` Configuration File

The `components.json` file is created by `brutx-vue init` and stores your project configuration. All CLI commands read this file to locate components, utilities, and styles.

```json
{
    "$schema": "https://brutx-vue.dev/schema.json",
    "$version": 1,
    "style": "brutalism",
    "tailwind": {
        "config": "tailwind.config.js",
        "css": "src/assets/index.css"
    },
    "aliases": {
        "components": "@/components",
        "utils": "@/lib/utils",
        "composables": "@/composables"
    }
}
```

| Field | Description |
| --- | --- |
| `$schema` | JSON schema URL for IDE validation and autocompletion. |
| `$version` | Configuration format version. Used by `doctor` to detect outdated configs that may need migration. |
| `style` | The design style variant. Currently only `brutalism` is supported. |
| `tailwind.config` | Path to your Tailwind CSS config file. Empty string for Tailwind v4 (no config file needed). |
| `tailwind.css` | Path to your main CSS file where BrutxUI design tokens are injected. |
| `aliases.components` | Import alias for the components directory (e.g. `@/components`). |
| `aliases.utils` | Import alias for the utility file containing `cn()` (e.g. `@/lib/utils`). |
| `aliases.composables` | Import alias for the composables directory (e.g. `@/composables`). |

## Available Components

accordion, activity-log-page, alert, alert-dialog, auth-card, avatar, badge, before-after, blog-card, blog-list-page, breadcrumb, brutalist-hero, button, calendar, card, card-3d, carousel, chat-bubble, checkbox, code-block, combobox, command, cookie-consent, copy-to-clipboard, counter, dashboard-shell, dashboard-stats, data-table, dialog, dropdown-menu, empty-state, faq-section, feedback-form, file-card, footer-section, form, gallery-section, glitch-text, hardcore-input, header-section, input, kbd, kanban, loading, marquee, not-found-page, number-input, overview-page, pagination, popover, pricing-section, profile-page, progress, quick-actions, radio-group, result, scratch-card, scroll-area, search-widget, select, separator, settings-page, sheet, skeleton, sketchy-chart, slider, spinner, stepper, switch, table, tabs, tags-input, testimonial-card, textarea, timeline, toast, toggle, toggle-group, tooltip, tree-view, upload, waitlist-page
