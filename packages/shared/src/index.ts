export type { RegistryComponentMeta, ComponentCategory, SidebarGroup, ComponentKind } from './types.js';
export { COMPONENTS } from './components.js';
export type { ComponentMetadataEntry } from './component-metadata.js';
export {
    COMPONENT_METADATA,
    AVAILABLE_COMPONENTS,
    COMPONENTS_BY_CATEGORY,
    getComponentsByCategory,
    CATEGORY_LABELS_ZH,
    CATEGORY_LABELS_EN,
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
    REGISTRY_ITEM_SCHEMA_URL,
    RegistryIntegrityMismatchError,
    computeRegistryIntegrity,
    computeRegistryManifestIntegrity,
    validateRegistryIntegrity,
    validateRegistryItem,
    validateRegistryIndex,
} from './registry.js';
export type {
    RegistryManifestIntegrityInput,
} from './registry.js';
export type { SidebarLocale, SidebarItem } from './sidebar-generator.js';
export {
    generateComponentsSidebar,
    generateBlocksSidebar,
} from './sidebar-generator.js';
export type {
    ThemeMode,
    ThemeTokens,
    ThemePresetOverrides,
    SubtleColorDef,
    ShadowTokenDefinition,
} from './design-tokens.js';
export {
    BASE_THEME,
    THEME_PRESETS,
    TOKEN_TO_CSS_VAR,
    CSS_VARS,
    toCssVars,
    FONT_STACK_PARTS,
    FONT_STACK,
    EASING_TOKENS,
    SUBTLE_COLOR_DEFS,
    SHADOW_DEFINITIONS,
    NON_COLOR_TOKEN_KEYS,
    BRUTAL_COLOR_NAMES,
} from './design-tokens.js';


