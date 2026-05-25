# Contributing to Brutx

Thank you for your interest in contributing to Brutx! We are excited to build a bold, raw, and accessible Neo-Brutalism design system together.

---

## 🛠️ Development Setup

This project is a monorepo managed with **pnpm workspaces**.

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0

### 2. Quick Start
```bash
# Clone the repository
git clone https://github.com/dev-snake/brutxui.git
cd brutxui

# Install workspace dependencies
pnpm install

# Build all packages (UI, CLI, Registry, and Docs)
pnpm build
```

---

## 📦 Monorepo Packages

- `packages/ui`: The main React component package.
- `packages/cli`: The CLI tool (`brutx`) for project initialization and component installation.
- `packages/registry`: The component distribution registry containing compiled JSON schemas.
- `apps/docs`: The Next.js 14 based documentation site.

---

## 🧩 Adding or Modifying Components

We use a **registry-based architecture** similar to shadcn/ui. Components are distributed dynamically as JSON files.

To add a new component (e.g., `button`):

1. **Implement the component** under `packages/ui/src/components/`.
2. **Define component metadata** in `packages/cli/src/lib/constants.ts` (under the `COMPONENTS` object). Add any required npm `dependencies`.
3. **Write/update the component template** under `packages/cli/src/templates/` (if compiling legacy files) or add them directly.
4. **Compile the registry JSON**:
   Run the following script to automatically parse, resolve dependencies, and bundle the React code into registry JSON files:
   ```bash
   pnpm --filter brutx-registry build
   ```
5. Commit the generated JSON file under `packages/registry/registry/`.

---

## 💻 Testing the CLI locally

You can test the CLI locally against a test project:

1. Build the CLI package:
   ```bash
   pnpm --filter brutx build
   ```
2. Create a temporary folder outside the workspace or inside it (e.g., `temp-test-project`).
3. Run the compiled CLI from your test folder:
   ```bash
   # Initialize CLI
   node ../packages/cli/dist/index.js init --defaults

   # Add components using the local registry
   node ../packages/cli/dist/index.js add button combobox --registry ../packages/registry/registry
   ```

---

## 🧪 Testing and Linting

Before pushing your changes, please ensure all checks pass:

- **Changelog & Types**: `pnpm typecheck`
- **Linting**: `pnpm lint`
- **Unit/Integration Tests**: `pnpm test`
