---
description: Custom styling, component blueprints, and architectural safety rules for BrutxUI components and CLI packages.
globs: packages/ui/src/components/**/*.tsx, packages/registry/registry.json, packages/cli/src/commands/**/*.ts
---

# BrutxUI AI & Coding Rules

Always follow these rules when developing in this monorepo:

## Core Visual System Rules
- **Outline Thickness:** Use `border-3 border-black` (or `dark:border-white`). Avoid soft outlines like `border-slate-100`.
- **Dropshadows:** Saturated, unblurred flat shadows only:
  - `shadow-brutal` (which resolves to `box-shadow: 4px 4px 0px 0px #000`)
  - `shadow-brutal-sm` (2px)
  - `shadow-brutal-lg` (6px)
- **Angles:** Razor-sharp unrounded corners via `rounded-none`, or global parameter classes like `rounded-brutal`.
- **Interactive translation:** Active elements translate down and right: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all`.
- **Palette Highlights:** Saturated neon yellow (`#FFE66D`), mint teal (`#4ECDC4`), and coral red (`#FF6B6B`).

## Code Blueprints
- **Class Mergers:** Merge incoming classes using `cn` (from `@/lib/utils` or `../lib/utils`).
- **Variants:** Set styles through CVA. For atomic components (e.g. `button.tsx`), define variant properties for easy custom overriding.
- **Radix UI Accessibility:** Retain screen reader compatibility, ARIA tags, and outline highlights.

## Security Controls
- **Path Sanitization:** When editing CLI scripts (e.g. `add.ts` or `init.ts`), always check that file destinations are validated inside safe workspaces using `isSafePath`. Normalize the paths and filter out traversing sequences (`..`).

## Manifest Compiler
- When adding a component or layout block, describe it in `packages/registry/registry.json`. Execute the compiler and validator before finishing:
  - `pnpm --filter brutx-registry build`
  - `pnpm --filter brutx-registry validate`
