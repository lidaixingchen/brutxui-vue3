---
title: Getting Started
description: Learn how to get started with the BrutxUI component library
translated: true
---

# Getting Started

BrutxUI is a Neo-Brutalism component library built for Vue 3 + Tailwind CSS. It provides bold, accessible, and highly customizable UI components, supporting both **npm package distribution** and **CLI source delivery** models.

## Where BrutxUI Shines

- **Landing pages and marketing sites** — bold visual identity to stand out
- **SaaS dashboards** — a confident, clear UI builds user trust
- **Creative portfolios** — embrace raw, expressive design
- **Developer tools** — function-first aesthetics match the target audience
- **Startup teams** — ship fast with a distinctive look

## Where to Use with Restraint

- **Enterprise back-office apps** — users expect traditional UI patterns
- **Form-heavy workflows** — minimal visual noise helps completion
- **Data-intensive tables** — brutalist borders can feel heavy at scale
- **Accessibility-critical scenarios** — reduced motion and high-contrast modes are primary requirements

## Dual Distribution & Installation Models

BrutxUI provides two ways to adopt components based on your team's code ownership preferences and maintenance tradeoffs:

### 1. npm Package Model (`brutx-ui-vue`)
- **Use cases**: Standard application development, projects favoring centralized dependency upgrades via `package.json`, and teams seeking zero maintenance overhead for component source files.
- **Key benefits**: Out-of-the-box readiness, deterministic versions pinned by lockfile, and standard semver releases and bugfixes.

### 2. CLI Source Delivery Model (`brutx-vue`)
- **Use cases**: Projects requiring deep customization of component templates and internals, proprietary custom variants, elimination of external package lock-in, or direct LLM/AI agent collaboration on source files.
- **Key benefits**: Full source ownership inside your repository, zero lock-in without needing to fork upstream, and on-demand component addition.

## System Customizability

All visual properties are driven by CSS custom properties. You can override them at the `:root` level or per-component:

```css
:root {
    --brutal-border-width: 3px;
    --brutal-border-color: #000000;
    --brutal-shadow-offset-x: 4px;
    --brutal-shadow-offset-y: 4px;
    --brutal-shadow-color: #000000;
    --brutal-radius: 0px;
    --brutal-bg: #ffffff;
    --brutal-fg: #000000;
    --brutal-primary: #FF6B6B;
    --brutal-secondary: #4ECDC4;
    --brutal-accent: #FFE66D;
    --brutal-destructive: #EF476F;
    --brutal-success: #7FB069;
    --brutal-muted: #f3f4f6;
    --brutal-muted-foreground: #4B5563;
    --brutal-ring: #000000;
    --brutal-info: #4A90D9;
    --brutal-overlay: rgba(0, 0, 0, 0.5);
    --brutal-placeholder: #9CA3AF;
}
```

BrutxUI also provides a `useTheme` composable for switching themes and dark mode at runtime:

```vue
<script setup>
import { useTheme } from 'brutx-ui-vue'

const { theme, colorMode, setTheme, toggleColorMode, initTheme } = useTheme()

// Restore user preference at the app entry point
initTheme()
</script>
```

See the [Theme & Tokens](/en/guide/theme) guide for details. You can also open the [Theme Playground](/en/guide/theme-playground) first to generate a copyable `.theme-custom` CSS with live preview, contrast checks, and token coverage.

## Built-in Theme Presets

BrutxUI includes four theme presets, which you can apply by adding a class to the root element:

### Classic (Default)

The signature BrutxUI style — thick 3px borders, hard 4px shadows, zero radius, vibrant colors.

```html
<div class="theme-classic">
    <!-- Your app -->
</div>
```

### Pastel

A softer style — 2px borders, 3px shadows, 8px radius, muted pastel tones.

```html
<div class="theme-pastel">
    <!-- Your app -->
</div>
```

### Mono

Grayscale at its finest — 4px borders, 5px shadows, zero radius, black-and-white palette.

```html
<div class="theme-mono">
    <!-- Your app -->
</div>
```

### Warm

Raw yet warm visual experience — 3px borders, 4px shadows, 4px radius, warm brown tones.

```html
<div class="theme-warm">
    <!-- Your app -->
</div>
```

## AI-First Integration

BrutxUI is designed to work seamlessly with AI coding assistants:

- **AGENTS.md** — a unified AI configuration file at the project root, providing project-specific instructions for all AI tools
- **Structured Props** — TypeScript interfaces that AI can understand and generate

See the [AI Integration](/en/guide/ai) guide for details.

## Accessibility First

Every component is built on top of [reka-ui](https://reka-ui.com/) headless primitives, ensuring:

- Correct ARIA attributes and roles
- Keyboard navigation support
- Focus management and visible focus rings
- Screen reader compatibility
- Reduced motion support

## Next Steps

- [Install BrutxUI](/en/guide/installation-vite) in your Vite + Vue 3 project
- See [Manual Installation](/en/guide/installation-manual) for alternative setup
- [CLI Reference](/en/guide/cli) for the `brutx-vue` command-line tool
- [Theme & Tokens](/en/guide/theme) for deep customization
- [Theme Playground](/en/guide/theme-playground) for visual theme CSS variable debugging
- [Internationalization](/en/guide/locale) for multi-language support
- [Browse Components](/en/components/alert) to see available components
