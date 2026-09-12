---
title: CLI
description: Learn how to use the brutx-vue command-line tool, workflows, and configuration specifications
translated: true
---

# CLI

`brutx-vue` is the official BrutxUI command-line tool, designed to help you quickly scaffold new projects, initialize configurations, manage component lifecycles, and run enterprise-grade diagnostics and self-healing.

## Overview

You can run the CLI without local installation via package managers:

```bash
npx brutx-vue@latest <command>
```

Alternatively, install it locally as a development dependency:

```bash
pnpm add -D brutx-vue
# or
npm install -D brutx-vue
```

---

## Project Setup

### brutx-vue create

Scaffold a brand-new Vue 3 project pre-configured with BrutxUI from scratch:

```bash
npx brutx-vue@latest create <project-name>
```

The create command downloads the template, sets up the directory layout, installs required dependencies, and executes `init` automatically.

#### Examples

Create a default Vite + Vue 3 + TypeScript project:

```bash
npx brutx-vue@latest create my-app
```

Use the Nuxt template and specify bun as the package manager:

```bash
npx brutx-vue@latest create my-nuxt-app --template nuxt --package-manager bun
```

#### Options

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-t, --template <template>` | Project template (`default`, `nuxt`) | `default` |
| `--package-manager <pm>` | Package manager (`pnpm`, `npm`, `yarn`, `bun`) | `pnpm` |
| `-c, --cwd <path>` | Target working directory | Current directory |
| `-y, --yes` | Skip confirmation prompts and use defaults | `false` |

---

### brutx-vue init

Initialize BrutxUI configuration in an existing Vue 3 project:

```bash
npx brutx-vue@latest init
```

The init command executes the following setup steps automatically:

1. Detects project framework (Vite + Vue, Nuxt, etc.) and Tailwind CSS version (v4 / v3)
2. Discovers global CSS entry files and `tsconfig.json` path aliases
3. Installs core dependencies (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@lucide/vue`)
4. Generates the `cn()` utility function in `src/lib/utils.ts`
5. Injects Neo-Brutalist design tokens and utility markers into your stylesheet
6. Creates the `components.json` configuration file and components directory
7. Detects Monorepo workspaces (pnpm / lerna / turbo) with support for root-level shared dependencies

#### Options

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-y, --yes` | Skip confirmation prompts and use detected defaults | `false` |
| `-d, --defaults` | Use official default configuration | `false` |
| `-c, --cwd <path>` | Set working directory | Current directory |
| `-f, --force` | Force overwrite existing `components.json` and styles | `false` |
| `-s, --silent` | Silent output | `false` |
| `--vscode` | Generate VS Code intelligent snippets | `false` |
| `--workspace-root <path>` | Explicitly specify monorepo workspace root directory | Auto-detected |

---

## Component Lifecycle Management

### brutx-vue add

Add components to your project. The command recursively resolves and downloads all dependencies (subcomponents, composables, and locales) in topological order:

```bash
npx brutx-vue@latest add [components...]
```

If no component names are provided, the CLI launches an interactive checklist.

#### Examples

Add single or multiple components:

```bash
# Add a single component
npx brutx-vue@latest add button

# Add multiple components
npx brutx-vue@latest add button card dialog input
```

Add all available components:

```bash
npx brutx-vue@latest add --all
```

#### Options

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-a, --all` | Add all available components from the registry | `false` |
| `-y, --yes` | Skip confirmation prompts | `false` |
| `-o, --overwrite` | Overwrite existing component files | `false` |
| `-m, --merge` | When component already exists, merge with 3-way merge | `false` |
| `-p, --path <path>` | Custom directory path to install component files into | Alias resolved path |
| `-c, --cwd <path>` | Set working directory | Current directory |
| `-s, --silent` | Silent output | `false` |
| `--dry-run` | Simulate installation plan without writing files to disk | `false` |
| `-r, --registry <url>` | Override registry path or URL | Official source |
| `--no-cache` | Skip local registry cache, forcing remote fetch | `false` |
| `--offline` | Offline mode: read only local cache, disable network requests | `false` |
| `--vscode` | Update VS Code snippets library | `false` |
| `--filter <package>` | **Monorepo**: Target workspace package in a monorepo | — |
| `--shared` | **Monorepo**: Target the shared UI package in a monorepo | `false` |

