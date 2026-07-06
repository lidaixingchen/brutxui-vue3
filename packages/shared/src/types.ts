export type ComponentCategory =
    | 'action'
    | 'data-display'
    | 'feedback'
    | 'form'
    | 'layout'
    | 'marketing'
    | 'media'
    | 'navigation'
    | 'overlay'
    | 'page'
    | 'utility'
    | 'visual-effect';

export interface RegistryComponentMeta {
    dependencies: string[];
    description?: string;
    category?: ComponentCategory;
    examples?: string[];
    status?: 'stable' | 'legacy' | 'deprecated';
    replacement?: string;
}
