---
title: CLI
description: Learn how to use the brutx-vue command-line tool
translated: true
---

# CLI

The `brutx-vue` CLI helps you initialize BrutxUI in your project and add components with a single command.

## Overview

```bash
npx brutx-vue@latest <command>
```

The CLI automatically handles dependency installation, file creation, and configuration updates.

## brutx-vue init

Initialize BrutxUI in your project. It sets up the base configuration:

```bash
npx brutx-vue@latest init
```

The init command will:

1. Detect your project framework (Vite, Nuxt, etc.)
2. Install required dependencies (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@lucide/vue`)
3. Create the `cn()` utility function in `src/lib/utils.ts`
4. Inject `--brutal-*` CSS custom properties into your stylesheet
5. Add BrutxUI styles (including Tailwind utility class layers) to your CSS
6. Set up the component directory structure

Init also supports monorepo workspace detection. If a `pnpm-workspace.yaml`, `lerna.json`, or `turbo.json` file is found, the CLI will detect the workspace root and offer to install shared dependencies there while keeping component-specific dependencies in the current package. Use `--workspace-root` to explicitly specify the workspace root.

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--yes` / `-y` | Skip prompts and use defaults | `false` |
| `--defaults` / `-d` | Use default configuration | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--force` / `-f` | Force overwrite existing configuration | `false` |
| `--silent` / `-s` | Silent output | `false` |
| `--vscode` | Generate VS Code snippets | Auto-detected |
| `--workspace-root <path>` | Specify monorepo workspace root directory | Auto-detected |

## brutx-vue add

Add individual components to your project:

```bash
npx brutx-vue@latest add <component...>
```

### Examples

Add a single component:

```bash
npx brutx-vue@latest add button
```

Add multiple components:

```bash
npx brutx-vue@latest add button card dialog input
```

Add all available components:

```bash
npx brutx-vue@latest add --all
```

### Version Pinning

Use the `@` syntax to pin a component to a specific version. The string after `@` is injected as a git ref (branch, tag, commit) into the registry source URL, so all component files are fetched from that ref:

```bash
npx brutx-vue@latest add button@1.2.0
```

#### Interaction with `--registry`

`@version` only works with GitHub raw URL registries (matching `https://raw.githubusercontent.com/{owner}/{repo}/{ref}/...`). The CLI replaces the `{ref}` segment of the current `--registry` URL with the `@version`, leaving the rest of the path intact. This means it composes cleanly with custom forks:

```bash
# Pull button from the v1.2.0 tag of your personal fork
npx brutx-vue@latest add button@1.2.0 \
  --registry https://raw.githubusercontent.com/<you>/<fork>/main/registry
```

**Version is ignored on the default source**: the default source is a GitHub Release asset (`https://github.com/lidaixingchen/brutxui-vue3/releases/latest/download`), which has no git ref concept, so an explicit `@version` is **ignored** and the latest release is always fetched. To pin a historical version, explicitly switch `--registry` to a GitHub raw URL source.

If `--registry` has some other non-raw structure (e.g. a local path or self-hosted HTTP registry), using `@version` throws a `REGISTRY_VERSION_UNSUPPORTED` error. Remove `@version` or switch `--registry` to a GitHub raw URL.

#### Version mismatch warning

When the installed component version differs from the requested version, the CLI prints a warning (non-blocking):

```text
⚠ Version mismatch: "button" is already installed at version 1.0.0, but you requested 1.2.0.
```

#### Version constraints in `update`

`update` **skips** version-pinned components by default (it should not silently change a ref the user explicitly locked). To update across versions, pass `--across-versions`:

```bash
# Skips button@1.0.0 by default
npx brutx-vue@latest update

# Explicitly update across the locked version
npx brutx-vue@latest update --across-versions
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--all` | Add all available components | `false` |
| `--yes` / `-y` | Skip confirmation prompts | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--overwrite` | Overwrite existing component files | `false` |
| `--path <path>` / `-p` | Specify the path to add components to | — |
| `--silent` / `-s` | Silent output | `false` |
| `--dry-run` | Simulate adding without writing files | `false` |
| `--registry <registry>` / `-r` | Specify registry path or URL | — |
| `--no-cache` | Skip registry cache | `false` |
| `--offline` | Use only cached data, never hit the network (same as `BRUTX_OFFLINE=1`) | `false` |
| `--vscode` | Update VS Code snippets with new components | `false` |

## brutx-vue doctor

Check project configuration health and diagnose common issues:

```bash
npx brutx-vue@latest doctor
```

The doctor command will check:

1. Whether `components.json` exists and is valid
2. Whether the `$schema` field is present
3. Whether the `$version` config version is up to date
4. Whether the `style` field is present
5. Tailwind CSS file contains BrutxUI design tokens
6. Whether configured alias paths point to real files/directories
7. Whether required dependencies are installed (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`)
8. Whether the `cn()` utility function exists
9. File integrity of installed components
10. Reachability of each registry source (skipped with `--offline`)
11. Registry cache entry count and total size (offline availability)

