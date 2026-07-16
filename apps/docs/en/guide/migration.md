# Migration Guide

This page documents BREAKING changes and migration methods for BrutxUI Vue 3.

## reka-ui primitives no longer exported from brutx-ui-vue

### Affected versions

`brutx-ui-vue` 0.10.0 (Architecture Optimization Plan v2 §2.2)

### What changed

The `brutx-ui-vue` main entry `src/index.ts` no longer re-exports `reka-ui` primitive components and types. Previous lines like `export { DialogRoot as Dialog, DialogTrigger, DialogPortal, DialogClose } from 'reka-ui'` have all been removed.

**Rationale**: A component library's responsibility is to provide its own component implementations, not to act as a proxy entry point for third-party primitives. Re-exports add maintenance overhead and tree-shaking risk.

### Migration steps

#### 1. Install reka-ui (if not already installed)

```bash
pnpm add reka-ui
```

#### 2. Replace reka-ui primitives imported from brutx-ui-vue

```typescript
// ❌ Before: importing reka-ui primitives from brutx-ui-vue
import { DialogRoot, DialogTrigger } from 'brutx-ui-vue'

// ✅ After: import directly from reka-ui
import { DialogRoot, DialogTrigger } from 'reka-ui'
```

#### 3. Replace reka-ui type imports

```typescript
// ❌ Before
import type { DialogRootProps } from 'brutx-ui-vue'

// ✅ After
import type { DialogRootProps } from 'reka-ui'
```

### Unaffected scenarios

- Importing BrutxUI's own components (e.g., `Button`, `DialogContent`, `SelectTrigger`) from `brutx-ui-vue` is unaffected
- BrutxUI components internally `import from 'reka-ui'` directly; internal imports are unaffected
- Only the "outward re-export" is removed; component functionality is unchanged

### Common reka-ui primitives

The following primitives must be imported directly from `reka-ui`:

| Primitive | Purpose |
| --- | --- |
| `DialogRoot` / `DialogTrigger` / `DialogPortal` / `DialogClose` | Dialog container |
| `AlertDialogRoot` / `AlertDialogTrigger` | AlertDialog container |
| `PopoverRoot` / `PopoverTrigger` / `PopoverAnchor` | Popover container |
| `TooltipRoot` / `TooltipTrigger` | Tooltip container |
| `SelectRoot` | Select container |
| `DropdownMenuRoot` / `DropdownMenuTrigger` | DropdownMenu container |
| `TabsRoot` | Tabs container |
| `AccordionRoot` | Accordion container |
| `AvatarRoot` | Avatar container |
| `RadioGroupRoot` | RadioGroup container |
| `ToastProvider` | Toast Provider |

### Subpath imports

The `exports` field of `brutx-ui-vue` auto-generates subpaths for each component directory (e.g., `brutx-ui-vue/button`, `brutx-ui-vue/dialog`), but these subpaths only export BrutxUI's own components, not reka-ui primitives.
