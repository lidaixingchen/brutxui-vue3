import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    COMPONENT_METADATA,
    generateComponentsSidebar,
    generateBlocksSidebar,
    validateRegistryIndex,
    validateRegistryIntegrity,
    validateRegistryItem,
} from 'brutx-shared-vue';
import { loadMergedRegistry } from './build-registry.js';
import {
    findRegistryDependencyCycles,
    findUnknownRegistryReferences,
    formatRegistryDependencyGraph,
    formatDependencyGraphDot,
    formatDependencyGraphJson,
    validateComponentSourceFiles,
    validateDocsComponentPageCoverage,
    validateGeneratedItemMatchesMetadata,
    validateRegistryItemInternalImports,
    validateRegistryManifestConsistency,
    validateSidebarCoverage,
    type RegistryBuildManifestSnapshot,
    type RegistryReferenceItem,
} from './validate-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_DIR = path.resolve(__dirname, '../registry');
const UI_COMPONENTS_DIR = path.resolve(__dirname, '../../ui/src/components');
const UI_COMPOSABLES_DIR = path.resolve(__dirname, '../../ui/src/composables');
const UI_DIRECTIVES_DIR = path.resolve(__dirname, '../../ui/src/directives');
const DOCS_COMPONENTS_DIR = path.resolve(__dirname, '../../../apps/docs/components');
const DOCS_BLOCKS_DIR = path.resolve(__dirname, '../../../apps/docs/blocks');
const DOCS_EN_COMPONENTS_DIR = path.resolve(__dirname, '../../../apps/docs/en/components');
const DOCS_EN_BLOCKS_DIR = path.resolve(__dirname, '../../../apps/docs/en/blocks');

const DOCS_PAGE_ALIASES: Record<string, string> = {
    kanban: 'kanban-board',
};

const DOCS_PAGE_EXEMPTIONS = new Set([
    'input-adornment',
]);

function isReactDependency(dep: string): boolean {
    if (dep === 'react' || dep === 'react-dom' || dep === 'cmdk') return true;
    if (dep.startsWith('react-')) return true;
    if (dep.startsWith('next/')) return true;
    if (dep.includes('@radix-ui')) return true;
    if (dep.includes('lucide-react')) return true;
    if (dep.includes('/react')) return true;
    return false;
}

function readRelativeFiles(rootDir: string): Set<string> {
    const files = new Set<string>();

    if (!fs.existsSync(rootDir)) {
        return files;
    }

    function walk(currentDir: string, base: string): void {
        for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
            const fullPath = path.join(currentDir, entry.name);
            const relativePath = base ? `${base}/${entry.name}` : entry.name;

            if (entry.isDirectory()) {
                walk(fullPath, relativePath);
            } else {
                files.add(relativePath);
            }
        }
    }

    walk(rootDir, '');
    return files;
}

function readMarkdownPageSlugs(dirs: string[]): Set<string> {
    const slugs = new Set<string>();

    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            continue;
        }

        for (const file of fs.readdirSync(dir)) {
            if (file.endsWith('.md') && file !== 'index.md') {
                slugs.add(path.basename(file, '.md'));
            }
        }
    }

    return slugs;
}

function validateIndexConsistency(files: string[]): number {
    const indexPath = path.join(REGISTRY_DIR, 'index.json');
    const manifestPath = path.join(REGISTRY_DIR, 'registry-manifest.json');
    if (!fs.existsSync(indexPath)) {
        console.error('✗ index.json is missing. Run pnpm build first.');
        return 1;
    }

    let consistencyErrors = 0;
    let indexNames: Set<string>;
    try {
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        validateRegistryIndex(indexData);

        if (indexData.$schema !== 'https://ui.shadcn.com/schema/registry.json') {
            console.error(`✗ [index.json] Missing or invalid $schema. Expected "https://ui.shadcn.com/schema/registry.json", got "${indexData.$schema}".`);
            consistencyErrors++;
        }

        const items = Array.isArray(indexData?.items) ? indexData.items : [];
        const names = items.map((item: unknown) => (item as Record<string, unknown>)?.name).filter((n: unknown) => typeof n === 'string');
        const seen = new Set<string>();
        for (const n of names) {
            if (seen.has(n as string)) {
                console.error(`✗ [index.json] Duplicate item name "${n}".`);
                consistencyErrors++;
            }
            seen.add(n as string);
        }
        indexNames = new Set(names);

        if (fs.existsSync(manifestPath)) {
            const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as RegistryBuildManifestSnapshot;
            const manifestErrors = validateRegistryManifestConsistency(manifestData, indexData);

            for (const error of manifestErrors) {
                console.error(`✗ [registry-manifest.json] ${error}.`);
                consistencyErrors++;
            }
        }
    } catch (err: unknown) {
        console.error('✗ Failed to parse registry index or manifest:', err instanceof Error ? err.message : err);
        return 1;
    }

    const fileNames = new Set(files.map((f) => path.basename(f, '.json')));

    for (const name of fileNames) {
        if (!indexNames.has(name)) {
            console.error(`✗ [${name}.json] Exists in registry directory but is missing from index.json. Register it in COMPONENT_METADATA and run pnpm build.`);
            consistencyErrors++;
        }
    }
    for (const name of indexNames) {
        if (!fileNames.has(name)) {
            console.error(`✗ [${name}] Listed in index.json but no corresponding ${name}.json file exists in registry directory.`);
            consistencyErrors++;
        }
    }

    if (consistencyErrors === 0) {
        console.log(`✓ index.json is consistent with registry directory (${fileNames.size} items).`);
    }

    return consistencyErrors;
}