### Examples

Basic diagnostics:

```bash
npx brutx-vue@latest doctor
```

Auto-fix fixable issues:

```bash
npx brutx-vue@latest doctor --fix --yes
```

Apply only a specific fix:

```bash
npx brutx-vue@latest doctor --fix-only add-schema
```

Output JSON format report:

```bash
npx brutx-vue@latest doctor --json
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--cwd <path>` | Set working directory | Current directory |
| `--fix` | Auto-fix fixable issues | `false` |
| `--fix-only <fixId>` | Apply only the specified fix | — |
| `--json` | Output JSON format report | `false` |
| `--yes` / `-y` | Skip confirmation prompts | `false` |
| `--silent` / `-s` | Silent output | `false` |
| `--offline` | Skip registry reachability probes and cache stats | `false` |
| `--sbom` | Generate a CycloneDX 1.5 SBOM and exit (skips doctor checks) | `false` |
| `--sbom-output <path>` | SBOM output file path | `./brutx-sbom.json` |

### Output Example

```text
Brutx-Vue Doctor

  [PASS] components.json exists — components.json found.
  [PASS] $schema field present — $schema field is present.
  [PASS] config version — Configuration version is 1.
  [PASS] style field present — style is "brutalism".
  [PASS] tailwind.css contains BrutxUI tokens — CSS file contains BrutxUI tokens.
  [PASS] aliases.components → @/components — Directory exists.
  [PASS] aliases.utils → @/lib/utils — File exists.
  [PASS] tailwindcss installed — ^4.3.0 installed.
  [PASS] reka-ui installed — ^2.9.9 installed.
  [PASS] cn() function exists — cn() function found.

  Summary: 10 passed, 0 warnings, 0 errors
```

### Auto-Fixable Issues

| Issue | Fix Action |
| --- | --- |
| Missing `$schema` | Write schema URL |
| Missing or outdated `$version` | Update to current version |
| Missing `style` | Set to `brutalism` |
| CSS missing BrutxUI tokens | Inject CSS styles |
| Component directory missing | Create directory |
| Utils file missing | Create utils file |
| `cn()` function missing | Add cn() function |

## brutx-vue diff

Compare locally installed components against the latest registry versions:

```bash
npx brutx-vue@latest diff [components...]
```

### Examples

Compare a single component:

```bash
npx brutx-vue@latest diff button
```

Compare multiple components:

```bash
npx brutx-vue@latest diff button card dialog
```

Compare all installed components:

```bash
npx brutx-vue@latest diff --all
```

Output JSON format:

```bash
npx brutx-vue@latest diff --all --json
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--all` | Compare all installed components | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--registry <path>` / `-r` | Specify local registry path | — |
| `--json` | Output JSON format | `false` |
| `--silent` / `-s` | Silent output | `false` |
| `--no-cache` | Skip registry cache | `false` |
| `--offline` | Use only cached data, never hit the network | `false` |

### Output Example

Compare a single component:

```text
Component Diff: button

  Status: MODIFIED (1 file changed)

  src/components/ui/button/Button.vue
    --- registry/src/components/ui/button/Button.vue
    +++ local/src/components/ui/button/Button.vue
    -  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    +  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
    +  loading?: boolean;

  Summary: 1 file modified, 0 files unchanged
