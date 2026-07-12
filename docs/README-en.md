<div align="center">
  <img src="apps/docs/public/favicon.svg" alt="Brutx Logo" width="120" height="120" />

  # BrutxUI

  **A copy-paste Neo-Brutalist component registry for Vue 3 + Tailwind CSS.**

  Use it when you want visible borders, strong shadows, accessible primitives, and component code you can edit directly.

  English · [中文](README.md)

  ### Component Registry (`brutx-ui-vue`)
  [![npm version](https://img.shields.io/npm/v/brutx-ui-vue.svg?style=flat-square&color=FF6B6B)](https://www.npmjs.com/package/brutx-ui-vue)
  [![npm downloads](https://img.shields.io/npm/dm/brutx-ui-vue.svg?style=flat-square&color=4ECDC4)](https://www.npmjs.com/package/brutx-ui-vue)

  ### CLI Tool (`brutx-vue`)
  [![npm version](https://img.shields.io/npm/v/brutx-vue.svg?style=flat-square&color=FFE66D)](https://www.npmjs.com/package/brutx-vue)
  [![npm downloads](https://img.shields.io/npm/dm/brutx-vue.svg?style=flat-square&color=4ECDC4)](https://www.npmjs.com/package/brutx-vue)

  ### Project Health
  [![License: MIT](https://img.shields.io/badge/License-MIT-4ECDC4.svg?style=flat-square)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-FFE66D.svg?style=flat-square)](https://www.typescriptlang.org/)
  [![Vue 3](https://img.shields.io/badge/Vue_3-3.5+-4FC08D.svg?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
  [![Vite](https://img.shields.io/badge/Vite-8+-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-22.5+-339933.svg?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![pnpm](https://img.shields.io/badge/pnpm-11+-F69220.svg?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)


  <br />

  [Docs & Preview](https://lidaixingchen.github.io/brutxui-vue3/) · [NPM Components](https://www.npmjs.com/package/brutx-ui-vue) · [NPM CLI](https://www.npmjs.com/package/brutx-vue) · [Report Issues](https://github.com/lidaixingchen/brutxui-vue3/issues)
</div>

---

## What is BrutxUI?

BrutxUI is a Neo-Brutalist design registry for SaaS apps, indie tools, dashboards, developer portfolios, landing pages, and product interfaces that need more visual punch.

Unlike a single npm dependency that hides implementation details, **BrutxUI is copy-paste first**. It follows the workflow popularized by `shadcn/ui`: components are generated into your project, built on **reka-ui** accessible primitives and **Tailwind CSS**, so you own the code and can modify it freely.

---

## When to Use BrutxUI

- **Great for:** SaaS products, analytics dashboards, developer tools, landing pages, Web3 portals, and creative portfolios that can carry a bold interface style.
- **Use with caution:** Conservative enterprise dashboards, patient-facing medical records, traditional banking apps. When the default style is too loud, the **Pastel** and **Monochrome** presets can soften the contrast.

---

## Relationship with `shadcn/ui`

BrutxUI is designed to work alongside `shadcn/ui`, not replace it:
* **Shared workflow:** BrutxUI uses the same `components.json` layout pattern.
* **Coexistence:** You can use `shadcn/ui` components for quiet UI surfaces and BrutxUI components for buttons, headers, pricing sections, or other high-contrast areas in the same project.
* **Tailwind styles:** Generated files merge into standard Tailwind CSS layers.

---

## Installation & Registry Workflow

There are two common ways to install BrutxUI components:

### Option A: Brutx-Vue CLI (Recommended)

The Brutx-Vue CLI handles Tailwind detection, CSS token injection, and package manager detection.

```bash
# Initialize BrutxUI config in your project
npx brutx-vue@latest init

# Add specific components
npx brutx-vue@latest add button card badge

# Install all components at once
npx brutx-vue@latest add --all

# Upgrade installed components (use --overwrite to overwrite local files)
npx brutx-vue@latest add --all --overwrite
```

> **Upgrade Tip:** Always use `npx brutx-vue@latest` to ensure you're running the latest CLI version. When upgrading components, adding `--overwrite` will overwrite local modifications — make sure to back up or use version control beforehand.

### Option B: Official `shadcn` CLI

Since BrutxUI follows the shadcn/ui JSON registry pattern, you can use the official shadcn CLI to install BrutxUI components:

```bash
# Install Brutx Button
npx shadcn@latest add https://lidaixingchen.github.io/brutxui-vue3/registry/button.json

# Install Brutx Pricing Section block
npx shadcn@latest add https://lidaixingchen.github.io/brutxui-vue3/registry/pricing-section.json
```

---

## Sizing System & Theme Presets

BrutxUI exposes CSS custom properties in your stylesheet. You can globally soften or intensify the brutalist style:

```css
:root {
  --brutal-border-width: 3px;     /* Layout border thickness */
  --brutal-radius: 0px;           /* Sharp corners */
  --brutal-shadow-offset: 4px;    /* Regular card/button offset */
}
```

Four built-in visual presets:
1. **Classic Brutalist (`.theme-classic`):** Deep black shadows, neon accents, sharp corners.
2. **Pastel Neo-Brutal (`.theme-pastel`):** Soft colors, lighter contrast, `8px` border radius.
3. **Monochrome (`.theme-mono`):** Grayscale colors and thicker black lines for minimal interfaces.
4. **Warm Brutalist (`.theme-warm`):** Warm earthy tones and brown hard shadows for comfort and raw personality.

If you want to tune a theme visually first, open the [Theme Playground](https://lidaixingchen.github.io/brutxui-vue3/guide/theme-playground). It provides a product preview, component matrix, contrast checks, token coverage, and generated `.theme-custom` CSS.

---

## Internationalization

BrutxUI ships with Chinese (`zh-CN`, default) and English (`en`) language packs, supporting runtime switching, partial overrides, and custom translations without a `vue-i18n` dependency:

```ts
import { BrutxUIPlugin, en } from 'brutx-ui-vue'

app.use(BrutxUIPlugin, { locale: en })
```

---

## Supported Components & Blocks

BrutxUI includes components and layout blocks needed for common product UIs:

### Layout Blocks & Templates

#### Landing Page / Marketing

`BrutalistHero`, `PricingSection`

`PricingSection` is the unified pricing implementation for lifetime and subscription pricing.

#### Dashboard

`DashboardShell`, `DataTable`

#### Pages

`AuthCard`

#### Navigation

`HeaderSection`, `FooterSection`

#### Cards / Components

`Result`, `Upload`

#### Interactive

`FeedbackForm`, `CookieConsent`, `Stepper`

### Atomic Components

#### Form

`Button`, `Input`, `NumberInput`, `HardcoreInput`, `Textarea`, `Checkbox`, `Switch`, `RadioGroup`, `Select`, `Combobox`, `Slider`, `Toggle`, `ToggleGroup`, `TagsInput`, `Calendar`, `Form`

#### Layout & Container

`Card`, `Separator`, `ScrollArea`, `Sheet`, `Tabs`, `Accordion`, `Breadcrumb`, `Stepper`, `Timeline`, `Carousel`, `TreeView`

#### Data Display

`Table`, `Badge`, `Avatar`, `Progress`, `Pagination`, `Counter`, `Kbd`, `CodeBlock`, `Marquee`, `BeforeAfter`, `ChatBubble`, `Skeleton`, `Spinner`

#### Feedback & Overlay

`Dialog`, `AlertDialog`, `Alert`, `Toast`, `Popover`, `Tooltip`, `DropdownMenu`, `Command`

#### Neo-Brutalist Specials

`Card3D`, `GlitchText`, `ScratchCard`, `SketchyChart`, `CopyToClipboard`, `KanbanBoard`

#### Blocks / Pages

`PricingSection`, `DashboardShell`, `BrutalistHero`, `AuthCard`, `HeaderSection`, `FooterSection`, `Upload`, `DataTable`, `Stepper`, `Result`, `CookieConsent`, `Tabs`, `FeedbackForm`

---

## Claude Code Skill

BrutxUI provides a Claude Code Skill that enables AI assistants to generate component code following BrutxUI design specifications.

### Installation

Copy the `skills/brutxui/` directory to your global Claude Code configuration directory:

```bash
# Windows
xcopy /E /I skills\brutxui %USERPROFILE%\.claude\skills\brutxui

# macOS / Linux
cp -r skills/brutxui ~/.claude/skills/brutxui
```

### Usage

Once installed, simply describe your needs in Claude Code:

- "Create a login form with BrutxUI"
- "Help me build a Neo-Brutalist pricing page"
- "How do I use BrutxUI's Button component?"

Claude will automatically reference component documentation, style specifications, and code templates to generate code that follows BrutxUI design conventions.

---

## Contributing & Development

For detailed local development setup, running tests, registry compilation, and contribution guidelines, please refer to the [Contribution Guide (CONTRIBUTING.md)](../CONTRIBUTING.md).

---


## Acknowledgements / Credits

This project is developed and maintained based on the original neo-brutalist project [BrutxUI (dev-snake/brutxui)](https://github.com/dev-snake/brutxui) by [dev-snake](https://github.com/dev-snake). Special thanks for the outstanding design and creativity.

---

## License

BrutxUI is open-source software licensed under the [MIT License](LICENSE).
