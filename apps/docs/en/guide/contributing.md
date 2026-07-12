---
title: Contributing
description: How to participate in BrutxUI development and contribute.
translated: true
---

# Contributing

Thank you for your interest in BrutxUI! Here's how you can contribute.

---

## Development Environment

### Prerequisites

- Node.js 22.5+
- pnpm 11+
- Git

### Clone & Install

```bash
git clone https://github.com/brutxui/brutxui-vue3.git
cd brutxui-vue3
pnpm install
```

### Common Commands

```bash
pnpm build          # Build UI package
pnpm lint           # Lint code
pnpm typecheck      # Type check
pnpm test           # Run tests
pnpm test:watch     # Run tests in watch mode
pnpm release:check  # Full pre-release gate
```

---

## Commit Conventions

### Branch Naming

- `feat/xxx` — New features
- `fix/xxx` — Bug fixes
- `docs/xxx` — Documentation updates
- `refactor/xxx` — Refactoring

### Commit Message Format

```text
<type>(<scope>): <short description>

<detailed description (optional)>
```

**Types**:

| Type       | Description                          | Example Scenarios                       |
| ---------- | ------------------------------------ | --------------------------------------- |
| `feat`     | New feature                          | New components, new props               |
| `fix`      | Bug fix                              | Fix test failures, fix style issues     |
| `refactor` | Refactoring (no behavior change)     | Code restructuring, renaming            |
| `docs`     | Documentation changes                | Update README, component docs           |
| `style`    | Formatting (no logic change)         | Code formatting, whitespace adjustments |
| `test`     | Testing                              | Add tests, fix tests                    |
| `chore`    | Build/tools/dependencies             | Upgrade dependencies, config changes    |
| `perf`     | Performance optimization             | Reduce render overhead, optimize calculations |
| `ci`       | CI/CD configuration                  | GitHub Actions changes                  |
| `build`    | Build system changes                 | Vite config, bundle optimization        |
| `revert`   | Revert commit                        | Revert a feature                        |

**Scope**: `ui` | `cli` | `docs` | `registry` | `shared` | `deps` (optional)

**Examples**:

```text
fix(ui): fix Button component hover state style
docs: update README installation instructions
chore(deps): upgrade Vue to 3.5.13
```

::: tip Note
Keep descriptions concise and under 50 characters.
:::

---

## Adding a New Component

### 1. Create Component Files

```text
packages/ui/src/components/
├── my-component/
│   ├── MyComponent.vue
│   ├── my-component-variants.ts
│   └── index.ts
```

### 2. Register in the Registry

Add the component metadata in `packages/shared/src/components.ts` (`COMPONENTS`), then run `pnpm --filter brutx-ui-vue prebuild:scan` to generate the manifest (file mappings are discovered by AST automatically).

### 3. Write Documentation

Create documentation in `apps/docs/components/`, following the [Component Documentation Template](https://github.com/lidaixingchen/brutxui-vue3/blob/main/docs/COMPONENT_DOC_TEMPLATE.md).

### 4. Write Tests

Add `*.test.ts` files in the component directory.

### 5. Submit a PR

Ensure all checks pass:

```bash
pnpm release:check
```

---

## Pull Request Process

1. Fork this repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Create a Pull Request

### PR Checklist

- [ ] Code passes `pnpm lint`
- [ ] Code passes `pnpm typecheck`
- [ ] New features include tests
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow conventions

---

## Reporting Issues

Submit issues on [GitHub Issues](https://github.com/brutxui/brutxui-vue3/issues). Please include:

- Clear title and description
- Steps to reproduce
- Expected behavior vs actual behavior
- Environment information
- Minimal reproduction link (recommended)

---

## Code of Conduct

- Respect every participant
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards others
