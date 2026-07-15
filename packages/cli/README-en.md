# brutx-vue

> CLI for adding Neo-Brutalist Vue 3 UI components to your project.
>
> [中文](/packages/cli/README.md)

## Installation

Running `brutx-vue` requires **Node.js 22.0+**. User projects can use npm, yarn, pnpm, or bun; see the root README for this repository's maintainer environment requirements.

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
8. Install base dependencies (`clsx`, `tailwind-merge`, `class-variance-authority`, `@lucide/vue`, `reka-ui`)

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

## Global Options

The following options apply to all commands and must precede the subcommand:

```bash
brutx-vue [global-options] <command> [command-options]
```

| Option | Description | Default |
| --- | --- | --- |
| `--verbose` | Show verbose error output (equivalent to `-v`) | `false` |
| `--dry-run` | Global dry-run: simulate all write operations without persisting | `false` |
| `--verbose-level <level>` | Verbose level (`1`=step, `2`=cache/network detail, `3`=stack) | `0` |
| `-v` | Equivalent to `--verbose-level 1` | — |
| `-vv` | Equivalent to `--verbose-level 2` | — |
| `-vvv` | Equivalent to `--verbose-level 3` | — |

### Global dry-run

The `--dry-run` global flag activates dry-run semantics for all commands. It can also be activated via the `BRUTX_DRY_RUN=1` environment variable:

```bash
# The following two are equivalent
BRUTX_DRY_RUN=1 brutx-vue add button
brutx-vue --dry-run add button
```

### Verbose levels

Control output verbosity via `-v`/`-vv`/`-vvv` or `BRUTX_VERBOSE=<n>`:

| Level | Label | Meaning |
| --- | --- | --- |
| `1` | `[STEP]` | Step-level |
| `2` | `[DETAIL]` | Cache/network detail |
| `3` | `[TRACE]` | Stack/debug detail |

## Audit Log

After `add`/`remove`/`update`/`diff` commands execute, a JSONL record is appended to `.brutx/audit.log`, including timestamp, command, components, source, and success status. `doctor` reads the most recent 5 failed records as diagnostic hints.

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

Licensed under the [MIT License](../../LICENSE).
