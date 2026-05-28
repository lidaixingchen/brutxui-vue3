<div align="center">
  <img src="apps/docs/public/favicon.svg" alt="Brutx Logo" width="120" height="120" />
  
  # BrutxUI
  
  **A copy-paste Neo-Brutalist component registry for React and Tailwind CSS.**
  
  Use it when you want visible borders, strong shadows, accessible primitives, and component code you can edit directly.
  
  ### Component Registry (`brutx-ui`)
  [![npm version](https://img.shields.io/npm/v/brutx-ui.svg?style=flat-square&color=FF6B6B)](https://www.npmjs.com/package/brutx-ui)
  [![npm downloads](https://img.shields.io/npm/dm/brutx-ui.svg?style=flat-square&color=4ECDC4)](https://www.npmjs.com/package/brutx-ui)
  
  ### CLI Tool (`brutx`)
  [![npm version](https://img.shields.io/npm/v/brutx.svg?style=flat-square&color=FFE66D)](https://www.npmjs.com/package/brutx)
  [![npm downloads](https://img.shields.io/npm/dm/brutx.svg?style=flat-square&color=4ECDC4)](https://www.npmjs.com/package/brutx)

  ### Project Health & Sponsors
  [![License: MIT](https://img.shields.io/badge/License-MIT-4ECDC4.svg?style=flat-square)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-FFE66D.svg?style=flat-square)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19+-61DAFB.svg?style=flat-square)](https://reactjs.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-15+-000000.svg?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![Sponsor](https://img.shields.io/badge/Sponsor-FF6B6B?style=flat-square&logo=github&logoColor=white)](https://github.com/sponsors/dev-snake)

  <br />

  [Documentation & Previews](https://brutxui.site) · [NPM Library](https://www.npmjs.com/package/brutx-ui) · [NPM CLI](https://www.npmjs.com/package/brutx) · [Report Bug](https://github.com/dev-snake/brutxui/issues)
</div>

---

## What is BrutxUI?

BrutxUI is a Neo-Brutalist design registry for SaaS apps, indie tools, dashboards, developer portfolios, landing pages, and product interfaces that need a stronger visual tone.

Instead of shipping as a single npm dependency that hides the implementation, **BrutxUI is copy-paste-first**. It follows the workflow popularized by `shadcn/ui`: components are generated into your project, built on **Radix UI** primitives and **Tailwind CSS**, so you can own the code and change it freely.

---

## When to Use BrutxUI

- **Good fit:** SaaS products, analytics dashboards, developer utilities, landing pages, web3 portals, and creative portfolios that can support a bold interface style.
- **Use with care:** Conservative enterprise dashboards, patient-facing healthcare records, and traditional banking apps. The **Pastel** and **Monochrome** presets can soften the contrast when the default style feels too loud.

---

## Relationship with `shadcn/ui`

BrutxUI is meant to work alongside `shadcn/ui`, not replace it:
* **Shared workflow:** BrutxUI uses the same `components.json` layout schema.
* **Co-existence:** You can use `shadcn/ui` components for quieter UI surfaces and BrutxUI components for buttons, headers, pricing sections, or other high-contrast areas in the same project.
* **Tailwind styling:** The generated files merge into standard Tailwind CSS layers.

---

## Installation and Registry Workflows

There are two common ways to install BrutxUI components:

### Option A: Brutx CLI (Recommended)
The Brutx CLI handles Tailwind detection, CSS token injection, and package manager detection.

```bash
# Initialize BrutxUI configs in your project
npx brutx@latest init

# Add specific components
npx brutx@latest add button card badge

# Install all 29 components at once
npx brutx@latest add --all
```

### Option B: Official `shadcn` CLI
Because BrutxUI follows the shadcn/ui JSON registry schema, you can install BrutxUI components with the official shadcn CLI:

```bash
# Install Brutx Button
npx shadcn@latest add https://brutxui.site/registry/button.json

# Install Brutx SaaS Pricing Block
npx shadcn@latest add https://brutxui.site/registry/saas-pricing.json
```

---

## Sizing System and Theme Presets

BrutxUI exposes CSS custom properties in your stylesheet, so you can soften or strengthen the brutalist style globally:

```css
:root {
  --brutal-border-width: 3px;     /* Thickness of layouts */
  --brutal-radius: 0px;           /* Sharp rectangular corners */
  --brutal-shadow-offset: 4px;    /* Normal card/button offset */
}
```

There are three built-in visual presets:
1. **Classic Brutalism (`.theme-classic`):** Deep black shadows, neon accents, and sharp corners.
2. **Pastel Neo-Brut (`.theme-pastel`):** Softer colors, lighter contrast, and `8px` corners.
3. **Stark Monochrome (`.theme-mono`):** Grayscale colors and heavier black lines for minimal interfaces.

---

## Supported Components and Blocks

BrutxUI includes components and layout blocks for common product UI work:

### Layout Blocks and Templates
* **`saas-pricing`:** A responsive SaaS pricing section with monthly/yearly billing switches, checklist icons, highlighted plans, and CTA buttons. [Registry URL](https://brutxui.site/registry/saas-pricing.json)
* **`dashboard-stats`:** A responsive analytics panel for metrics such as revenue and conversion, with positive/negative trend badges. [Registry URL](https://brutxui.site/registry/dashboard-stats.json)

### Atomic Components
* **Forms:** `Button`, `SubmitButton` (Server Component safe), `Input`, `Textarea`, `Checkbox`, `Switch`, `Select`, `Label`
* **Overlays:** `Dialog` (Modal), `Popover`, `Tooltip`, `DropdownMenu`
* **Data & Lists:** `Table`, `Tabs`, `Command` (spotlight search), `Combobox` (multi-picker), `Pagination`, `ScrollArea`
* **Feedback:** `Alert`, `Badge`, `Toast` (notifiers), `Spinner` (loaders), `Skeleton`
* **Display:** `Avatar`, `Calendar`, `Separator`

---

## Contribution and Development

To run, test, and package BrutxUI locally:

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/dev-snake/brutxui.git
cd brutxui

# Install workspace dependencies
pnpm install

# Build UI modules and CLI binaries
pnpm --filter brutx-ui build && pnpm --filter brutx build
```

### 2. Run Test Suites
```bash
pnpm test
```

### 3. Recompile Component JSON Registry
If you make changes to core components in `packages/ui/src/components/*.tsx`, compile and validate the schemas:
```bash
# Compile TS to registry JSON files
pnpm --filter brutx-registry build

# Validate JSON files against shadcn CLI schema
pnpm --filter brutx-registry validate
```

---

## License

BrutxUI is open-source software licensed under the [MIT License](LICENSE).

<div align="center">
  <p>Built by dev-snake and contributors.</p>
</div>
