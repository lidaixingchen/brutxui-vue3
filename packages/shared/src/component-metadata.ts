import { COMPONENTS } from './components.js';
import type { ComponentCategory, ComponentKind, RegistryComponentMeta, SidebarGroup } from './types.js';

export interface ComponentMetadataEntry {
    name: string;
    title: string;
    description: string;
    category: ComponentCategory;
    examples: string[];
    dependencies: string[];
    status?: 'stable' | 'legacy' | 'deprecated';
    replacement?: string;
    sidebarGroup?: SidebarGroup;
    kind?: ComponentKind;
    docsHidden?: boolean;
    docsSlug?: string;
}

const CATEGORY_OVERRIDES: Record<string, ComponentCategory> = {
    accordion: 'navigation',
    alert: 'feedback',
    'alert-dialog': 'overlay',
    avatar: 'data-display',
    backtop: 'navigation',
    badge: 'feedback',
    'before-after': 'visual-effect',
    breadcrumb: 'navigation',
    button: 'action',
    calendar: 'data-display',
    card: 'layout',
    'card-3d': 'layout',
    carousel: 'data-display',
    cascader: 'form',
    checkbox: 'form',
    'chat-bubble': 'data-display',
    'code-block': 'data-display',
    'color-mode-switcher': 'utility',
    'color-picker': 'form',
    combobox: 'form',
    command: 'overlay',
    'cookie-consent': 'marketing',
    'copy-to-clipboard': 'utility',
    counter: 'data-display',
    'data-table': 'data-display',
    'date-picker': 'form',
    descriptions: 'data-display',
    dialog: 'overlay',
    'dropdown-menu': 'overlay',
    'feedback-form': 'marketing',
    form: 'form',
    'hardcore-input': 'form',
    image: 'data-display',
    'infinite-scroll': 'utility',
    input: 'form',
    kanban: 'utility',
    kbd: 'utility',
    label: 'form',
    loading: 'feedback',
    marquee: 'visual-effect',
    menu: 'navigation',
    message: 'feedback',
    'noise-background': 'visual-effect',
    'number-input': 'form',
    pagination: 'navigation',
    popconfirm: 'overlay',
    popover: 'overlay',
    progress: 'feedback',
    rate: 'form',
    'radio-group': 'form',
    result: 'feedback',
    'scroll-area': 'layout',
    select: 'form',
    separator: 'layout',
    sheet: 'overlay',
    'scratch-card': 'visual-effect',
    skeleton: 'feedback',
    'sketchy-chart': 'data-display',
    slider: 'form',
    spinner: 'feedback',
    stepper: 'navigation',
    switch: 'form',
    table: 'data-display',
    tabs: 'navigation',
    'tags-input': 'form',
    textarea: 'form',
    timeline: 'data-display',
    toast: 'feedback',
    toggle: 'action',
    'toggle-group': 'action',
    tooltip: 'overlay',
    tour: 'overlay',
    transfer: 'form',
    'tree-select': 'form',
    'tree-view': 'data-display',
    upload: 'form',
    'virtual-scroll': 'utility',
    watermark: 'utility',
};

export const COMPONENT_METADATA: Record<string, ComponentMetadataEntry> = createComponentMetadata();
export const AVAILABLE_COMPONENTS = Object.keys(COMPONENT_METADATA);
export const COMPONENTS_BY_CATEGORY: Record<ComponentCategory, string[]> = createComponentsByCategory();

export function getComponentsByCategory(category: ComponentCategory): string[] {
    return [...COMPONENTS_BY_CATEGORY[category]];
}

function createComponentMetadata(): Record<string, ComponentMetadataEntry> {
    const metadata: Record<string, ComponentMetadataEntry> = {};

    for (const [name, meta] of Object.entries(COMPONENTS)) {
        metadata[name] = {
            name,
            title: meta.title ?? formatTitle(name),
            description: meta.description ?? `A highly customizable neo-brutalist ${formatTitle(name)} component built with Brutx design tokens for Vue 3.`,
            category: meta.category ?? inferCategory(name),
            examples: [...(meta.examples ?? [])],
            dependencies: [...meta.dependencies],
            status: meta.status,
            replacement: meta.replacement,
            sidebarGroup: meta.sidebarGroup,
            kind: meta.kind,
            docsHidden: meta.docsHidden,
            docsSlug: meta.docsSlug,
        };
    }

    return metadata;
}

function formatTitle(name: string): string {
    return name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function inferCategory(name: string): ComponentCategory {
    if (CATEGORY_OVERRIDES[name]) {
        return CATEGORY_OVERRIDES[name];
    }

    if (name.endsWith('-section') || name.endsWith('-hero')) {
        return 'marketing';
    }

    if (name.endsWith('-card') || name.endsWith('-shell') || name.endsWith('-stats')) {
        return 'layout';
    }

    if (name.includes('glitch') || name.includes('scratch') || name.includes('noise') || name.includes('typewriter')) {
        return 'visual-effect';
    }

    return 'utility';
}

function createComponentsByCategory(): Record<ComponentCategory, string[]> {
    const groups: Record<ComponentCategory, string[]> = {
        action: [],
        'data-display': [],
        feedback: [],
        form: [],
        layout: [],
        marketing: [],
        navigation: [],
        overlay: [],
        utility: [],
        'visual-effect': [],
    };

    for (const entry of Object.values(COMPONENT_METADATA)) {
        if (entry.kind === 'block') continue;
        groups[entry.category].push(entry.name);
    }

    for (const names of Object.values(groups)) {
        names.sort();
    }

    return groups;
}

export type { RegistryComponentMeta };
