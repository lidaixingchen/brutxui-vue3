import type { ComponentMetadataEntry } from './component-metadata.js';

export interface ComponentFileManifest {
    files: string[];
    composables: string[];
    directives: string[];
    lib: string[];
}

export interface MergedRegistryEntry extends ComponentMetadataEntry, ComponentFileManifest {}

export type RegistryManifest = Record<string, ComponentFileManifest>;
