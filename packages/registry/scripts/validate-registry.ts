import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    COMPONENT_REGISTRY,
    validateRegistryIndex,
    validateRegistryIntegrity,
    validateRegistryItem,
} from 'brutx-shared-vue';
import {
    findRegistryDependencyCycles,
    findUnknownRegistryReferences,
    formatRegistryDependencyGraph,
    validateComponentSourceFiles,
    validateGeneratedItemMatchesMetadata,
    validateRegistryManifestConsistency,
    type RegistryBuildManifestSnapshot,
    type RegistryReferenceItem,
} from './validate-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_DIR = path.resolve(__dirname, '../registry');
const UI_COMPONENTS_DIR = path.resolve(__dirname, '../../ui/src/components');
const UI_COMPOSABLES_DIR = path.resolve(__dirname, '../../ui/src/composables');
const UI_DIRECTIVES_DIR = path.resolve(__dirname, '../../ui/src/directives');

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
            console.error(`✗ [${name}.json] Exists in registry directory but is missing from index.json. Register it in COMPONENT_REGISTRY and run pnpm build.`);
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
    const registered = new Set(Object.keys(COMPONENT_REGISTRY));

    let sourceErrors = 0;

    for (const name of sourceDirs) {
        if (!registered.has(name)) {
            console.error(`✗ [${name}] Source directory exists at packages/ui/src/components/${name}/ but is not registered in COMPONENT_REGISTRY. Add an entry in shared metadata and run pnpm build.`);
            sourceErrors++;
        }
    }
    for (const name of registered) {
        if (!sourceDirs.has(name)) {
            console.error(`✗ [${name}] Registered in COMPONENT_REGISTRY but no source directory exists at packages/ui/src/components/${name}/.`);
            sourceErrors++;
        }
    }

    if (sourceErrors === 0) {
        console.log(`✓ Source directories are consistent with COMPONENT_REGISTRY (${sourceDirs.size} components).`);
    }

    return sourceErrors;
}

function validateComponentsSync(): number {
    const registryKeys = new Set(Object.keys(COMPONENT_REGISTRY));
    const composables = readRelativeFiles(UI_COMPOSABLES_DIR);
    const directives = readRelativeFiles(UI_DIRECTIVES_DIR);
    let syncErrors = 0;

    for (const [name, entry] of Object.entries(COMPONENT_REGISTRY)) {
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
        console.log(`✓ COMPONENT_REGISTRY metadata is valid (${registryKeys.size} components).`);
    }

    return syncErrors;
}

function validate() {
    console.log('🔍 Validating registry files...');

    if (!fs.existsSync(REGISTRY_DIR)) {
        console.error('✗ Registry directory does not exist! Run pnpm build first.');
        process.exit(1);
    }

    const files = fs.readdirSync(REGISTRY_DIR).filter((file: string) => file.endsWith('.json') && file !== 'index.json' && file !== 'registry-manifest.json');
    console.log(`📋 Found ${files.length} registry items to validate.`);

    const knownNames = new Set(files.map((f: string) => path.basename(f, '.json')));

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

            const metadata = COMPONENT_REGISTRY[data.name];
            if (metadata) {
                for (const error of validateGeneratedItemMatchesMetadata(data, metadata)) {
                    console.error(`✗ [${file}] ${error}.`);
                    errorCount++;
                }
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
                if (dep.includes('@radix-ui') || dep.includes('lucide-react') || dep.includes('react-hook-form') || dep.includes('cmdk') || dep.includes('react-day-picker')) {
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

    errorCount += validateIndexConsistency(files);
    errorCount += validateSourceConsistency();
    errorCount += validateComponentsSync();

    console.log(`\n📊 Total files across all registry items: ${totalFiles}`);

    if (errorCount > 0) {
        console.error(`\n❌ Validation failed with ${errorCount} errors.`);
        process.exit(1);
    } else {
        console.log('\n✅ All registry items passed validation successfully!');
    }
}

validate();
