import { COMPONENT_FILES, type ComponentFileMapping } from './component-files.js';
import { COMPONENTS } from './components.js';
import type { ComponentCategory, RegistryComponentMeta } from './types.js';

export interface ComponentRegistryEntry extends RegistryComponentMeta, ComponentFileMapping {
    name: string;
    category: ComponentCategory;
    examples: string[];
}

const CATEGORY_OVERRIDES: Record<string, ComponentCategory> = {
    accordion: 'navigation',
    alert: 'feedback',
    'alert-dialog': 'overlay',
    avatar: 'media',
    backtop: 'navigation',
    badge: 'feedback',
    'before-after': 'media',
    breadcrumb: 'navigation',
    button: 'action',
    calendar: 'data-display',
    card: 'layout',
    carousel: 'media',
    cascader: 'form',
    checkbox: 'form',
    'chat-bubble': 'feedback',
    'code-block': 'data-display',
    'color-mode-switcher': 'utility',
    'color-picker': 'form',
    combobox: 'form',
    command: 'overlay',
    'copy-to-clipboard': 'utility',
    counter: 'data-display',
    'data-table': 'data-display',
    'date-picker': 'form',
    descriptions: 'data-display',
    dialog: 'overlay',
    'dropdown-menu': 'overlay',
    form: 'form',
    image: 'media',
    'infinite-scroll': 'utility',
    input: 'form',
    'input-adornment': 'form',
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
    skeleton: 'feedback',
    slider: 'form',
    spinner: 'feedback',
    statistic: 'data-display',
    stepper: 'navigation',
    switch: 'form',
    table: 'data-display',
    tabs: 'navigation',
    'tags-input': 'form',
    textarea: 'form',
    toast: 'feedback',
    toggle: 'action',
    'toggle-group': 'action',
    tooltip: 'overlay',
    tour: 'overlay',
    transfer: 'form',
    'tree-select': 'form',
    'tree-view': 'navigation',
    upload: 'form',
    'virtual-scroll': 'utility',
    watermark: 'utility',
};

export const COMPONENT_REGISTRY: Record<string, ComponentRegistryEntry> = createComponentRegistry();

function createComponentRegistry(): Record<string, ComponentRegistryEntry> {
    const registry: Record<string, ComponentRegistryEntry> = {};

    for (const [name, fileMapping] of Object.entries(COMPONENT_FILES)) {
        const meta = COMPONENTS[name];

        if (!meta) {
            throw new Error(`Missing component metadata for "${name}".`);
        }

        registry[name] = {
            name,
            ...meta,
            ...fileMapping,
            category: meta.category ?? inferCategory(name),
            examples: meta.examples ?? [],
        };
    }

    for (const name of Object.keys(COMPONENTS)) {
        if (!registry[name]) {
            throw new Error(`Missing component file mapping for "${name}".`);
        }
    }

    return registry;
}

function inferCategory(name: string): ComponentCategory {
    if (CATEGORY_OVERRIDES[name]) {
        return CATEGORY_OVERRIDES[name];
    }

    if (name.endsWith('-page')) {
        return 'page';
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