#### Version Pinning with `@version` Syntax

Pin components to specific releases using the `@` syntax:

```bash
npx brutx-vue@latest add button@1.2.0
```

- **Custom Registries**: `@version` works with GitHub raw URL registries (e.g., `https://raw.githubusercontent.com/{owner}/{repo}/{ref}/...`). The CLI dynamically replaces `{ref}` with the requested version.
- **Default Source Behavior**: The official default source uses GitHub Release assets, which always fetch the latest stable release.
- **Version Mismatch Warning**: If an already-installed component's version differs from the requested version, the CLI emits a non-blocking warning.

---

### brutx-vue list

List all installed components in your project along with file counts and runtime dependencies:

```bash
npx brutx-vue@latest list
```

#### Check for Updates

Pass `--check-updates` to verify component integrity against the remote registry and flag outdated components:

```bash
npx brutx-vue@latest list --check-updates
```

#### Options

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-c, --cwd <path>` | Set working directory | Current directory |
| `--check-updates` | Check remote registry integrity to display available updates | `false` |
| `--json` | Output structured JSON format | `false` |
| `-r, --registry <url>` | Specify registry path or URL for update checks | Configured source |
| `--no-cache` | Skip cache when checking updates | `false` |
| `--offline` | Use only cached data for checking updates | `false` |
| `-s, --silent` | Silent output | `false` |

---

### brutx-vue info

Inspect metadata for a specific component (dependency tree, files, category, examples, and local installation status):

```bash
npx brutx-vue@latest info <component>
```

#### Options

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-c, --cwd <path>` | Set working directory | Current directory |
| `--json` | Output component details in JSON format | `false` |
| `-r, --registry <url>` | Specify registry path or URL | Configured source |
| `--offline` | Offline mode (reads from cache) | `false` |
| `-s, --silent` | Silent output | `false` |

---

### brutx-vue diff

Compare local component implementations against the latest registry version:

```bash
npx brutx-vue@latest diff [components...]
```

#### Examples

Compare one or multiple components:

```bash
npx brutx-vue@latest diff button
npx brutx-vue@latest diff button card dialog
```

Compare all installed components:

```bash
npx brutx-vue@latest diff --all
```

#### Options

| Flag | Description | Default |
| :--- | :--- | :--- |
| `--all` | Compare all installed components | `false` |
| `-c, --cwd <path>` | Set working directory | Current directory |
| `-r, --registry <url>` | Target registry path or URL | Configured source |
| `--json` | Output JSON report with complete file patches | `false` |
| `--no-cache` | Skip cache and pull latest remote files | `false` |
| `--offline` | Compare using cached data only | `false` |
| `-s, --silent` | Silent output | `false` |

---

### brutx-vue update

Update installed components to the latest registry version using 3-way merge to preserve your local custom edits:

```bash
npx brutx-vue@latest update [components...]
```

#### Examples

Update specific components:

```bash
npx brutx-vue@latest update button card
```

Update all outdated components:

```bash
npx brutx-vue@latest update --all
```

Simulate updates without writing to disk:

```bash
npx brutx-vue@latest update --dry-run
```

#### Conflict Strategy Options

When local modifications collide with incoming updates, control merge behavior with conflict strategy flags:

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-a, --all` | Update all outdated installed components | `false` |
| `-y, --yes` | Skip confirmation prompts | `false` |
| `-c, --cwd <path>` | Set working directory | Current directory |
| `--dry-run` | Simulate update without writing to disk | `false` |
| `--across-versions` | Allow updating version-pinned components across their locked version | `false` |
| `--ours` | **Conflict Strategy**: Accept all local changes in conflicts | `false` |
| `--theirs` | **Conflict Strategy**: Accept all remote changes in conflicts | `false` |
| `-f, --force` | **Overwrite Mode**: Force full overwrite, ignoring local changes | `false` |
| `--ci` | **CI Gate**: Run in CI mode, exit with code 1 on unresolved conflicts | `false` |
| `-r, --registry <url>` | Specify registry URL | Configured source |
| `--no-cache` | Skip cache and download latest assets | `false` |
| `--offline` | Use only cached data | `false` |
| `-s, --silent` | Silent output | `false` |

---

### brutx-vue remove

Safely remove components and automatically detect orphan dependencies:

```bash
npx brutx-vue@latest remove <components...>
```

The remove command deletes component directories, checks reverse dependencies, detects orphan composables or locales that are no longer referenced, and prompts for cleanup.

#### Options

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-y, --yes` | Skip confirmation prompts | `false` |
| `-c, --cwd <path>` | Set working directory | Current directory |
| `--dry-run` | Show which files would be removed without deleting | `false` |
| `-s, --silent` | Silent output | `false` |

