import type {
    ComponentMetadataEntry,
    MergedRegistryEntry,
    RegistryIndex,
    RegistryIndexItem,
    RegistryItem,
    RegistryManifest,
} from 'brutx-shared-vue';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';

export type RewriteContext = 'component' | 'composable' | 'lib' | 'directive' | 'locale';

export interface CompilerPaths {
    componentsDir: string;
    composablesDir: string;
    localesDir: string;
    libDir: string;
    directivesDir: string;
    manifestPath: string;
    outputDir: string;
}

export interface RegistryBuildManifestItem {
    integrity: string;
    fileCount: number;
    dependencies: string[];
    registryDependencies: string[];
    category?: RegistryIndexItem['category'];
    examples?: string[];
    status?: RegistryIndexItem['status'];
    replacement?: string;
}

export interface RegistryBuildManifest {
    $schema: string;
    name: string;
    schemaVersion: number;
    registryVersion: string;
    buildTimestamp: string | null;
    gitCommit: string | null;
    integrity: string;
    itemCount: number;
    items: Record<string, RegistryBuildManifestItem>;
    signature?: string;
    keyId?: string;
}

export interface RegistryBuildManifestOptions {
    registryVersion: string;
    schemaVersion?: number;
    buildTimestamp?: string | null;
    gitCommit?: string | null;
}

export interface SbomComponent {
    'bom-ref': string;
    type: 'application' | 'library';
    name: string;
    version?: string;
    description?: string;
    hashes?: Array<{ alg: 'SHA-256'; content: string }>;
    dependencies?: string[];
}

export interface RegistrySbom {
    $schema: string;
    bomFormat: string;
    specVersion: string;
    version: number;
    serialNumber: string;
    metadata: {
        timestamp: string | null;
        tools: Array<{ vendor: string; name: string; version: string }>;
        component: { 'bom-ref': string; type: 'application'; name: string; version: string };
    };
    components: SbomComponent[];
    integrity: string;
    manifestIntegrity: string;
}

export interface CompilerOptions {
    fs?: FileSystemAdapter;
    paths?: Partial<CompilerPaths>;
    tailwindConfig?: Record<string, unknown>;
    cssVars?: Record<string, string>;
    libExclude?: ReadonlySet<string>;
    manifestOverrides?: Record<string, Partial<Pick<MergedRegistryEntry, 'directives' | 'composables' | 'lib'>>>;
    metadata?: Record<string, ComponentMetadataEntry>;
    manifest?: RegistryManifest;
}

export interface CompiledItemResult {
    name: string;
    item: RegistryItem;
    sourceHash: string;
    cached: boolean;
    durationMs: number;
}

export interface CompiledRegistryResult {
    index: RegistryIndex;
    manifest: RegistryBuildManifest;
    sbom: RegistrySbom;
    items: Map<string, RegistryItem>;
    itemResults: CompiledItemResult[];
    cacheRecord: Record<string, string>;
    totalDurationMs: number;
}

export interface AstReplacementSpan {
    start: number;
    end: number;
    replacement: string;
}
