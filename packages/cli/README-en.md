# brutx-vue

> CLI for adding Neo-Brutalist Vue 3 UI components to your project.
>
> [中文](./README.md)

## Installation

```bash
# Using pnpm
pnpm add -D brutx-vue

# Using npm
npm install -D brutx-vue

# Using yarn
yarn add -D brutx-vue

# Using bun
bun add -D brutx-vue
```

Or run directly without installing:

```bash
npx brutx-vue@latest init
```

## Commands

### `brutx-vue init`

Initialize BrutxUI in your project. This command will:

1. Detect your project type (Vite + Vue, Nuxt, etc.)
2. Detect Tailwind CSS version (v3 / v4)
3. Auto-discover Tailwind config, CSS entry, and path aliases from `tsconfig.json`
4. Interactively guide you through configuration
5. Generate `components.json` config file
6. Create the `cn()` utility function (`clsx` + `tailwind-merge`)
7. Inject Neo-Brutalist CSS design tokens and utility classes into your global CSS
8. Install base dependencies (`clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-vue-next`, `reka-ui`)

```bash
brutx-vue init [options]
```

| Option              | Description                |
| ------------------- | -------------------------- |
| `-y, --yes`         | Skip confirmation prompts  |
| `-d, --defaults`    | Use default configuration  |
| `-c, --cwd <cwd>`   | Specify working directory  |
| `-f, --force`       | Overwrite existing config  |
| `-s, --silent`      | Suppress output            |

### `brutx-vue add [components...]`

Add components to your project. This command will:

1. Verify the project has been initialized (`components.json` exists)
2. Resolve component dependencies recursively (topological order)
3. Write component source files with import alias replacement
4. Install required npm dependencies

```bash
# Add specific components
brutx-vue add button card input

# Add all components
brutx-vue add --all

# Interactive selection
brutx-vue add
```

| Option                        | Description                  |
| ----------------------------- | ---------------------------- |
| `-y, --yes`                   | Skip confirmation prompts    |
| `-a, --all`                   | Add all available components |
| `-o, --overwrite`             | Overwrite existing files     |
| `-p, --path <path>`           | Custom component install path |
| `-c, --cwd <cwd>`             | Specify working directory    |
| `-s, --silent`                | Suppress output              |
| `--dry-run`                   | Simulate without writing files |
| `-r, --registry <registry>`   | Custom registry path or URL  |

#### Version Locking

Pin a component to a specific version using the `@` syntax:

```bash
brutx-vue add button@1.2.0
```

This maps to the corresponding GitHub branch in the registry.

## Configuration

After running `init`, a `components.json` file is generated in your project root:

```json
{
  "$schema": "https://brutx-vue.com/schema.json",
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/assets/main.css"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## Project Detection

The CLI automatically detects:

| Signal                                                       | Result                |
| ------------------------------------------------------------ | --------------------- |
| `nuxt.config.*`                                              | Nuxt                  |
| `vite.config.*` + `vue`                                      | Vite + Vue (`src/`)   |
| Other Vue projects                                           | Vite + Vue            |
| Lockfile (`pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, `package-lock.json`) | Package manager       |

## Security

- All file operations are validated with `isSafePath()` to prevent path traversal attacks
- Registry local reads are checked against the working directory boundary
- Component file paths are normalized and verified before writing

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Run CLI locally
pnpm start
```

## License

MIT
