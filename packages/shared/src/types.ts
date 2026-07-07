export type ComponentCategory =
    | 'action'
    | 'data-display'
    | 'feedback'
    | 'form'
    | 'layout'
    | 'marketing'
    | 'navigation'
    | 'overlay'
    | 'page'
    | 'utility'
    | 'visual-effect';

export type SidebarGroup =
    | 'action'
    | 'layout'
    | 'form'
    | 'data-display'
    | 'navigation'
    | 'feedback'
    | 'overlay'
    | 'date-time'
    | 'visual-effect'
    | 'utility'
    | 'blocks-cards'
    | 'blocks-sections'
    | 'blocks-pages';

export type ComponentKind = 'component' | 'block';

export interface RegistryComponentMeta {
    title?: string;
    dependencies: string[];
    description?: string;
    category?: ComponentCategory;
    examples?: string[];
    status?: 'stable' | 'legacy' | 'deprecated';
    replacement?: string;
    sidebarGroup?: SidebarGroup;
    kind?: ComponentKind;
    docsHidden?: boolean;
    docsSlug?: string;
}
