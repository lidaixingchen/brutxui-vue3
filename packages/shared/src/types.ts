/** 组件基础类别（ComponentCategory 与 SidebarGroup 共享的部分，单一来源） */
export const BASE_CATEGORIES = Object.freeze([
    'action',
    'data-display',
    'feedback',
    'form',
    'layout',
    'navigation',
    'overlay',
    'utility',
    'visual-effect',
] as const);

export type BaseCategory = typeof BASE_CATEGORIES[number];

/** 完整组件类别 = 基础类别 + marketing（区块专用） */
export const CATEGORIES = Object.freeze([...BASE_CATEGORIES, 'marketing'] as const);

export type ComponentCategory = typeof CATEGORIES[number];

/** 侧边栏分组 = 基础类别 + 日期时间/区块专用分组（由 BaseCategory 派生，避免与类别重复维护） */
export type SidebarGroup = BaseCategory | 'date-time' | 'blocks-cards' | 'blocks-sections' | 'blocks-pages';

export type ComponentKind = 'component' | 'block';

interface RegistryComponentMetaBase {
    title?: string;
    dependencies: string[];
    description?: string;
    category?: ComponentCategory;
    examples?: string[];
    sidebarGroup?: SidebarGroup;
    kind?: ComponentKind;
    /**
     * docsHidden=true 时组件不出现在侧边栏（不生成导航条目），此时 docsSlug 不再生效。
     */
    docsHidden?: boolean;
    docsSlug?: string;
}

/**
 * 组件元数据。status 与 replacement 关联：当 status 为 'legacy' | 'deprecated' 时，
 * replacement（替代组件名）在类型层强制必填，保证弃用组件始终指向替代组件。
 */
export type RegistryComponentMeta =
    | (RegistryComponentMetaBase & { status?: 'stable'; replacement?: string })
    | (RegistryComponentMetaBase & { status: 'legacy' | 'deprecated'; replacement: string });