---

## Maintenance & Diagnostics

### brutx-vue doctor

Comprehensive project health check and automated self-healing engine. Audits configuration integrity, Tailwind tokens, directory structures, dependencies, and code tampering:

```bash
npx brutx-vue@latest doctor [options]
```

#### Diagnostic Categories
- **env**: Runtime environment and package manager detection
- **config**: `components.json` schema, version, and alias validity
- **tailwind**: Tailwind CSS version and `--brutal-*` token injection status
- **structure**: Component directory layout and `cn()` utility integrity
- **integrity**: Component content hashes, file integrity, and audit log health
- **custom**: User-defined or third-party diagnostic rule plugins

#### Diagnostic and CI Gate Options

| Flag | Description | Default |
| :--- | :--- | :--- |
| `--fix` | Automatically fix fixable diagnostic issues | `false` |
| `--fix-only <fixId>` | Apply only the specified fix (see Fix ID table below) | — |
| `--dry-run` | Combined with `--fix`: Preview repair plan (Plan Preview + Unified Diff) without disk writes | `false` |
| `--ci` | CI mode: Defaults to `github` reporter when running in CI | `false` |
| `--reporter <type>` | Reporter format (`pretty`, `github`, `json`, `sarif`, `junit`) | `pretty` |
| `--fail-on <level>` | Exit with code 1 on specified issue level (`error`, `warn`, `drift`) | `error` |
| `--output-file <path>` | Write diagnostic report to specified file path (e.g. SARIF / JUnit) | — |
| `--category <category>` | Filter checks by category (`env`, `config`, `tailwind`, `structure`, `integrity`) | All |
| `--rule <ruleId>` | Run specific diagnostic rule by ID | All |
| `--json` | Output JSON report (equivalent to `--reporter json`) | `false` |
| `--offline` | Skip remote registry network reachability probes | `false` |
| `--sbom` | Generate CycloneDX 1.5 SBOM for installed components and exit (see [Security Guide](/en/guide/security)) | `false` |
| `--sbom-output <path>` | Output path for generated SBOM file | `./brutx-sbom.json` |
| `-c, --cwd <path>` | Set working directory | Current directory |
| `-y, --yes` | Skip confirmation prompts for fixes | `false` |
| `-s, --silent` | Silent output | `false` |

#### Fix ID Reference Table

Pass these IDs to `--fix-only <fixId>`:

| Fix ID | Scenario | Self-Healing Action |
| :--- | :--- | :--- |
| `add-schema` | Missing `$schema` in `components.json` | Writes official Schema validation URL |
| `add-config-version` | Missing or outdated `$version` in configuration | Updates to current configuration version |
| `set-style` | Missing `style` field | Sets style to `brutalism` |
| `inject-css-tokens` | Global CSS missing BrutxUI token marker block | Injects design token block into stylesheet |
| `create-components-dir` | Components directory does not exist | Creates components target directory |
| `create-utils-file` | `src/lib/utils.ts` missing | Generates utility file with `cn()` |
| `add-cn-function` | Missing `cn()` export in utils file | Appends `cn()` export to utils file |
| `restore-integrity` | Installed component corrupted or modified | Restores baseline code from registry |
| `remove-orphans` | Orphaned shared files with zero references | Safely removes unused orphan files |

#### Dry-Run Repair Plan Preview (`--fix --dry-run`)
Preview planned changes and unified file diffs before applying repairs:

```bash
npx brutx-vue@latest doctor --fix --dry-run
```

---

### brutx-vue cache

Manage local component and registry metadata caches:

```bash
npx brutx-vue@latest cache clear [--max-age <days>]
```

#### Examples

Clear all local caches:

```bash
npx brutx-vue@latest cache clear
```

Keep active cache entries from the last 7 days and clear older entries:

```bash
npx brutx-vue@latest cache clear --max-age 7
```

---

### brutx-vue registry

