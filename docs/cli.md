# Brutx CLI Reference

The Brutx CLI (`brutx`) is an on-demand tool for project initialization, styles configuration, and component installation.

---

## Usage

Execute commands via `npx`:

```bash
npx brutx@latest [command] [options]
```

---

## Commands

### 1. `init`

Initialize Brutx configuration and style system in your local project.

```bash
npx brutx@latest init [options]
```

#### What it does
- Detects project structure (Next.js, Vite, Create React App, Remix, etc.) and package managers (npm, pnpm, yarn, bun).
- Creates `components.json` in the root folder.
- Generates the utility file `lib/utils.ts` containing the standard class merger helper (`cn`).
- Creates a `components/ui/` directory.
- Appends Neo-Brutalist styles and utility classes (such as `.shadow-brutal`, `.border-3`) to your globals CSS.
- Installs base dependencies (`clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`).

#### Options
- `-y, --yes`: Skip all confirmation prompts and use detected configurations.
- `-d, --defaults`: Initialize with default tailwind settings.
- `-f, --force`: Force overwrite existing configuration file.
- `-c, --cwd <cwd>`: Override target working directory (default is `process.cwd()`).
- `-s, --silent`: Suppress all outputs and spinner logging.

---

### 2. `add`

Add components and all of their dependencies to your project.

```bash
npx brutx@latest add [components...] [options]
```

#### What it does
- Resolves and downloads all sub-components (`registryDependencies`) recursively.
- Replaces import paths matching registry defaults with your workspace custom aliases (e.g. `@/lib/utils` is replaced with `~/utils/cn`).
- Writes component files and recursively ensures target folders are created safely.
- Detects and installs required npm dependencies.

#### Options
- `-y, --yes`: Skip confirmation picker if no components arguments are passed.
- `-a, --all`: Add every available Brutx component.
- `-o, --overwrite`: Overwrite existing local components files if they exist.
- `-p, --path <path>`: Override the path to install components to.
- `-c, --cwd <cwd>`: Override working directory.
- `-s, --silent`: Mute all logs.
- `--dry-run`: Simulate files generation and dependency installation without writing files to disk (useful for dry runs and testing configurations).
- `-r, --registry <registry>`: Specify a custom registry URL or local file-based path for offline setups and testing.

---

## Configuration File (`components.json`)

The CLI reads and writes project settings inside `components.json`:

```json
{
  "$schema": "https://brutxui.site/schema.json",
  "style": "brutalism",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Fields
- **`style`**: Design style token (default is `"brutalism"`).
- **`tailwind.config`**: Path to the Tailwind configuration file.
- **`tailwind.css`**: Path to the global CSS file of your project.
- **`aliases.components`**: Import alias pointing to the components directory.
- **`aliases.utils`**: Import alias pointing to the utilities directory.
