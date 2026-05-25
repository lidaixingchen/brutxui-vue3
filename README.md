<div align="center">
  <img src="apps/docs/public/favicon.svg" alt="Brutalist UI Logo" width="120" height="120" />
  
  # Brutalist UI
  
  **A Neo-Brutalism styled React UI component library**
  
  Bold. Raw. Unapologetic.
  
  ### Component Library (`brutalist-ui`)
  [![npm version](https://img.shields.io/npm/v/brutalist-ui.svg?style=flat-square&color=FF6B6B)](https://www.npmjs.com/package/brutalist-ui)
  [![npm downloads](https://img.shields.io/npm/dm/brutalist-ui.svg?style=flat-square&color=4ECDC4)](https://www.npmjs.com/package/brutalist-ui)
  
  ### CLI Tool (`brutx`)
  [![npm version](https://img.shields.io/npm/v/brutx.svg?style=flat-square&color=FFE66D)](https://www.npmjs.com/package/brutx)
  [![npm downloads](https://img.shields.io/npm/dm/brutx.svg?style=flat-square&color=4ECDC4)](https://www.npmjs.com/package/brutx)

  ### Project Health & Sponsors
  [![License: MIT](https://img.shields.io/badge/License-MIT-4ECDC4.svg?style=flat-square)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-FFE66D.svg?style=flat-square)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat-square)](https://reactjs.org/)
  [![Sponsor](https://img.shields.io/badge/❤️_Sponsor-FF6B6B?style=flat-square&logo=github&logoColor=white)](https://github.com/sponsors/dev-snake)
  [![Buy Me A Coffee](https://img.shields.io/badge/☕_Buy_Me_A_Coffee-FFE66D?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/devsnake)

  <br />

  [Documentation](https://brutalistui.site) · [NPM Library](https://www.npmjs.com/package/brutalist-ui) · [NPM CLI](https://www.npmjs.com/package/brutx) · [Report Bug](https://github.com/dev-snake/brutalist-ui/issues)
</div>


---

Brutalist UI is a modern, neo-brutalist inspired React UI library. It implements bold 3px borders, thick black shadows, and high-contrast color palettes to give your application a raw, premium, and distinct character. 

Instead of bloated npm dependencies, Brutalist UI distributes components on-demand via a **dynamic registry system** (similar to shadcn/ui). You copy, paste, and customize the code directly in your workspace.

---

## ✨ Features

- 🎨 **Neo-Brutalism Design**: Thick 3px borders, high-contrast flat shadows, and vibrant accent colors.
- 🧱 **27 Production-Ready Components**: A fully realized component kit utilizing Radix UI primitives.
- 🌓 **Dark Mode Native**: Complete light & dark mode support with automatic dark border and shadow adjustments.
- ⚡ **Dynamic Registry-Based CLI**: Install components on-demand. Resolves and downloads dependency files recursively.
- 🚀 **Tailwind CSS v3 & v4 Native**: Native CSS utilities that integrate with JS configurations (v3) and CSS-first configurations (v4).
- 📱 **Fully Accessible & Responsive**: Compliant with WAI-ARIA standards and mobile-first responsive guidelines.
- 📦 **Multi-Package Manager Detection**: Detects and uses `npm`, `pnpm`, `yarn`, or `bun` automatically based on your project's lockfiles.

---

## 📦 Installation

Use the CLI `brutx` to initialize Brutalist UI and add components to your project:

```bash
# Initialize Brutalist UI configuration
npx brutx@latest init

# Add specific components
npx brutx@latest add button card badge

# Or add all 27 components at once
npx brutx@latest add --all
```

---

## 🚀 Quick Start

### 1. Initialize Project

Run the initialization wizard in your project root:

```bash
npx brutx@latest init
```

This will automatically:
- Detect your project type (`Next.js`, `Vite`, `Remix`, `Create React App`).
- Auto-detect the package manager (`npm`, `pnpm`, `yarn`, `bun`).
- Detect your Tailwind CSS version (`v3` or `v4`).
- Create a `components.json` configuration file.
- Generate utility helpers (e.g., `lib/utils.ts` with the class merger helper `cn`).
- Append custom neo-brutalist utility classes directly to your global CSS stylesheet.
- Install core base dependencies (`clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`).

### 2. Add Components

Add components individually or all at once:

```bash
# Add a single component (e.g., button)
npx brutx@latest add button

# Add multiple components
npx brutx@latest add button card dialog

# Force overwrite existing component files
npx brutx@latest add button --overwrite
```

### 3. Use in Your Project

Once installed, import and use the components inside your codebase:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function App() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">Brutalist UI App</h2>
        <Badge variant="success">Active</Badge>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Bold, raw, and beautiful design patterns.</p>
        <Button variant="primary" size="default">
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 🎨 Custom CSS Utility Classes

During initialization, Brutalist UI appends native CSS custom classes directly to your project's global stylesheet. This guarantees 100% compatibility with both Tailwind CSS v3 and v4:

```css
/* Brutalist UI Styles */
.border-3 {
    border-width: 3px;
}

.shadow-brutal {
    box-shadow: 4px 4px 0px 0px #000;
}

.shadow-brutal-sm {
    box-shadow: 2px 2px 0px 0px #000;
}

.shadow-brutal-lg {
    box-shadow: 6px 6px 0px 0px #000;
}

/* Dark mode overrides */
.dark .shadow-brutal {
    box-shadow: 4px 4px 0px 0px #fff;
}
.dark .shadow-brutal-sm {
    box-shadow: 2px 2px 0px 0px #fff;
}
.dark .shadow-brutal-lg {
    box-shadow: 6px 6px 0px 0px #fff;
}
```

If you import components directly from the compiled npm library (`brutalist-ui`), the following layer components are also available via `styles.css`:

- `.nb-border` - Apply a `3px` solid black border.
- `.nb-shadow` - Apply a `4px` black offset shadow.
- `.nb-press` - Apply a pressed interactive state effect.
- `.nb-font` - Apply a heavy `900` weight typography styling.

---

## 🧩 Supported Components (27 Core Components)

Brutalist UI contains **27 core components** grouped into 5 structural categories:

### 1. Layout & Containers
| Component | Description | Local Install |
| :--- | :--- | :--- |
| `Card` | Nested container panels with headers, footers, and content boxes | `npx brutx add card` |
| `Separator` | Stylized horizontal or vertical separating lines | `npx brutx add separator` |
| `ScrollArea` | Custom scrollbar component with neo-brutalist rails | `npx brutx add scroll-area` |

### 2. Forms & Inputs
| Component | Description | Local Install |
| :--- | :--- | :--- |
| `Button` | High-contrast actions with loading indicators, sizes, and variants | `npx brutx add button` |
| `SubmitButton`| Server component-ready form submission handler | `npx brutx add submit-button` |
| `Input` | Text input boxes with rigid brutalist outlines | `npx brutx add input` |
| `Textarea` | High-contrast multi-line text input fields | `npx brutx add textarea` |
| `Checkbox` | Toggle checkmarks with offset borders | `npx brutx add checkbox` |
| `Switch` | Custom toggle switch wrapper based on Radix Switch | `npx brutx add switch` |
| `Select` | Dropdown picker with brutalist panels | `npx brutx add select` |
| `Label` | Rigid, accessible input labeling | `npx brutx add label` |

### 3. Feedback & Status
| Component | Description | Local Install |
| :--- | :--- | :--- |
| `Alert` | Standard status notifications (info, success, warning, error) | `npx brutx add alert` |
| `Badge` | High-contrast status pill indicators | `npx brutx add badge` |
| `Toast` | Fully managed snackbar notifications | `npx brutx add toast` |
| `Spinner` | Neo-brutalist loading animations (pulse, bars, rotate) | `npx brutx add spinner` |
| `Skeleton` | Content loading layout placeholders | `npx brutx add skeleton` |

### 4. Overlays & Modals
| Component | Description | Local Install |
| :--- | :--- | :--- |
| `Dialog` | Highly polished modal dialog windows | `npx brutx add dialog` |
| `Popover` | Contextual floating widgets | `npx brutx add popover` |
| `Tooltip` | Hover informational helpers | `npx brutx add tooltip` |
| `DropdownMenu` | Floating action trigger list | `npx brutx add dropdown-menu` |

### 5. Navigation & Complex UI
| Component | Description | Local Install |
| :--- | :--- | :--- |
| `Tabs` | Tab-switched panel navigation | `npx brutx add tabs` |
| `Table` | High-contrast structured data grids | `npx brutx add table` |
| `Pagination` | Grid routing indicators | `npx brutx add pagination` |
| `Avatar` | User thumbnail indicators with text fallback | `npx brutx add avatar` |
| `Calendar` | Day-picker wrapper using `react-day-picker` | `npx brutx add calendar` |
| `Command` | CmdK-based spotlight search command hub | `npx brutx add command` |
| `Combobox` | Multiselect/autocomplete picker utilizing command hub | `npx brutx add combobox` |

---

## 🏗️ Project Monorepo Structure

```
brutalist-ui/
├── apps/
│   └── docs/                  # Next.js 15 documentation website
├── packages/
│   ├── ui/                    # Core NPM source library (brutalist-ui)
│   │   ├── src/
│   │   │   ├── components/    # Component sources
│   │   │   └── styles.css     # UI library base stylesheet
│   │   └── package.json
│   ├── cli/                   # Dynamic CLI application (brutx)
│   │   ├── src/               # Commands CLI (`init`, `add`)
│   │   └── package.json
│   └── registry/              # Dynamically served Component Registry
│       ├── registry/          # Packaged components under JSON schemas
│       └── scripts/           # Build script to generate registry schemas
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 🛠️ Development & Contributing Guide

To test CLI commands or components in a local environment:

### 1. Project Initialization & Setup
```bash
# Clone the repository
git clone https://github.com/dev-snake/brutalist-ui.git
cd brutalist-ui

# Install workspaces dependencies
pnpm install

# Build the UI library and CLI package
pnpm --filter brutalist-ui build && pnpm --filter brutx build
```

### 2. Testing Locally
Run component test suites across the monorepo:
```bash
pnpm test
```

### 3. Registry Compilation
To package your modifications in `packages/ui` into the CLI registry:
```bash
pnpm --filter brutalist-ui-registry build
```

---

## 💖 Support This Project

If you find Brutalist UI useful, please consider supporting its development:

<a href="https://github.com/sponsors/dev-snake">
  <img src="https://img.shields.io/badge/Sponsor_on_GitHub-❤️-EA4AAA?style=for-the-badge&logo=github" alt="Sponsor on GitHub" />
</a>
<a href="https://buymeacoffee.com/devsnake">
  <img src="https://img.shields.io/badge/Buy_Me_A_Coffee-☕-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
</a>
<a href="https://ko-fi.com/devsnake">
  <img src="https://img.shields.io/badge/Support_on_Ko--fi-❤️-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi" />
</a>

Your support helps keep this project alive and growing! 🚀

---

## 📄 License

Brutalist UI is open-source software licensed under the [MIT License](LICENSE).

---

<div align="center">
  <p>
    <strong>Made with 💛 and bold borders</strong>
  </p>
  <p>
    <a href="https://www.npmjs.com/package/brutalist-ui">NPM Library</a> •
    <a href="https://www.npmjs.com/package/brutx">NPM CLI</a> •
    <a href="https://github.com/dev-snake/brutalist-ui">GitHub</a> •
    <a href="https://brutalistui.site">Docs</a>
  </p>
</div>

