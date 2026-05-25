<div align="center">
  <img src="apps/docs/public/favicon.svg" alt="Brutx Logo" width="120" height="120" />
  
  # BrutxUI
  
  **The ultimate copy-paste Neo-Brutalist component registry for React & Tailwind CSS.**
  
  Bold. Raw. Accessible. Compatible.
  
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
  [![Sponsor](https://img.shields.io/badge/❤️_Sponsor-FF6B6B?style=flat-square&logo=github&logoColor=white)](https://github.com/sponsors/dev-snake)

  <br />

  [Documentation & Previews](https://brutxui.site) · [NPM Library](https://www.npmjs.com/package/brutx-ui) · [NPM CLI](https://www.npmjs.com/package/brutx) · [Report Bug](https://github.com/dev-snake/brutxui/issues)
</div>

---

## ⚡ What is BrutxUI?

BrutxUI is a high-fidelity Neo-Brutalist design registry for bold SaaS apps, indie tools, dashboards, developer portfolios, landing pages, and playful product interfaces.

Rather than being distributed as a monolithic npm dependency that locks down your style choices, **BrutxUI is a copy-paste-first system** (pioneered by `shadcn/ui`). It generates raw, accessible components built on **Radix UI** primitives and **Tailwind CSS** directly into your codebase for 100% style ownership.

---

## 🎯 Honest Positioning: When to use BrutxUI

- **🚀 Perfect For:** Bold SaaS products, analytics dashboards, developer utilities, landing pages, web3 portals, and creative portfolios seeking high-engagement designs.
- **⚠️ Think Twice For:** Highly conservative enterprise dashboards, patient-facing healthcare records, or traditional corporate banking apps—unless you utilize our built-in **Pastel** or **Monochrome** theme presets to soften outlines and contrast.

---

## 🤝 Relationship with `shadcn/ui`

BrutxUI is **not** designed to replace or attack `shadcn/ui`. Instead, it acts as a **direct companion**:
* **Shared Workflow:** We use the exact same `components.json` layout schema.
* **Co-existence:** You can run original `shadcn/ui` for traditional panels alongside `BrutxUI` components for high-impact buttons, headers, or pricing cards in the exact same directory.
* **Unified Styling:** Merges seamlessly into standard Tailwind CSS layers.

---

## 📦 Installation & Registry CLI Workflows

BrutxUI gives you two flexible ways to install and maintain components:

### Option A: Via Native `brutx` CLI (Recommended)
Our dedicated CLI automatically handles tailwind detection, CSS token injection, and package managers.

```bash
# Initialize BrutxUI configs in your project
npx brutx@latest init

# Add specific components
npx brutx@latest add button card badge

# Install all 29 components at once
npx brutx@latest add --all
```

### Option B: Via Official `shadcn` CLI (Compatibility Workflow)
Because BrutxUI complies strictly with the shadcn/ui JSON registry schemas, you can install any BrutxUI component directly using the official shadcn CLI:

```bash
# Install Brutx Button
npx shadcn@latest add https://brutxui.site/registry/button.json

# Install Brutx SaaS Pricing Block
npx shadcn@latest add https://brutxui.site/registry/saas-pricing.json
```

---

## 🎨 Sizing Sytem & Theme Presets

BrutxUI is parameterizable. It exposes standard CSS Custom Properties in your stylesheet, allowing you to soften or strengthen the brutalist look globally in a single line:

```css
:root {
  --brutal-border-width: 3px;     /* Thickness of layouts */
  --brutal-radius: 0px;           /* Sharp rectangular corners */
  --brutal-shadow-offset: 4px;    /* Normal card/button offset */
}
```

We ship with 3 built-in visual presets:
1. **Classic Brutalism (`.theme-classic`):** Deep black shadows, neon accents, and razor-sharp unrounded corners.
2. **Pastel Neo-Brut (`.theme-pastel`):** Lavenders, peaches, sage greens, and slightly rounded `8px` corners.
3. **Stark Monochrome (`.theme-mono`):** Grayscale-only colors and heavy `4px` black lines for high-end minimalist interfaces.

---

## 🧩 Supported Core Components & Blocks (29 Items)

BrutxUI offers 29 premium components and layout blocks:

### 🚀 Layout Blocks & Templates (New!)
* **`saas-pricing`:** A responsive SaaS Pricing page section featuring monthly/yearly billing switches, checklist icons, highlighted grids, and CTA triggers. [Registry URL](https://brutxui.site/registry/saas-pricing.json)
* **`dashboard-stats`:** A responsive analytics panel showing stats (revenue, conversion) with positive/negative trend badges. [Registry URL](https://brutxui.site/registry/dashboard-stats.json)

### 🧱 Atomic Components
* **Forms:** `Button`, `SubmitButton` (Server Component safe), `Input`, `Textarea`, `Checkbox`, `Switch`, `Select`, `Label`
* **Overlays:** `Dialog` (Modal), `Popover`, `Tooltip`, `DropdownMenu`
* **Data & Lists:** `Table`, `Tabs`, `Command` (spotlight search), `Combobox` (multi-picker), `Pagination`, `ScrollArea`
* **Feedback:** `Alert`, `Badge`, `Toast` (notifiers), `Spinner` (loaders), `Skeleton`
* **Display:** `Avatar`, `Calendar`, `Separator`

---

## 💻 Contribution & Development

We highly welcome contributors! To run, test, and package BrutxUI locally:

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

### 3. Re-compile Component JSON Registry
If you make changes to core components in `packages/ui/src/components/*.tsx`, compile and validate the schemas:
```bash
# Compile TS to registry JSON files
pnpm --filter brutx-registry build

# Validate JSON files against shadcn CLI schema
pnpm --filter brutx-registry validate
```

---

## 📄 License

BrutxUI is open-source software licensed under the [MIT License](LICENSE).

<div align="center">
  <p>Made with 💛 and bold borders by dev-snake and friends.</p>
</div>
