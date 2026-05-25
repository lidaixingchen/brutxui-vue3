/**
 * Component Registry Metadata
 *
 * This is the canonical source of truth for all Brutx components.
 * Both the CLI and the registry build script consume this data.
 *
 * To add a new component:
 * 1. Add an entry here with its name and npm dependencies
 * 2. Create the component in packages/ui/src/components/
 * 3. Run `pnpm --filter brutx-registry build` to generate the registry JSON
 */

import type { ComponentMeta } from './types.js';

export const COMPONENTS: Record<string, ComponentMeta> = {
    alert: { name: 'alert', dependencies: ['lucide-react'] },
    avatar: { name: 'avatar', dependencies: ['@radix-ui/react-avatar'] },
    badge: { name: 'badge', dependencies: [] },
    button: { name: 'button', dependencies: ['@radix-ui/react-slot'] },
    calendar: { name: 'calendar', dependencies: ['react-day-picker', 'date-fns', 'lucide-react'] },
    card: { name: 'card', dependencies: [] },
    checkbox: { name: 'checkbox', dependencies: ['@radix-ui/react-checkbox', 'lucide-react'] },
    combobox: {
        name: 'combobox',
        dependencies: ['cmdk', '@radix-ui/react-popover', 'lucide-react'],
    },
    command: { name: 'command', dependencies: ['cmdk', 'lucide-react'] },
    dialog: { name: 'dialog', dependencies: ['@radix-ui/react-dialog', 'lucide-react'] },
    'dropdown-menu': {
        name: 'dropdown-menu',
        dependencies: ['@radix-ui/react-dropdown-menu', 'lucide-react'],
    },
    input: { name: 'input', dependencies: [] },
    label: { name: 'label', dependencies: ['@radix-ui/react-label'] },
    pagination: { name: 'pagination', dependencies: ['lucide-react'] },
    popover: { name: 'popover', dependencies: ['@radix-ui/react-popover'] },
    'scroll-area': { name: 'scroll-area', dependencies: ['@radix-ui/react-scroll-area'] },
    select: { name: 'select', dependencies: ['@radix-ui/react-select', 'lucide-react'] },
    separator: { name: 'separator', dependencies: ['@radix-ui/react-separator'] },
    skeleton: { name: 'skeleton', dependencies: [] },
    spinner: { name: 'spinner', dependencies: [] },
    'submit-button': { name: 'submit-button', dependencies: [] },
    switch: { name: 'switch', dependencies: ['@radix-ui/react-switch'] },
    table: { name: 'table', dependencies: [] },
    tabs: { name: 'tabs', dependencies: ['@radix-ui/react-tabs'] },
    textarea: { name: 'textarea', dependencies: [] },
    toast: { name: 'toast', dependencies: ['lucide-react'] },
    tooltip: { name: 'tooltip', dependencies: ['@radix-ui/react-tooltip'] },
    'saas-pricing': { name: 'saas-pricing', dependencies: ['lucide-react'] },
    'dashboard-stats': { name: 'dashboard-stats', dependencies: ['lucide-react'] },
    form: { name: 'form', dependencies: ['react-hook-form', 'zod', '@radix-ui/react-label', '@radix-ui/react-slot'] },
    'alert-dialog': { name: 'alert-dialog', dependencies: ['@radix-ui/react-alert-dialog'] },
    sheet: { name: 'sheet', dependencies: ['@radix-ui/react-dialog', 'lucide-react'] },
    'radio-group': { name: 'radio-group', dependencies: ['@radix-ui/react-radio-group', 'lucide-react'] },
    slider: { name: 'slider', dependencies: ['@radix-ui/react-slider'] },
    progress: { name: 'progress', dependencies: ['@radix-ui/react-progress'] },
    toggle: { name: 'toggle', dependencies: ['@radix-ui/react-toggle'] },
    'toggle-group': { name: 'toggle-group', dependencies: ['@radix-ui/react-toggle-group'] },
    'brutalist-hero': { name: 'brutalist-hero', dependencies: ['lucide-react'] },
    'pricing-section': { name: 'pricing-section', dependencies: ['lucide-react'] },
    'auth-card': { name: 'auth-card', dependencies: ['lucide-react'] },
    'dashboard-shell': { name: 'dashboard-shell', dependencies: ['lucide-react'] },
    'empty-state': { name: 'empty-state', dependencies: ['lucide-react'] },
    'waitlist-page': { name: 'waitlist-page', dependencies: ['lucide-react'] },
} as const;

/** List of all available component names */
export const AVAILABLE_COMPONENTS = Object.keys(COMPONENTS);
