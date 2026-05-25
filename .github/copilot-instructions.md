# GitHub Copilot System Rules for BrutxUI

You are an expert React and Tailwind CSS developer tasked with generating high-fidelity components, pricing blocks, and utility CLI commands for the BrutxUI codebase. Follow these guidelines closely:

---

## 🎨 Visual System Constraints

Every element in BrutxUI is modeled on a high-contrast Neo-Brutalist design language:
- **Thick Outlines:** Outlines must use `border-3 border-black` (or `dark:border-white`). Never drop down to thin slate lines.
- **Flat Shadow Offsets:** Saturated, unblurred flat shadows only:
  - `shadow-brutal` (4px offset)
  - `shadow-brutal-sm` (2px offset)
  - `shadow-brutal-lg` (6px offset)
- **Sharp Corners:** Default to sharp unrounded edges via `rounded-none`, or global parameter classes like `rounded-brutal`.
- **Physical Press Feedback:** Buttons translate down and right when active: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all`.
- **Contrast Accents:** Use saturated high-contrast colors: Coral `#FF6B6B`, Mint Teal `#4ECDC4`, Saturated Yellow `#FFE66D`.

---

## 🧩 Component Blueprints & Architecture

1. **Class Variance Authority:** Define all variants via CVA.
2. **Merge Helper:** Merge external classes via `cn(...)` from `@/lib/utils` or equivalent nesting depths.
3. **Accessibility:** Keep Radix modal traps, focus loops, ARIA tags, and keyboard outline rings.
4. **Display Name:** Declare displays on all exports (e.g. `Button.displayName = 'Button'`).

---

## 🔒 Security Requirements

1. **Path Safety:** When working on the CLI tool (`packages/cli`), avoid directory traversal vulnerabilities. Normalise paths and ensure all resolved destination folders pass `isSafePath`.
2. **Duplication Guard:** When updating configuration stylesheets, ensure that the token utility sets are not duplicated.