```

Compare all components:

```text
Component Diff Report

  MODIFIED (2)
    — button    (1 file changed)
    — card      (2 files changed)

  UP-TO-DATE (5)
    — badge
    — dialog
    — input
    — select
    — toast

  Summary: 2 modified, 5 up-to-date, 0 local-only
```

## brutx-vue update

Check for and apply component updates from the registry. Components with local modifications will be flagged before overwriting:

```bash
npx brutx-vue@latest update [components...]
```

### Examples

Update a specific component:

```bash
npx brutx-vue@latest update button
```

Update all outdated components without prompts:

```bash
npx brutx-vue@latest update --all --yes
```

Preview which components have updates available:

```bash
npx brutx-vue@latest update --dry-run
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--all` / `-a` | Update all outdated components | `false` |
| `--yes` / `-y` | Skip confirmation prompts | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--dry-run` | Show which components would be updated without writing | `false` |
| `--registry <registry>` / `-r` | Specify registry URL | — |
| `--no-cache` | Skip registry cache | `false` |
| `--offline` | Use only cached data, never hit the network | `false` |
| `--silent` / `-s` | Silent output | `false` |
| `--across-versions` | Allow updating version-pinned components across their locked version (see [Version Pinning](#version-pinning)) | `false` |

## brutx-vue list

List all installed components in your project, including file counts and dependencies:

```bash
npx brutx-vue@latest list
```

### Examples

List installed components:

```bash
npx brutx-vue@latest list
```

Output as JSON:

```bash
npx brutx-vue@latest list --json
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--cwd <path>` | Set working directory | Current directory |
| `--json` | Output JSON format | `false` |
| `--silent` / `-s` | Silent output | `false` |
| `--registry <path>` / `-r` | Specify registry path or URL (for update checks) | — |
| `--check-updates` | Check registry integrity to show available updates | `false` |
| `--no-cache` | Skip registry cache when checking updates | `false` |
| `--offline` | Use only cached data, never hit the network | `false` |

### Output Example

```text
Installed Components

  Name        Files   Dependencies
  ──────────  ──────  ────────────────────────
  badge       2       reka-ui
  button      3       reka-ui, @lucide/vue
  card        2       none
  dialog      2       reka-ui, @lucide/vue

  4 component(s) installed
```

## brutx-vue info

Show detailed information about a component, including registry metadata, local files, dependencies, and installation status:

```bash
npx brutx-vue@latest info <component>
```

### Examples

Show info for a component:

```bash
npx brutx-vue@latest info button
```

Output as JSON:

```bash
npx brutx-vue@latest info button --json
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--cwd <path>` | Set working directory | Current directory |
| `--json` | Output JSON format | `false` |
| `--registry <registry>` / `-r` | Specify registry path or URL | — |
| `--silent` / `-s` | Silent output | `false` |
| `--offline` | Use only cached data, never hit the network | `false` |

## brutx-vue remove

Remove installed components from your project. Also detects and cleans up orphaned files (composables, utilities, locales) that are no longer referenced by any remaining component:

```bash
npx brutx-vue@latest remove <components...>
```

### Examples

Remove a single component:

```bash
npx brutx-vue@latest remove button
```

Remove multiple components:

```bash
npx brutx-vue@latest remove button card dialog
```

Preview removal without deleting files:

```bash
npx brutx-vue@latest remove button --dry-run
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--yes` / `-y` | Skip confirmation prompts | `false` |
| `--cwd <path>` | Set working directory | Current directory |
| `--dry-run` | Show which files would be removed without deleting | `false` |
| `--silent` / `-s` | Silent output | `false` |

## brutx-vue create

Scaffold a new Vue 3 project with BrutxUI pre-configured. Creates the project, installs dependencies, and runs `init` automatically:

```bash
npx brutx-vue@latest create <project-name>
```

### Examples

Create a project with the default Vite + Vue 3 + TypeScript template:

```bash
npx brutx-vue@latest create my-app
```

Create a Nuxt 3 project:

```bash
npx brutx-vue@latest create my-app --template nuxt
```

Create a project using npm as the package manager:

```bash
npx brutx-vue@latest create my-app --package-manager npm
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--template <template>` / `-t` | Project template (`default`, `nuxt`) | `default` |
| `--package-manager <pm>` | Package manager to use (`pnpm`, `npm`, `yarn`, `bun`) | `pnpm` |
| `--cwd <path>` | The directory to create the project in | Current directory |
| `--yes` / `-y` | Skip confirmation prompts | `false` |

## brutx-vue registry

Manage the registry sources of your project (`registries` field in `components.json`). Sources are tried in order: when the primary source fails, the CLI automatically falls back to mirror sources for zero-config CDN redundancy.

### registry list

Print all resolved sources and their reachability:

```bash
npx brutx-vue@latest registry list
```

| Flag | Description | Default |
|------|-------------|---------|
| `--cwd <path>` | Set working directory | Current directory |
| `--json` | Output JSON format | `false` |
| `--offline` | Skip network probes, only report configured sources | `false` |

### registry add

Append a source to the `registries` list in `components.json` (deduplicated):

```bash
npx brutx-vue@latest registry add https://mirror.example.com
```

| Flag | Description | Default |
|------|-------------|---------|
| `--cwd <path>` | Set working directory | Current directory |

### registry remove

Remove a source from `components.json`. Removing the last custom source deletes the `registries` field and restores the official default source:

```bash
npx brutx-vue@latest registry remove https://mirror.example.com
```

| Flag | Description | Default |
|------|-------------|---------|
| `--cwd <path>` | Set working directory | Current directory |

## `components.json` Configuration File

The `components.json` file is created by `brutx-vue init` and stores your project configuration. All CLI commands read this file to locate components, utilities, and styles.

```json
{
    "$schema": "https://brutx-vue.dev/schema.json",
    "$version": 1,
    "style": "brutalism",
    "tailwind": {
        "config": "tailwind.config.js",
        "css": "src/assets/index.css"
    },
    "aliases": {
        "components": "@/components",
        "utils": "@/lib/utils",
        "composables": "@/composables"
    }
}
```

| Field | Description |
| --- | --- |
| `$schema` | JSON schema URL for IDE validation and autocompletion. |
| `$version` | Configuration format version. Used by `doctor` to detect outdated configs that may need migration. |
| `style` | The design style variant. Currently only `brutalism` is supported. |
| `tailwind.config` | Path to your Tailwind CSS config file. Empty string for Tailwind v4 (no config file needed). |
| `tailwind.css` | Path to your main CSS file where BrutxUI design tokens are injected. |
| `aliases.components` | Import alias for the components directory (e.g. `@/components`). |
| `aliases.utils` | Import alias for the utility file containing `cn()` (e.g. `@/lib/utils`). |
| `aliases.composables` | Import alias for the composables directory (e.g. `@/composables`). |
| `sharedBase` | Optional monorepo shared base directory. |
| `registries` | Multi-registry source list (primary + mirrors), tried in order; defaults to the official source (GitHub Release assets) when unset. |
| `requireSignature` | Project-level strict signature mode: when `true`, enforces manifest signature verification (lower priority than the `BRUTX_REQUIRE_SIGNATURE` env var and the `--require-signature` flag, see [Supply Chain Security](#supply-chain-security-signature-sbom)). |
| `trustedPublicKeys` | Project-level additional trusted public keys (`{ keyId, publicKey }` array), appended on top of the official root keys. |

### Optional fields example

All fields below are optional and silently compatible when absent:

```json
{
  "registries": [
    "https://raw.githubusercontent.com/<you>/<fork>/main/packages/registry/registry",
    "https://mirror.example.com/registry"
  ],
  "requireSignature": true,
  "trustedPublicKeys": [
    {
      "keyId": "my-org-v1",
      "publicKey": "<base64-SPKI-DER>",
      "note": "Internal mirror signing key"
    }
  ]
}
```

## Global Options

The following options apply to all commands and must be placed before the subcommand:

```bash
npx brutx-vue@latest [global-options] <command> [command-options]
```

| Flag | Description | Default |
|------|-------------|---------|
| `--verbose` | Show detailed error output (equivalent to `-v`) | `false` |
| `--dry-run` | Global dry-run: simulate all write operations without touching disk (stacks with command-level `--dry-run`) | `false` |
| `--require-signature` | Strict signature mode: fail when manifest signature is invalid (default is warn, see [Supply Chain Security](#supply-chain-security-signature-sbom)) | `false` |
| `--verbose-level <level>` | Verbose output level (`1`=steps, `2`=cache/network details, `3`=stack traces) | `0` |
| `-v` | Equivalent to `--verbose-level 1` | — |
| `-vv` | Equivalent to `--verbose-level 2` | — |
| `-vvv` | Equivalent to `--verbose-level 3` | — |

### Global dry-run

The `--dry-run` global flag activates dry-run semantics for all commands without needing to add `--dry-run` after each subcommand. Can also be activated via the `BRUTX_DRY_RUN=1` environment variable:

```bash
# These two are equivalent
BRUTX_DRY_RUN=1 npx brutx-vue@latest add button
npx brutx-vue@latest --dry-run add button
```

When activated, `add`/`update`/`remove` only print paths that would be written; no files are modified.

### Verbose levels

Control output verbosity via `-v`/`-vv`/`-vvv` or the `BRUTX_VERBOSE=<n>` environment variable:

| Level | Label | Meaning |
| --- | --- | --- |
| `1` | `[STEP]` | Step-level, e.g. "resolving dependencies" |
| `2` | `[DETAIL]` | Cache/network details, e.g. "cache hit button@v1" |
| `3` | `[TRACE]` | Stack/debug details |

## Audit Log

After `add`/`remove`/`update`/`diff` commands execute, a JSONL record is appended to `.brutx/audit.log` containing:

- `timestamp`: ISO timestamp
- `command`: command type (`add`/`remove`/`update`/`diff`)
- `components`: list of components operated on
- `registrySource`: registry source
- `success`: whether the operation succeeded
- `dryRun`: whether it was a dry-run
- `error`: error message on failure

`doctor` reads the last 5 failure records from the audit log as diagnostic clues:

```bash
npx brutx-vue@latest doctor
```

Example output:

```text
⚠ audit log health — 1 recent failure(s) in audit log: update(button).
  Latest: update failed at 2026-07-16T02:30:00Z — Network unreachable
```

## Supply Chain Security: Signature & SBOM

P1-6 introduces manifest Ed25519 signature verification and CycloneDX 1.5 SBOM generation to detect supply chain tampering.

### Manifest Signature

At registry build time, `registry-manifest.json` carries an `integrity` field (canonical sha256 of the content) plus `signature` + `keyId` (an Ed25519 signature over the integrity). When fetching the manifest, the CLI performs two checks:

1. **Integrity recomputation**: recomputes sha256 over `name`/`schemaVersion`/`registryVersion`/`items` and compares it to the `integrity` field — this closes the gap of "tampering with content fields while keeping the original signature" (`buildTimestamp`/`gitCommit`/`integrity`/`signature`/`keyId` are excluded from the hash so builds stay idempotent).
2. **Signature verification**: looks up the trusted public key by `keyId` and verifies the signature was issued by a trusted maintainer.

#### Trusted Public Keys

Trusted public keys are resolved by priority, with the official root key always merged in as a trust anchor:

1. **Project-level** `trustedPublicKeys` in `components.json` (highest priority; same `keyId` overrides the official key)
2. **Environment variable** `BRUTX_REGISTRY_PUBLIC_KEYS` (JSON array)
3. **Built-in official root keys** `OFFICIAL_PUBLIC_KEYS` (zero-config fallback)

```bash
# Inject custom public keys via env var
BRUTX_REGISTRY_PUBLIC_KEYS='[{"keyId":"v1","publicKey":"<base64-SPKI-DER>"}]' \
  npx brutx-vue@latest add button
```

`publicKey` is a base64-encoded SPKI DER (single-line, easy to embed in JSON). **The official registry works out of the box**: with no keys configured, the CLI verifies the official registry signature using the built-in public key. Unsigned (legacy) manifests stay backward-compatible and are skipped.

#### Default warn vs strict mode

On signature failure, the **default behavior is `warn`** (print a warning and continue) so that projects without configured keys are not blocked during migration:

```text
[Signature] Manifest signed with unknown keyId "v1". No matching trusted public key found.
  (use --require-signature to enforce)
```

To fail hard on signature errors, activate strict mode:

```bash
# Via flag
npx brutx-vue@latest --require-signature add button

# Or via environment variable
BRUTX_REQUIRE_SIGNATURE=1 npx brutx-vue@latest add button
```

In strict mode, a signature failure throws `REGISTRY_SIGNATURE_INVALID` (exit 1). The `integrity` field still backstops tampering: even when signature verification is skipped, tampered content will fail because integrity no longer matches.

#### Key Rotation

Public keys are indexed by `keyId`. When rotating keys:

1. New key signs the manifest: add the new public key to `BRUTX_REGISTRY_PUBLIC_KEYS`
2. Transition period: the old key remains in the list, old manifests stay trusted
3. Revoke the old key: remove it from the env var

### SBOM Generation

#### Registry SBOM (build time)

`pnpm --filter brutx-registry-vue build` automatically generates `packages/registry/registry/registry-sbom.json` containing:

- All registry components (`type: application`, `bom-ref: brutx:<name>`)
- All npm dependencies (`type: library`, `bom-ref: npm:<dep>`)
- `dependencies` arrays referencing other bom-refs to form the dependency graph
- `integrity` field (sha256 over `bomFormat`/`specVersion`/`components`)
- `manifestIntegrity` field binding the SBOM to the corresponding `registry-manifest.json` integrity

`serialNumber` is a random UUID regenerated each build, excluded from integrity computation, and added to the `build:verify` diff exclusion set.

#### Project SBOM (`doctor --sbom`)

`doctor --sbom` generates an SBOM for installed components, written to `./brutx-sbom.json` (customize with `--sbom-output`):

```bash
npx brutx-vue@latest doctor --sbom
npx brutx-vue@latest doctor --sbom --sbom-output ./reports/sbom.json
```

It reads installed component versions, dependencies, `registryDependencies`, and integrity from the `.brutx/components.json` manifest and emits a CycloneDX 1.5 SBOM. Errors out if no components are installed.

## Default Source & Offline Mode

### Multi-Source Fallback

The default registry is **single-source**: a GitHub Release asset pointing at the latest release built and uploaded at publish time:

`https://github.com/lidaixingchen/brutxui-vue3/releases/latest/download`

Multi-source fallback remains available: configure multiple sources via the `registries` field in `components.json` (see [configuration](#componentsjson-configuration-file)) or the `--registry` flag, and the CLI tries them in order, automatically falling back to the next source when the primary times out or fails, printing a warning. If every source fails signature/integrity verification, the CLI surfaces the original error codes `REGISTRY_SIGNATURE_INVALID` / `REGISTRY_INTEGRITY_FAILED` (instead of a generic network error) and hints at possible inter-source consistency lag.

### Offline Mode

Activate offline mode with the `--offline` flag or the `BRUTX_OFFLINE=1` environment variable: **no network requests are made**, only the local cache is read (TTL-expired entries are still reused; integrity is still verified). On a cache hit the CLI prints:

```text
[OFFLINE CACHE HIT] button (source: https://github.com/lidaixingchen/brutxui-vue3/releases/latest/download)
```

A cache miss throws `REGISTRY_OFFLINE_UNAVAILABLE`. Run `brutx add` or `brutx list --check-updates` once online to warm the cache for offline use.

`brutx doctor` reports the cache entry count, total size, and offline availability.

## Available Components

accordion, activity-log-page, alert, alert-dialog, auth-card, avatar, badge, before-after, blog-card, blog-list-page, breadcrumb, brutalist-hero, button, calendar, card, card-3d, carousel, chat-bubble, checkbox, code-block, combobox, command, cookie-consent, copy-to-clipboard, counter, dashboard-shell, dashboard-stats, data-table, dialog, dropdown-menu, empty-state, faq-section, feedback-form, file-card, footer-section, form, gallery-section, glitch-text, hardcore-input, header-section, input, kbd, kanban, loading, marquee, not-found-page, number-input, overview-page, pagination, popover, pricing-section, profile-page, progress, quick-actions, radio-group, result, scratch-card, scroll-area, search-widget, select, separator, settings-page, sheet, skeleton, sketchy-chart, slider, spinner, stepper, switch, table, tabs, tags-input, testimonial-card, textarea, timeline, toast, toggle, toggle-group, tooltip, tree-view, upload, waitlist-page
