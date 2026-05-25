# BrutxUI Cursor Rules

Always adhere to these guidelines when authoring React components, layout blocks, or styling custom elements in the BrutxUI codebase:

## Visual Style Guide
- **Borders:** Always use `border-3 border-black` (or `dark:border-white`). Never use default light slate/gray borders.
- **Shadows:** Hard offset shadows only. Use `shadow-brutal` (4px offset), `shadow-brutal-sm` (2px offset), or `shadow-brutal-lg` (6px offset). Never use standard blurred shadows (`shadow-md`, `shadow-lg`).
- **Radii:** Sharp 0px corners via `rounded-none`, or global parameter classes like `rounded-brutal`.
- **Transitions:** Buttons and interactive elements translate on press: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all`.
- **Color Accents:** Use saturated high-contrast colors: Coral `#FF6B6B` (`bg-brutal-primary`), Mint Teal `#4ECDC4` (`bg-brutal-secondary`), Saturated Yellow `#FFE66D` (`bg-brutal-accent`).

## Component Guidelines
- Use standard `class-variance-authority` (CVA) to define styling variants.
- Merge custom layout inputs using the local class merger helper `cn` from `@/lib/utils` or equivalent path.
- Follow Radix UI guidelines for modals, dialogs, popovers, and inputs to keep markup robust and fully accessible.
- Declare correct `displayName` for every component file.

## Safe Path Resolving
- When authoring CLI tools, normalize all directory inputs. Check and reject any relative traversals (`..`) or absolute path structures that escape safe workspaces.

## Registry Schema
- When creating a new component or pricing block, always append its configuration schema to `packages/registry/registry.json`. Then compile and validate schemas via `pnpm --filter brutx-registry build` and `pnpm --filter brutx-registry validate`.
