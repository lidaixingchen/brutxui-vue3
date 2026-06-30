import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMPONENT_FILES } from './component-files';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_DIR = path.resolve(__dirname, '../registry');
const UI_COMPONENTS_DIR = path.resolve(__dirname, '../../ui/src/components');

function validateIndexConsistency(files: string[]): number {
    const indexPath = path.join(REGISTRY_DIR, 'index.json');
    if (!fs.existsSync(indexPath)) {
        console.error('✗ index.json is missing. Run pnpm build first.');
        return 1;
    }

    let indexNames: Set<string>;
    try {
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        const items = Array.isArray(indexData?.items) ? indexData.items : [];
        indexNames = new Set(items.map((item: unknown) => (item as Record<string, unknown>)?.name).filter((n: unknown) => typeof n === 'string'));
    } catch (err: unknown) {
        console.error('✗ Failed to parse index.json:', err instanceof Error ? err.message : err);
        return 1;
    }

    const fileNames = new Set(files.map((f) => path.basename(f, '.json')));
    let consistencyErrors = 0;

    for (const name of fileNames) {
        if (!indexNames.has(name)) {
            console.error(`✗ [${name}.json] Exists in registry directory but is missing from index.json. Register it in COMPONENT_FILES and run pnpm build.`);
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
    const registered = new Set(Object.keys(COMPONENT_FILES));

    let sourceErrors = 0;

    for (const name of sourceDirs) {
        if (!registered.has(name)) {
            console.error(`✗ [${name}] Source directory exists at packages/ui/src/components/${name}/ but is not registered in COMPONENT_FILES. Add an entry and run pnpm build.`);
            sourceErrors++;
        }
    }
    for (const name of registered) {
        if (!sourceDirs.has(name)) {
            console.error(`✗ [${name}] Registered in COMPONENT_FILES but no source directory exists at packages/ui/src/components/${name}/.`);
            sourceErrors++;
        }
    }

    if (sourceErrors === 0) {
        console.log(`✓ Source directories are consistent with COMPONENT_FILES (${sourceDirs.size} components).`);
    }

    return sourceErrors;
}

function validate() {
    console.log('🔍 Validating registry files...');

    if (!fs.existsSync(REGISTRY_DIR)) {
        console.error('✗ Registry directory does not exist! Run pnpm build first.');
        process.exit(1);
    }

    const files = fs.readdirSync(REGISTRY_DIR).filter((file: string) => file.endsWith('.json') && file !== 'index.json');
    console.log(`📋 Found ${files.length} registry items to validate.`);

    let errorCount = 0;
    let totalFiles = 0;

    for (const file of files) {
        const filePath = path.join(REGISTRY_DIR, file);
        const nameWithoutExtension = path.basename(file, '.json');

        try {
            const rawContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(rawContent);

            if (data.$schema !== 'https://ui.shadcn.com/schema/registry-item.json') {
                console.error(`✗ [${file}] Missing or invalid $schema header.`);
                errorCount++;
            }

            if (data.name !== nameWithoutExtension) {
                console.error(`✗ [${file}] Name field "${data.name}" does not match filename "${nameWithoutExtension}".`);
                errorCount++;
            }

            if (typeof data.type !== 'string' || !data.type.startsWith('registry:')) {
                console.error(`✗ [${file}] Missing or invalid type field.`);
                errorCount++;
            }

            if (!data.title || typeof data.title !== 'string') {
                console.error(`✗ [${file}] Missing or invalid title.`);
                errorCount++;
            }
            if (!data.description || typeof data.description !== 'string') {
                console.error(`✗ [${file}] Missing or invalid description.`);
                errorCount++;
            }

            if (!Array.isArray(data.files) || data.files.length === 0) {
                console.error(`✗ [${file}] files array is missing or empty.`);
                errorCount++;
            } else {
                totalFiles += data.files.length;
                for (const fileObj of data.files) {
                    if (!fileObj.path || !fileObj.content) {
                        console.error(`✗ [${file}] Invalid file object in files array (missing path or content).`);
                        errorCount++;
                    }

                    if (!fileObj.path.startsWith(`components/ui/${data.name}/`) && !fileObj.path.startsWith('composables/') && !fileObj.path.startsWith('locales/') && !fileObj.path.startsWith('lib/')) {
                        console.error(`✗ [${file}] File path "${fileObj.path}" does not match expected pattern "components/ui/${data.name}/", "composables/", "locales/", or "lib/".`);
                        errorCount++;
                    }
                }
            }

            if (!Array.isArray(data.dependencies)) {
                console.error(`✗ [${file}] dependencies must be an array.`);
                errorCount++;
            } else {
                for (const dep of data.dependencies) {
                    if (dep.includes('@radix-ui') || dep.includes('lucide-react') || dep.includes('react-hook-form') || dep.includes('cmdk') || dep.includes('react-day-picker')) {
                        console.error(`✗ [${file}] Found React dependency "${dep}" — should be Vue equivalent.`);
                        errorCount++;
                    }
                }
            }
            if (!Array.isArray(data.registryDependencies)) {
                console.error(`✗ [${file}] registryDependencies must be an array.`);
                errorCount++;
            }

            if (!data.tailwind || typeof data.tailwind !== 'object') {
                console.error(`✗ [${file}] Missing or invalid tailwind block.`);
                errorCount++;
            }
            if (!data.cssVars || typeof data.cssVars !== 'object') {
                console.error(`✗ [${file}] Missing or invalid cssVars block.`);
                errorCount++;
            }

        } catch (err: unknown) {
            console.error(`✗ [${file}] Failed to parse JSON:`, err instanceof Error ? err.message : err);
            errorCount++;
        }
    }

    errorCount += validateIndexConsistency(files);
    errorCount += validateSourceConsistency();

    console.log(`\n📊 Total files across all registry items: ${totalFiles}`);

    if (errorCount > 0) {
        console.error(`\n❌ Validation failed with ${errorCount} errors.`);
        process.exit(1);
    } else {
        console.log('\n✅ All registry items passed validation successfully!');
    }
}

validate();
