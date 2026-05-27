import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_DIR = path.resolve(__dirname, '../registry');

function validate() {
    console.log('🔍 Validating registry files...');

    if (!fs.existsSync(REGISTRY_DIR)) {
        console.error('✗ Registry directory does not exist! Run pnpm build first.');
        process.exit(1);
    }

    const files = fs.readdirSync(REGISTRY_DIR).filter(file => file.endsWith('.json') && file !== 'index.json');
    console.log(`📋 Found ${files.length} registry items to validate.`);

    let errorCount = 0;

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
                for (const fileObj of data.files) {
                    if (!fileObj.path || !fileObj.content) {
                        console.error(`✗ [${file}] Invalid file object in files array.`);
                        errorCount++;
                    }
                }
            }

            if (!Array.isArray(data.dependencies)) {
                console.error(`✗ [${file}] dependencies must be an array.`);
                errorCount++;
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

        } catch (err: any) {
            console.error(`✗ [${file}] Failed to parse JSON:`, err.message || err);
            errorCount++;
        }
    }

    if (errorCount > 0) {
        console.error(`\n❌ Validation failed with ${errorCount} errors.`);
        process.exit(1);
    } else {
        console.log('\n✅ All registry items passed validation successfully!');
    }
}

validate();