Manage registry sources in `components.json` (`registries` array) with automated fallback redundancy:

#### List resolved sources and reachability

```bash
npx brutx-vue@latest registry list
```

#### Add a registry source

```bash
npx brutx-vue@latest registry add https://mirror.example.com/registry
```

#### Remove a registry source (reverts to official default if all custom sources removed)

```bash
npx brutx-vue@latest registry remove https://mirror.example.com/registry
```

---

## Configuration File: `components.json`

Running `init` generates `components.json` in your project root:

```json
{
  "$schema": "https://lidaixingchen.github.io/brutxui-vue3/schema.json",
  "$version": 1,
  "style": "brutalism",
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "tokensFile": "src/styles/tokens.css"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "composables": "@/composables",
    "locales": "@/locales",
    "directives": "@/directives"
  },
  "workspace": {
    "mode": "standalone",
    "targetPackage": "ui",
    "sharedUtilsPackage": "shared",
    "installDependenciesTo": "targetPackage"
  },
  "registries": [
    "https://github.com/lidaixingchen/brutxui-vue3/releases/latest/download"
  ],
  "requireSignature": false,
  "rules": {
    "tailwind.tokens": "error",
    "integrity.drift": "warn"
  },
  "plugins": []
}
```

### Configuration Field Reference

| Field | Type | Description |
| :--- | :--- | :--- |
| `$schema` | `string` | JSON Schema URL for IDE validation and autocompletion |
| `$version` | `number` | Configuration version number (migrated automatically by CLI) |
| `style` | `string` | Theme style, currently locked to `brutalism` |
| `tailwind.config` | `string` | Tailwind configuration file path (empty string for Tailwind v4) |
| `tailwind.css` | `string` | Global CSS entry file path |
| `tailwind.tokensFile` | `string` | *(Optional)* Independent design tokens file path |
| `aliases.components` | `string` | Component import alias (default: `@/components`) |
| `aliases.utils` | `string` | Utility functions import alias (default: `@/lib/utils`) |
| `aliases.composables`| `string` | Composables import alias (default: `@/composables`) |
| `aliases.locales` | `string` | *(Optional)* Locales dictionary import alias |
| `aliases.directives` | `string` | *(Optional)* Vue custom directives import alias |
| `workspace` | `object` | *(Optional)* Monorepo workspace configuration |
| `workspace.mode` | `string` | Workspace mode: `standalone` / `shared-package` / `app-local` / `hybrid` |
| `workspace.installDependenciesTo` | `string` | Dependency installation target: `targetPackage` / `caller` / `both` |
| `registries` | `string[]` | *(Optional)* Multi-registry list with ordered fallback |
| `requireSignature` | `boolean` | *(Optional)* Enforce strict Ed25519 signature verification |
| `trustedPublicKeys` | `array` | *(Optional)* Project-level trusted Ed25519 SPKI public keys |
| `rules` | `object` | *(Optional)* Diagnostic rule severity overrides (`"off"` / `"warn"` / `"error"`) |
| `plugins` | `string[]` | *(Optional)* Custom diagnostic rule plugins (relative path or npm package) |

---

## Global Options & Environment Variables

### Global Flags
Global options must be placed before subcommands:

```bash
npx brutx-vue@latest [global-options] <command> [command-options]
```

- `--dry-run`: Global dry-run mode simulating write operations without disk mutation
- `--require-signature`: Strict signature verification mode, failing immediately on invalid signatures
- `--verbose-level <1|2|3>`: Verbose level (`1`=steps, `2`=details/network, `3`=trace/stacks)
- `-v` / `-vv` / `-vvv`: Equivalent to `--verbose-level 1 / 2 / 3`
- `--verbose`: Show full error stacks (equivalent to `-v`)

### Environment Variable Matrix

Configure global CLI behaviors via environment variables in CI, Docker, or scripts:

