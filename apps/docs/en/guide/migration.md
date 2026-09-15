# Migration Guide

This document records the version evolution, public API adjustments, and breaking change migration guides for BrutxUI to help you smoothly upgrade the component library.

---

## Overview & Version Compatibility

BrutxUI is currently in rapid `0.x` iteration. To avoid long-term legacy burdens, the public API continues to be streamlined and standardized following first principles.

| Module | Nature of Change | Impact Scope | Applicable / Introduced Version |
| --- | --- | --- | --- |
| **Public API Contract Convergence** | Structural optimization | Export scope from root entry, subpath import rules | `v0.10.0+` |
| **Props Type Inference** | Recommended practice | Component Props type definition approach | `v0.10.0+` |
| **Selector Internal Helpers** | Removal / Encapsulation | Internal functions like `useClearableSelection` | `v0.10.0+` |
| **Button Effect (Glitch) Control** | Behavioral change | `Button` effect prop and programmatic playback | `v0.9.0+` |
| **CLI Source Mode Types Placement** | Directory specification | Shared types location in source installation mode | `v0.9.0+` |
| **Style & Asset Consumption** | Architectural note | Subpath imports and CSS stylesheet delivery boundaries | All versions |

---

## 1. Public API Contract & Standard Imports

BrutxUI uses a unified API Contract for module declaration and export projection.

### 1. Root Entry vs. Subpath Imports

- **Root entry (`brutx-ui-vue`)**: Exports foundational components (such as `Button`, `Card`, `Badge`, `Dialog`), shared variants, and headless utilities.
- **Named subpaths (`brutx-ui-vue/<module>`)**: Used to load composite components (such as `Combobox`, `TreeSelect`, `Cascader`, `DataTable`) along with their specialized types and variants, as well as standalone composables (such as `brutx-ui-vue/useReducedMotion`).

<<< @/.vitepress/examples/migration-api.ts#imports{ts}

### 2. Best Practices for Props Type Inference

In earlier versions, some components individually exported named types such as `ButtonProps`. Starting from `v0.10.0`, to ensure types always remain synchronized with the single source of truth in component implementations, **it is recommended to use Vue 3's `InstanceType<typeof Component>['$props']`**:

<<< @/.vitepress/examples/migration-api.ts#props-inference{ts}

---

## 2. Selector Internal Helpers Convergence

### Background

In earlier versions, the following 4 selector-related helper functions were inadvertently exposed through the root entry or public subpaths:
- `useClearableSelection`
- `useSelectableTrigger`
- `useSelectionDisplayText`
- `useTransferPanelSelection`

These functions are internal implementation details tightly coupled to internal component states. Starting in `v0.10.0`, they have been removed from npm public exports and public subpaths.

### Migration & Alternatives

Application code should not and does not need to call these internal helpers directly. All selection state management should be performed cleanly via standard `v-model`, props, slots, and events on the corresponding components (`Combobox`, `Cascader`, `TreeSelect`, `Transfer`):

<<< @/.vitepress/examples/migration-api.ts#selector-usage{ts}

> [!NOTE]
> Core business data types like `ComboboxOption`, `CascaderOption`, `CascaderValue`, `TreeNode`, `SelectionMode`, and `TransferDataItem` remain public and should be imported from their respective subpaths.

---

## 3. Explicit Button Effect Control & Lifecycle

### Description

Starting with `v0.9.0`, the `Button` component enforces strict lifecycle and triggering constraints on the glitch effect:
1. **Explicit Enablement**: You must explicitly specify `effect="glitch"`. Under the default `effect="none"`, the effect will not activate even if `autoplay` is passed or `play()` is called programmatically via a template ref.
2. **Lifecycle Safeguards**: When a button is `disabled`, `loading`, when the user's OS has `prefers-reduced-motion` enabled, or when deactivated inside `<KeepAlive>`, the effect automatically pauses; unmounting releases all underlying WebGL / Canvas / Audio resources.

<<< @/.vitepress/examples/migration-api.ts#button-effect{ts}

For motion-sensitive environments, pair this with the `useReducedMotion` composable for graceful degradation:

<<< @/.vitepress/examples/migration-api.ts#reduced-motion{ts}

---

## 4. Shared Types in CLI Source Installation Mode

For projects using the CLI (`brutx-vue add <component>`) to copy source code:
- Shared tree and option types are installed by default under `types/` at the same level as composables (e.g. `src/types/tree.ts`).
- If `sharedBase` is configured in `brutx.json`, types are placed under that configured directory's `types/`.
- When updating source components, use the CLI's diff/update workflow to review upstream updates while preserving your local custom modifications.

---

## 5. Style Consumption & Performance Costs

BrutxUI delivers styles compiled into a **single consolidated stylesheet**:
- Importing via subpaths (e.g. `import { Combobox } from 'brutx-ui-vue/combobox'`) reduces the JavaScript dependency closure of your bundle.
- However, due to the atomic and utility-driven nature of Neo-Brutalist Tailwind CSS v4 design tokens, the stylesheet should be imported once globally:
  ```ts
  import 'brutx-ui-vue/style.css'
  ```
- When analyzing bundle cost, measure tree-shaken JavaScript savings and CSS stylesheet size independently.
