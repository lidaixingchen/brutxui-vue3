export type { RegistryComponentMeta, ComponentCategory, SidebarGroup, ComponentKind } from './types.js';
export { COMPONENTS } from './components.js';
export type { ComponentMetadataEntry } from './component-metadata.js';
export {
    COMPONENT_METADATA,
    AVAILABLE_COMPONENTS,
    COMPONENTS_BY_CATEGORY,
    getComponentsByCategory,
} from './component-metadata.js';
export type {
    ComponentFileManifest,
    MergedRegistryEntry,
    RegistryManifest,
} from './registry-manifest.types.js';
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
export type { SidebarLocale, SidebarItem } from './sidebar-generator.js';
export {
    generateComponentsSidebar,
    generateBlocksSidebar,
} from './sidebar-generator.js';
export type { ThemeMode, ThemeTokens } from './design-tokens.js';
export {
    BASE_THEME,
    CSS_VARS,
    toCssVars,
} from './design-tokens.js';