| Variable | Allowed Values | CLI Flag | Description |
| :--- | :--- | :--- | :--- |
| `BRUTX_OFFLINE` | `1` | `--offline` | Enable offline mode, reading only local cache |
| `BRUTX_NO_CACHE` | `1` | `--no-cache` | Skip local cache, always fetching from registry |
| `BRUTX_DRY_RUN` | `1` | `--dry-run` | Activate global dry-run simulation |
| `BRUTX_VERBOSE` | `1` / `2` / `3` | `-v` / `-vv` / `-vvv` | Set logging verbosity level |
| `BRUTX_REQUIRE_SIGNATURE`| `1` | `--require-signature` | Enforce strict signature verification gate |
| `BRUTX_REGISTRY_PUBLIC_KEYS` | JSON string | — | Inject additional trusted Ed25519 public keys |
| `BRUTX_CACHE_DIR` | Directory string | — | Custom directory for local registry cache (default: `.brutx/cache`) |
| `BRUTX_CACHE_MAX` | Positive integer | — | Maximum number of cached items before LRU eviction (default: `200`) |
| `BRUTX_CACHE_MAX_BYTES` | Integer bytes | — | Maximum total byte size for the cache directory |

---

## CI/CD Pipeline Integration

Integrate `brutx-vue doctor` into GitHub Actions or GitLab CI as a quality and compliance gate.

### GitHub Actions Workflow Example

Create `.github/workflows/brutx-check.yml`:

```yaml
name: BrutxUI Integrity & Quality Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  diagnose:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install pnpm
        uses: pnpm/action-setup@v4

      - name: Run Brutx Doctor Gate
        run: |
          # Fails PR if configuration errors, missing dependencies, or component code drift occur
          npx brutx-vue@latest doctor --ci --fail-on drift --reporter github

      - name: Generate Security SBOM
        if: always()
        run: |
          npx brutx-vue@latest doctor --sbom --sbom-output ./brutx-sbom.json

      - name: Upload SBOM Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: brutx-sbom
          path: ./brutx-sbom.json
```

---

## Supply Chain Security & Compliance Overview

BrutxUI source distribution includes built-in anti-tampering and compliance verification:

- **Canonical Integrity Recomputation**: Automatically recalculates SHA-256 hashes against manifest contents, guarding against CDN tampering and MITM attacks;
- **Ed25519 Digital Signatures**: Verifies releases against the official root public key out-of-the-box; supports smooth multi-key rotation for private enterprise registries;
- **CycloneDX 1.5 SBOM**: Generate comprehensive software bills of materials via `doctor --sbom`, fully compatible with Dependency-Track, Snyk, and Trivy;
- **Local Audit Logs**: Operations are recorded automatically in `.brutx/audit.log`.

> [!TIP]
> **Explore Comprehensive Supply Chain Security**  
> For cryptographic signature details, enterprise private key management, CycloneDX 1.5 specifications, and security audits, read our dedicated **[Supply Chain Security & Compliance Guide](/en/guide/security)**.

---

## Error Codes & Troubleshooting Reference

When an operation fails, the CLI provides standardized error codes with actionable guidance:

| Error Code | Root Cause | Recommended Action |
| :--- | :--- | :--- |
| `CONFIG_NOT_FOUND` | Missing `components.json` file | Run `brutx-vue init` in your project root |
| `CONFIG_INVALID` | Malformed or invalid `components.json` | Run `brutx-vue doctor --fix` to repair configuration |
| `COMPONENT_NOT_FOUND` | Component name not found in registry | Check spelling or run `brutx-vue list` to see available items |
| `REGISTRY_FETCH_FAILED` | Cannot reach remote registry | Verify network connectivity or specify mirror with `--registry` |
| `REGISTRY_OFFLINE_UNAVAILABLE` | Component is missing from cache in offline mode | Run online once to warm up cache or disable `--offline` |
| `REGISTRY_SIGNATURE_INVALID` | Manifest signature failed trusted key validation | Possible tampering or mismatched key; verify `BRUTX_REGISTRY_PUBLIC_KEYS` |
| `REGISTRY_INTEGRITY_FAILED` | Manifest canonical hash check mismatch | Refetch with `--no-cache` or rebuild custom registry |
| `REGISTRY_VERSION_UNSUPPORTED`| `@version` used with non-raw registry URL | Remove `@version` or point `--registry` to a GitHub raw URL |
| `PATH_UNSAFE` | Target path contains directory traversal | Check path aliases in `components.json` to ensure paths stay inside project |
| `WRITE_FAILED` | File system write operation failed | Check target directory write permissions and ensure files are unlocked |
| `DOCTOR_FAILED` | Doctor check failed `--fail-on` criteria | Review terminal diagnostic output and run `doctor --fix` |
