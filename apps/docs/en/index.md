---
layout: home
translated: true

hero:
  name: BrutxUI
  text: Neo-Brutalism Vue 3 Component Library
  tagline: Thick borders. Hard shadows. Zero compromise. A copy-paste-first component library built for Vue 3 + Tailwind CSS, where every pixel follows the Neo-Brutalism design philosophy.
  actions:
    - theme: brand
      text: Get Started →
      link: /en/guide/getting-started
    - theme: alt
      text: Browse Components
      link: /en/components/alert

features:
  - icon:
      light: /icons/palette.svg
      dark: /icons/palette.svg
      wrap: true
    title: Neo-Brutalism Design System
    details: 3px thick borders, 4px hard shadows, zero border-radius, vivid colors. Every component is built on CSS custom property tokens, supporting Classic / Pastel / Mono / Warm theme presets.
  - icon:
      light: /icons/accessibility.svg
      dark: /icons/accessibility.svg
      wrap: true
    title: Accessibility First
    details: Built on reka-ui headless primitives. Proper ARIA attributes, keyboard navigation, focus management, and screen reader compatibility, meeting WCAG standards.
  - icon:
      light: /icons/shield-check.svg
      dark: /icons/shield-check.svg
      wrap: true
    title: TypeScript Strict Mode
    details: Full strict type safety throughout. Zero any types with defineProps, CVA variants, and auto-complete for every prop.
  - icon:
      light: /icons/clipboard.svg
      dark: /icons/clipboard.svg
      wrap: true
    title: Copy-Paste First
    details: Zero dependency lock-in. Copy component source code directly into your project, fully own the code, and customize every detail.
  - icon:
      light: /icons/terminal.svg
      dark: /icons/terminal.svg
      wrap: true
    title: CLI Tool
    details: Add components with one command. npx brutx-vue init to set up, npx brutx-vue add button card to install on demand. AI-friendly project structure.
  - icon:
      light: /icons/zap.svg
      dark: /icons/zap.svg
      wrap: true
    title: Modern Tech Stack
    details: Vue 3.5+ script setup, Tailwind CSS 4.3+, Vite 8+, Vitest 4+, pnpm. Built for the modern Vue ecosystem.
---

<HomeComponentShowcase />

<HomeCodePreview />

<HomeStats />
