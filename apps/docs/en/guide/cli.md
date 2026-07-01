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

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--yes` / `-y` | Skip prompts and use defaults | `false` |
| `--defaults` / `-d` | Use default configuration | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--force` / `-f` | Force overwrite existing configuration | `false` |
| `--silent` / `-s` | Silent output | `false` |

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

## brutx-vue doctor

Check project configuration health and diagnose common issues:

```bash
npx brutx-vue@latest doctor
```

The doctor command will check:

1. Whether `components.json` exists and is valid
2. Whether configured paths point to real files
3. Tailwind CSS version compatibility
4. Whether required dependencies are installed (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`)
5. Whether the `cn()` utility function exists
6. Whether CSS files contain BrutxUI design tokens
7. File integrity of installed components

### Examples

Basic diagnostics:

```bash
npx brutx-vue@latest doctor
```

Auto-fix fixable issues:

```bash
npx brutx-vue@latest doctor --fix --yes
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
| `--json` | Output JSON format report | `false` |
| `--yes` / `-y` | Skip confirmation prompts | `false` |
| `--silent` / `-s` | Silent output | `false` |

### Output Example

```text
Brutx-Vue Doctor

  [PASS] components.json exists — components.json found.
  [PASS] $schema field present — $schema field is present.
  [PASS] style field present — style is "brutalism".
  [PASS] tailwind.css contains BrutxUI tokens — CSS file contains BrutxUI tokens.
  [PASS] aliases.components → @/components — Directory exists.
  [PASS] aliases.utils → @/lib/utils — File exists.
  [PASS] tailwindcss installed — ^4.3.0 installed.
  [PASS] reka-ui installed — ^2.9.9 installed.
  [PASS] cn() function exists — cn() function found.

  Summary: 9 passed, 0 warnings, 0 errors
```

### Auto-Fixable Issues

| Issue | Fix Action |
| --- | --- |
| Missing `$schema` | Write schema URL |
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

### Available Components

accordion, activity-log-page, alert, alert-dialog, auth-card, avatar, badge, before-after, blog-card, blog-list-page, breadcrumb, brutalist-hero, button, calendar, card, card-3d, carousel, chat-bubble, checkbox, code-block, combobox, command, cookie-consent, copy-to-clipboard, counter, dashboard-shell, dashboard-stats, data-table-section, dialog, dropdown-menu, empty-state, error-card, faq-section, feedback-form, file-card, footer-section, form, gallery-section, glitch-text, hardcore-input, header-section, input, kbd, kanban, loading-page, marquee, not-found-page, number-input, overview-page, pagination, popover, pricing-section, profile-page, progress, quick-actions, radio-group, scratch-card, scroll-area, search-widget, select, separator, settings-page, sheet, skeleton, sketchy-chart, slider, spinner, stepper, stepper-section, submit-button, success-card, switch, table, tabs, tags-input, testimonial-card, textarea, timeline, toast, toggle, toggle-group, tooltip, tree-view, upload-card, waitlist-page
