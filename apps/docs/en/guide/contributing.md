---
title: Contributing Guide
description: How to contribute code and improvements to BrutxUI
---

# Contributing Guide

Thank you for your interest in BrutxUI! Here are the guidelines and workflows for contributing to the repository.

---

## Development Environment

### Prerequisites

- Node.js 22.5+
- pnpm 10+ (The repository strictly requires pnpm; npm or yarn is forbidden)
- Git

### Clone & Install

```bash
git clone https://github.com/lidaixingchen/brutxui-vue3.git
cd brutxui-vue3
pnpm install
```

### Common Commands

```bash
pnpm build          # Turbo builds all workspace packages
pnpm lint           # Global linting and formatting fixes
pnpm typecheck      # Global strict TypeScript type checking
pnpm test           # Runs unit tests across all packages
pnpm test:ssr       # Server-Side Rendering (SSR) compatibility tests
```

---

## Scaffolding (Components & Pages)

Always run generators from the **workspace root**. Never assemble component boilerplates manually from scratch:

```bash
pnpm generate:component    # Interactively generates component, variants, and test skeleton
pnpm generate:composable   # Generates Composition API composable skeleton
pnpm generate:page         # Generates documentation showcase page
```

---

## Architecture Redlines & Conventions

Ensure your changes adhere to these core rules before committing:

1. **Variant Isolation**: All component variant logic must reside in a companion `*-variants.ts` file and imported into the component. Defining variants inline in `.vue` is forbidden.
2. **Class Merging**: Compute class names with `computed(() => cn(...))`. Direct inline invocation of `cn(...)` in `<template>` is forbidden.
3. **Primitive Reuse**: Base components on `reka-ui` unstyled primitives and reuse existing library components (e.g. `Button` instead of native `<button>`).
4. **Readonly Composable States**: Internal composable state may be mutable, but returned state exposed to consumers must be sealed with `readonly()` or `DeepReadonly()`.
5. **Single Source of Design Tokens**: Modify design tokens only in `packages/shared/src/design-tokens.ts`. Editing `@theme` in `styles.css` directly or adding `tailwind.config.js` is forbidden. Run `pnpm generate:tokens` to sync all packages.

---

## Commit Message Conventions

Commit messages must adhere to Conventional Commits:

```text
<type>(<scope>): <short description>

<optional body>
```

**Types**:

| Type | Description | Example |
| :--- | :--- | :--- |
| `feat` | New feature | New component or major capability |
| `fix` | Bug fix | Interaction fix or CSS calculation bug |
| `refactor` | Refactoring | Code restructure with unchanged behavior |
| `docs` | Documentation | Updating guides, examples, or typos |
| `style` | Formatting | Whitespace or indentation (enforced by ESLint) |
| `test` | Testing | Adding or fixing unit or a11y tests |
| `chore` | Tooling & Build | Updating dependencies or guard scripts |
| `perf` | Performance | Eliminating unnecessary re-renders |
| `ci` | CI/CD | GitHub Actions workflow changes |

**Scopes**: `ui` | `cli` | `docs` | `registry` | `shared` | `deps`

---

## Pull Request Verification

Run targeted local quality gates before opening a PR to ensure green status across all checks:

```bash
# 1. Static contract verification (styles, tokens, exports, dependency parity)
pnpm check:contracts

# 2. Documentation health gate (dead links, format, guidelines)
pnpm check:docs

# 3. Strict type checking
pnpm typecheck

# 4. Unit tests
pnpm test
```

### PR Checklist

- [ ] Passes `pnpm check:contracts`
- [ ] Passes `pnpm check:docs`
- [ ] Passes `pnpm typecheck`
- [ ] Relevant tests pass `pnpm test`
- [ ] Commit messages follow Conventional Commits

---

## Reporting Issues

If you find a bug or have a feature proposal, feel free to open a [GitHub Issue](https://github.com/lidaixingchen/brutxui-vue3/issues). Please provide clear reproduction steps or a minimal reproduction link (StackBlitz / CodeSandbox).
