import { COMPONENT_FILES, type ComponentFileMapping } from './component-files.js';
import { COMPONENTS } from './components.js';
import type { RegistryComponentMeta } from './types.js';

export interface ComponentRegistryEntry extends RegistryComponentMeta, ComponentFileMapping {
    name: string;
}

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
        };
    }

    for (const name of Object.keys(COMPONENTS)) {
        if (!registry[name]) {
            throw new Error(`Missing component file mapping for "${name}".`);
        }
    }

    return registry;
}
