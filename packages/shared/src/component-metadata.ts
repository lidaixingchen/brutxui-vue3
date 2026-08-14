import { COMPONENTS } from './components.js';
import type { ComponentCategory, ComponentKind, RegistryComponentMeta, SidebarGroup } from './types.js';

export interface ComponentMetadataEntry {
    name: string;
    title: string;
    description: string;
    category: ComponentCategory;
    /** 只读数组：导出时已被 Object.freeze，消费方不得修改 */
    examples: readonly string[];
    /** 只读数组：导出时已被 Object.freeze，消费方不得修改 */
    dependencies: readonly string[];
    status?: 'stable' | 'legacy' | 'deprecated';
    replacement?: string;
    sidebarGroup?: SidebarGroup;
    /**
     * 规范化后的组件类型：createComponentMetadata 构造时会把源数据缺失的 kind 统一为 'component'，
     * 消费方无需再依赖『kind 缺省即 component』的隐式约定
     */
    kind: ComponentKind;
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
    'glitch-text': 'visual-effect',
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
    'typewriter-text': 'visual-effect',
    upload: 'form',
    'virtual-scroll': 'utility',
    watermark: 'utility',
};

/**
 * 元数据导出均为深只读（递归 Object.freeze + Readonly 类型，见 createComponentMetadata /
 * createComponentsByCategory 内部的冻结），防止运行时篡改破坏元数据与分类分组
 * （COMPONENTS_BY_CATEGORY）之间的一致性——包括 entry 内的 examples/dependencies 数组。
 */
export const COMPONENT_METADATA: Readonly<Record<string, Readonly<ComponentMetadataEntry>>> = Object.freeze(createComponentMetadata());
export const AVAILABLE_COMPONENTS: readonly string[] = Object.freeze(Object.keys(COMPONENT_METADATA));
export const COMPONENTS_BY_CATEGORY: Readonly<Record<ComponentCategory, readonly string[]>> = Object.freeze(createComponentsByCategory());

export function getComponentsByCategory(category: ComponentCategory): string[] {
    return [...COMPONENTS_BY_CATEGORY[category]];
}

function createComponentMetadata(): Record<string, Readonly<ComponentMetadataEntry>> {
    const metadata: Record<string, Readonly<ComponentMetadataEntry>> = {};

    for (const [name, meta] of Object.entries(COMPONENTS)) {
        // 构造时同步冻结 entry 与数组，避免导出后运行时篡改（Object.freeze 为浅冻结，需逐层处理）
        metadata[name] = Object.freeze({
            name,
            title: meta.title ?? formatTitle(name),
            description: meta.description ?? `A highly customizable neo-brutalist ${formatTitle(name)} component built with Brutx design tokens for Vue 3.`,
            category: meta.category ?? inferCategory(name),
            examples: Object.freeze([...(meta.examples ?? [])]),
            dependencies: Object.freeze([...(meta.dependencies ?? [])]),
            status: meta.status,
            replacement: meta.replacement,
            sidebarGroup: meta.sidebarGroup,
            // kind 缺省即 'component'：在构造边界显式化，消费方无需依赖隐式默认值
            kind: meta.kind ?? 'component',
            docsHidden: meta.docsHidden,
            docsSlug: meta.docsSlug,
        });
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

    // 新增组件必须显式登记在 CATEGORY_OVERRIDES 或命中上述后缀规则；
    // 落到默认分类通常意味着漏登记，开发期告警以便及早发现（防止静默归入 utility）
    console.warn(`[component-metadata] Component "${name}" has no explicit category — falling back to "utility". Register it in CATEGORY_OVERRIDES (packages/shared/src/component-metadata.ts) if a different category is intended.`);

    return 'utility';
}

function createComponentsByCategory(): Record<ComponentCategory, readonly string[]> {
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

    // 分组数组同样冻结，防止运行时改写分组与 COMPONENT_METADATA 失步
    const frozen: Record<ComponentCategory, readonly string[]> = {
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
    for (const [category, names] of Object.entries(groups) as Array<[ComponentCategory, string[]]>) {
        frozen[category] = Object.freeze(names);
    }
    return frozen;
}

export const CATEGORY_LABELS_ZH: Readonly<Record<ComponentCategory, string>> = Object.freeze({
    action: '操作',
    form: '表单与输入',
    'data-display': '数据展示',
    navigation: '导航',
    feedback: '反馈与状态',
    overlay: '弹出层与浮层',
    layout: '布局与结构',
    'visual-effect': '交互与可视化',
    utility: '主题与工具',
    marketing: '区块',
});

export const CATEGORY_LABELS_EN: Readonly<Record<ComponentCategory, string>> = Object.freeze({
    action: 'Actions',
    form: 'Form & Input',
    'data-display': 'Data Display',
    navigation: 'Navigation',
    feedback: 'Feedback & Status',
    overlay: 'Overlay & Popup',
    layout: 'Layout & Structure',
    'visual-effect': 'Interaction & Visualization',
    utility: 'Theme & Utilities',
    marketing: 'Blocks',
});

export type { RegistryComponentMeta };
