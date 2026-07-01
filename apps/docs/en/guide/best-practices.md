---
title: Best Practices
description: Usage guidelines and design patterns for BrutxUI.
---

# Best Practices

To help you build high-quality, high-performance, and accessible Neo-Brutalism web applications, BrutxUI provides detailed best practice guides across four core areas.

Select a guide below based on your development needs:

---

## 📖 [Component Usage](./best-practices/component-usage)

Learn how to select, organize, and extend basic and composite components:
* **Component Selection Guide**: Recommended components for basic inputs, feedback alerts, and complex form scenarios.
* **Props & Event Handlers**: Standards for variant and size options, type-safe bindings (`v-model`), and event listeners.
* **Slots & Composition**: Leveraging default/named slots and the `asChild` composition pattern to customize component rendering.

## 🎨 [Styling & Customization](./best-practices/styling)

Understand styling methods with CSS variables and Tailwind CSS extensions:
* **CSS Variable Overrides**: Overriding `--brutal-` prefixed variables globally or locally to control border widths, colors, offsets, and border radii.
* **Themes & Tokens**: Using built-in theme presets, styling with CSS classes, and swapping themes dynamically at runtime.
* **Tailwind Extensions**: Utilizing utilities, modifying configuration, and combining styles dynamically using the `cn()` helper.

## ♿ [Accessibility (A11y)](./best-practices/accessibility)

Build accessible experiences compliant with WCAG 2.1 AA standards:
* **ARIA & Semantics**: Proper ARIA role behaviors and form controls automatically mapped to `<Label>` components.
* **Keyboard Navigation & Focus**: Built-in keyboard navigation mappings and managing focus states during modal overlays.
* **Screen Reader Support**: Setting up alternate descriptors, managing `aria-live` regions, and handling high contrast preferences.

## ⚡ [Performance Optimization](./best-practices/performance)

Implement performance optimization strategies for large datasets and highly interactive applications:
* **Bundling & Lazy Loading**: Tree-shaking optimizations, code-splitting with async components, and route-level lazy loading.
* **Rendering Large Datasets**: Using `shallowRef` to bypass deep reactivity tracking and utilizing `VirtualScroll` to optimize scrolling.
* **Interaction Throttling**: Applying debounce and throttle behaviors to input searches, button clicks, and scroll listeners.
