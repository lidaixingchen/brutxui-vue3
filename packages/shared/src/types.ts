export interface RegistryComponentMeta {
    dependencies: string[];
    description?: string;
    status?: 'stable' | 'legacy' | 'deprecated';
    replacement?: string;
}
