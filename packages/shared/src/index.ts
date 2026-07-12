export type { RegistryComponentMeta, ComponentCategory, SidebarGroup, ComponentKind } from './types.js';
export { COMPONENTS } from './components.js';
export type { ComponentFileMapping } from './component-files.js';
export { COMPONENT_FILES } from './component-files.js';
export type { ComponentRegistryEntry } from './component-registry.js';
export {
    AVAILABLE_COMPONENTS,
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