function validateSourceConsistency(): number {
    if (!fs.existsSync(UI_COMPONENTS_DIR)) {
        console.error(`✗ UI components source directory not found: ${UI_COMPONENTS_DIR}`);
        return 1;
    }

    const sourceDirs = new Set(
        fs.readdirSync(UI_COMPONENTS_DIR, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
    );
    const registered = new Set(Object.keys(COMPONENT_METADATA));

    let sourceErrors = 0;

    for (const name of sourceDirs) {
        if (!registered.has(name)) {
            console.error(`✗ [${name}] Source directory exists at packages/ui/src/components/${name}/ but is not registered in COMPONENT_METADATA. Add an entry in shared metadata and run pnpm build.`);
            sourceErrors++;
        }
    }
    for (const name of registered) {
        if (!sourceDirs.has(name)) {
            console.error(`✗ [${name}] Registered in COMPONENT_METADATA but no source directory exists at packages/ui/src/components/${name}/.`);
            sourceErrors++;
        }
    }

    if (sourceErrors === 0) {
        console.log(`✓ Source directories are consistent with COMPONENT_METADATA (${sourceDirs.size} components).`);
    }

    return sourceErrors;
}

function validateComponentsSync(): number {
    const mergedRegistry = loadMergedRegistry();
    const registryKeys = new Set(Object.keys(mergedRegistry));
    const composables = readRelativeFiles(UI_COMPOSABLES_DIR);
    const directives = readRelativeFiles(UI_DIRECTIVES_DIR);
    let syncErrors = 0;

    for (const [name, entry] of Object.entries(mergedRegistry)) {
        const componentFiles = readRelativeFiles(path.join(UI_COMPONENTS_DIR, name));
        const errors = validateComponentSourceFiles(name, entry, {
            componentFiles,
            composables,
            directives,
        });

        for (const error of errors) {
            console.error(`✗ ${error}.`);
            syncErrors++;
        }
    }

    if (syncErrors === 0) {
        console.log(`✓ Registry manifest is valid (${registryKeys.size} components).`);
    }

    return syncErrors;
}

function validateDocsCoverage(): number {
    const componentNames = Object.keys(COMPONENT_METADATA);
    const locales = [
        {
            locale: 'zh-CN',
            pageSlugs: readMarkdownPageSlugs([DOCS_COMPONENTS_DIR, DOCS_BLOCKS_DIR]),
        },
        {
            locale: 'en',
            pageSlugs: readMarkdownPageSlugs([DOCS_EN_COMPONENTS_DIR, DOCS_EN_BLOCKS_DIR]),
        },
    ];
    let docsErrors = 0;

    for (const locale of locales) {
        const errors = validateDocsComponentPageCoverage({
            locale: locale.locale,
            componentNames,
            pageSlugs: locale.pageSlugs,
            aliases: DOCS_PAGE_ALIASES,
            exemptions: DOCS_PAGE_EXEMPTIONS,
        });

        for (const error of errors) {
            console.error(`✗ ${error}.`);
            docsErrors++;
        }
    }

    if (docsErrors === 0) {
        console.log(`✓ Docs component pages cover COMPONENT_METADATA (${componentNames.length} components).`);
    }

    return docsErrors;
}

function validateSidebar(): number {
    const entries = Object.values(COMPONENT_METADATA);
    const checks: Array<{ locale: 'zh' | 'en'; section: 'components' | 'blocks'; items: ReturnType<typeof generateComponentsSidebar> }> = [
        { locale: 'zh', section: 'components', items: generateComponentsSidebar('zh') },
        { locale: 'en', section: 'components', items: generateComponentsSidebar('en') },
        { locale: 'zh', section: 'blocks', items: generateBlocksSidebar('zh') },
        { locale: 'en', section: 'blocks', items: generateBlocksSidebar('en') },
    ];

    let sidebarErrors = 0;
    for (const check of checks) {
        for (const error of validateSidebarCoverage({
            locale: check.locale,
            section: check.section,
            sidebarItems: check.items,
            entries,
        })) {
            console.error(`✗ ${error}.`);
            sidebarErrors++;
        }
    }

    if (sidebarErrors === 0) {
        console.log(`✓ Sidebar coverage is consistent with COMPONENT_METADATA (zh/en × components/blocks).`);
    }

    return sidebarErrors;
}

function parseArgs(argv: string[]): { graph: boolean } {
    return {
        graph: argv.includes('--graph'),
    };
}

function writeGraphArtifacts(referenceItems: RegistryReferenceItem[]): void {
    const dotPath = path.join(REGISTRY_DIR, 'deps.dot');
    const jsonPath = path.join(REGISTRY_DIR, 'deps.json');

    const dot = formatDependencyGraphDot(referenceItems);
    const json = JSON.stringify(formatDependencyGraphJson(referenceItems), null, 2);

    fs.writeFileSync(dotPath, dot + '\n', 'utf-8');
    fs.writeFileSync(jsonPath, json + '\n', 'utf-8');

    const edgeCount = JSON.parse(json).edges.length;
    console.log(`✓ Wrote dependency graph: ${dotPath} (DOT, ${referenceItems.length} nodes)`);
    console.log(`✓ Wrote dependency graph: ${jsonPath} (JSON, ${edgeCount} edges)`);
}

function validate() {
    const args = parseArgs(process.argv.slice(2));

    console.log('🔍 Validating registry files...');

    if (!fs.existsSync(REGISTRY_DIR)) {
        console.error('✗ Registry directory does not exist! Run pnpm build first.');
        process.exit(1);
    }

    const files = fs.readdirSync(REGISTRY_DIR).filter((file: string) => file.endsWith('.json') && file !== 'index.json' && file !== 'registry-manifest.json');
    console.log(`📋 Found ${files.length} registry items to validate.`);

    const knownNames = new Set(files.map((f: string) => path.basename(f, '.json')));
    const mergedRegistry = loadMergedRegistry();

    let errorCount = 0;
    let totalFiles = 0;
    const referenceItems: RegistryReferenceItem[] = [];

    for (const file of files) {
        const filePath = path.join(REGISTRY_DIR, file);
        const nameWithoutExtension = path.basename(file, '.json');

        try {
            const rawContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(rawContent);
            validateRegistryItem(data, { name: nameWithoutExtension, requireSchema: true });

            if (data.name !== nameWithoutExtension) {
                console.error(`✗ [${file}] Name field "${data.name}" does not match filename "${nameWithoutExtension}".`);
                errorCount++;
            }

            const mergedEntry = mergedRegistry[data.name];
            if (mergedEntry) {
                for (const error of validateGeneratedItemMatchesMetadata(data, mergedEntry)) {
                    console.error(`✗ [${file}] ${error}.`);
                    errorCount++;
                }
            }

            for (const error of validateRegistryItemInternalImports(data)) {
                console.error(`✗ [${file}] ${error}.`);
                errorCount++;
            }

            referenceItems.push({
                name: data.name,
                registryDependencies: data.registryDependencies,
            });

            totalFiles += data.files.length;
            for (const fileObj of data.files) {
                if (!fileObj.path.startsWith(`components/ui/${data.name}/`) && !fileObj.path.startsWith('composables/') && !fileObj.path.startsWith('locales/') && !fileObj.path.startsWith('lib/') && !fileObj.path.startsWith('directives/')) {
                    console.error(`✗ [${file}] File path "${fileObj.path}" does not match expected pattern "components/ui/${data.name}/", "composables/", "locales/", "lib/", or "directives/".`);
                    errorCount++;
                }
            }

            const seenDeps = new Set<string>();
            for (const dep of data.dependencies) {
                if (seenDeps.has(dep)) {
                    console.error(`✗ [${file}] Duplicate dependency "${dep}".`);
                    errorCount++;
                }
                seenDeps.add(dep);
                if (isReactDependency(dep)) {
                    console.error(`✗ [${file}] Found React dependency "${dep}" — should be Vue equivalent.`);
                    errorCount++;
                }
            }

            if (data.replacement && !knownNames.has(data.replacement)) {
                console.error(`✗ [${file}] replacement "${data.replacement}" does not reference an existing registry item.`);
                errorCount++;
            }

            validateRegistryIntegrity(data, nameWithoutExtension);

        } catch (err: unknown) {
            console.error(`✗ [${file}] Failed to validate JSON:`, err instanceof Error ? err.message : err);
            errorCount++;
        }
    }

    for (const reference of findUnknownRegistryReferences(referenceItems)) {
        console.error(`✗ [${reference.component}.json] registryDependency "${reference.dependency}" does not reference an existing registry item.`);
        errorCount++;
    }

    for (const cycle of findRegistryDependencyCycles(referenceItems)) {
        console.error(`✗ Registry dependency cycle detected: ${cycle.join(' -> ')}.`);
        errorCount++;
    }

    if (process.env.BRUTX_REGISTRY_PRINT_GRAPH === '1') {
        console.log('\n🕸 Registry dependency graph:');
        for (const line of formatRegistryDependencyGraph(referenceItems)) {
            console.log(`  ${line}`);
        }
    }

    if (args.graph) {
        writeGraphArtifacts(referenceItems);
    }

    errorCount += validateIndexConsistency(files);
    errorCount += validateSourceConsistency();
    errorCount += validateComponentsSync();
    errorCount += validateDocsCoverage();
    errorCount += validateSidebar();

    console.log(`\n📊 Total files across all registry items: ${totalFiles}`);

    if (errorCount > 0) {
        console.error(`\n❌ Validation failed with ${errorCount} errors.`);
        process.exit(1);
    } else {
        console.log('\n✅ All registry items passed validation successfully!');
    }
}

validate();
