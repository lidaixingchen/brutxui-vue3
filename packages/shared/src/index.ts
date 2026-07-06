export type { RegistryComponentMeta } from './types.js';
export { COMPONENTS, AVAILABLE_COMPONENTS } from './components.js';
export type { ComponentFileMapping } from './component-files.js';
export { COMPONENT_FILES } from './component-files.js';
export type { ComponentRegistryEntry } from './component-registry.js';
export {
    COMPONENT_REGISTRY,
    COMPONENTS_BY_CATEGORY,
    getComponentsByCategory,
} from './component-registry.js';
export type {
    RegistryFileType,
    RegistryFile,
    RegistryIndexFile,
    RegistryItem,
    RegistryIndexItem,
    RegistryIndex,
    ValidateRegistryItemOptions,
} from './registry.js';
export {
    REGISTRY_FILE_TYPES,
    computeRegistryIntegrity,
    validateRegistryIntegrity,
    validateRegistryItem,
    validateRegistryIndex,
} from './registry.js';
