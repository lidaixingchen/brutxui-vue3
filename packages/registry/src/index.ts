export type {
    FileEntry,
    FileStat,
    FileSystemAdapter,
    FsRemoveOptions,
} from './fs/file-system-adapter.js';
export { DiskFileSystemAdapter } from './fs/disk-fs.js';
export { MemoryFileSystemAdapter } from './fs/memory-fs.js';

export type {
    RewriteContext,
    CompilerPaths,
    RegistryBuildManifestItem,
    RegistryBuildManifest,
    RegistryBuildManifestOptions,
    SbomComponent,
    RegistrySbom,
    CompilerOptions,
    CompiledItemResult,
    CompiledRegistryResult,
    AstReplacementSpan,
} from './compiler/types.js';

export {
    extractScriptBlocksWithOffsets,
    resolveRewrittenSpecifier,
    rewriteImports,
    extractDeps,
    extractRegistryDeps,
    extractComponentFileDeps,
    extractUnknownRegistryDeps,
    assertKnownRegistryDeps,
    getFileType,
    extractClassifiedModuleSpecifiers,
    extractModuleSpecifiers,
} from './compiler/ast-rewriter.js';

export { DependencyResolver, type ResolvedComponentClosure } from './compiler/dependency-resolver.js';
export { CacheManager, CACHE_VERSION } from './compiler/cache-manager.js';
export { RegistryCompiler } from './compiler/registry-compiler.js';

export {
    SBOM_SPEC_VERSION,
    SBOM_FORMAT,
    type SbomGeneratorOptions,
    buildRegistrySbom,
    computeSbomIntegrity,
    computeSbomSerialNumber,
} from './emitters/sbom-generator.js';

export {
    PRIVATE_KEY_ENV,
    KEY_ID_ENV,
    createPrivateKeyFromInput,
    signManifest,
    signManifestFromEnv,
    verifyManifestSignature,
} from './emitters/manifest-signer.js';

export {
    DiskEmitter,
    type EmitOptions,
    type EmitResult,
} from './emitters/disk-emitter.js';

export {
    BenchmarkTracker,
    type BenchmarkMetrics,
} from './runner/benchmark-tracker.js';

export {
    WATCH_DEBOUNCE_MS,
    WATCHED_EXTENSIONS,
    RegistryWatcher,
    type WatcherOptions,
} from './runner/watcher.js';

export {
    runBuild,
    runWatch,
    getDefaultPaths,
    type RunnerOptions,
} from './runner/build-runner.js';
