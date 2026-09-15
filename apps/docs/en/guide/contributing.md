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
- pnpm 11+ (The repository strictly requires pnpm; npm or yarn is forbidden)
- Git

### Clone & Install

```bash
git clone https://github.com/lidaixingchen/brutxui-vue3.git
cd brutxui-vue3
pnpm install
```

### Scenario-Matched Checks

**Avoid running global `pnpm test` or `lint` indiscriminately** during active development. Run focused checks targeted at touched areas:

| Touched Area | Recommended Check | Purpose |
| --- | --- | --- |
| Logic / Components / Functions | `pnpm --filter <pkg> test <path>`<br>`pnpm exec eslint <file> --fix` | Runs targeted unit tests and code formatting |
| Types / Cross-Package Exports | `pnpm --filter <pkg> typecheck` | Validates strict TypeScript compatibility |
| Styles / Tokens / Dependencies | `pnpm check:contracts` | Static contracts concurrency gate (~2s) |
| Docs / Guidelines / Links | `pnpm check:docs` | Documentation health gate (~0.4s, add `--fix` to auto-heal links) |

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

Run targeted local quality gates for your touched areas before opening a PR:

- **Source Code Changes**: Run package unit tests `pnpm --filter <pkg> test <path>` and ensure zero Lint errors;
- **Types or Contracts**: Run `pnpm --filter <pkg> typecheck` and `pnpm check:contracts`;
- **Documentation & Examples**: Run `pnpm check:docs`;
- **Commit Formatting**: Adheres to Conventional Commits.

---

## Architectural Deep Dive

Before proposing core architectural changes or introducing critical capabilities, review the evergreen architectural documentation:
- [Architecture Overview](https://github.com/lidaixingchen/brutxui-vue3/blob/main/docs/architecture/%E9%A1%B9%E7%9B%AE%E6%9E%B6%E6%9E%84%E6%80%BB%E8%A7%88.md): Package boundaries and dependency topology
- [Distribution & API Contracts](https://github.com/lidaixingchen/brutxui-vue3/blob/main/docs/architecture/%E5%88%86%E5%8F%91%E4%B8%8E%E5%85%AC%E5%BC%8FAPI%E5%A5%91%E7%BA%A6.md): Dual-distribution model and internal helper isolation
- [Generation & Build Mechanisms](https://github.com/lidaixingchen/brutxui-vue3/blob/main/docs/architecture/%E7%94%9F%E6%88%90%E4%B8%8E%E6%9E%84%E5%BB%BA%E6%9C%BA%E5%88%B6.md): Design tokens compilation and Git staged snapshot checks

---

## Reporting Issues

If you find a bug or have a feature proposal, feel free to open a [GitHub Issue](https://github.com/lidaixingchen/brutxui-vue3/issues). Please provide clear reproduction steps or a minimal reproduction link (StackBlitz / CodeSandbox).
