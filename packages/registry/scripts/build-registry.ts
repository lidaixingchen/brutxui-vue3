import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants & Templates paths
const CLI_LIB_PATH = path.resolve(__dirname, '../../cli/src/lib/constants.ts');
const CLI_TEMPLATES_PATH = path.resolve(__dirname, '../../cli/src/templates/index.ts');
const OUTPUT_DIR = path.resolve(__dirname, '../registry');

// Function to resolve ESM imports dynamically or via standard reading
async function run() {
    console.log('🚀 Starting registry build...');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Dynamic imports since we are using tsx
    const { COMPONENTS } = await import('../../cli/src/lib/constants.ts');
    const { getComponentTemplate } = await import('../../cli/src/templates/index.ts');

    const componentNames = Object.keys(COMPONENTS);
    console.log(`📦 Found ${componentNames.length} components to process.`);

    const registryIndex: Record<string, any> = {
        name: 'brutalist-ui',
        homepage: 'https://brutalistui.site',
        items: []
    };

    for (const name of componentNames) {
        try {
            const componentInfo = COMPONENTS[name];
            // Call template with the default shadcn/ui utils alias placeholder: "@/lib/utils"
            const code = getComponentTemplate(name, '@/lib/utils');

            // Detect registry dependencies using regex
            const registryDeps = new Set<string>();
            const matches = code.match(/@\/components\/ui\/([a-zA-Z0-9-]+)/g);
            if (matches) {
                for (const match of matches) {
                    const depName = match.replace('@/components/ui/', '');
                    // Normalize cases if any, and avoid self-dependency
                    if (depName !== name && componentNames.includes(depName)) {
                        registryDeps.add(depName);
                    }
                }
            }

            const registryItem = {
                name: name,
                type: 'registry:ui',
                dependencies: componentInfo.dependencies || [],
                registryDependencies: Array.from(registryDeps),
                files: [
                    {
                        path: `components/ui/${name}.tsx`,
                        content: code
                    }
                ]
            };

            // Write individual component registry file
            const outputPath = path.join(OUTPUT_DIR, `${name}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(registryItem, null, 2), 'utf-8');
            console.log(`✓ Generated ${name}.json (Registry dependencies: [${Array.from(registryDeps).join(', ')}])`);

            // Add to registry index
            registryIndex.items.push({
                name: name,
                type: 'registry:ui',
                dependencies: componentInfo.dependencies || [],
                registryDependencies: Array.from(registryDeps),
                files: [
                    {
                        path: `components/ui/${name}.tsx`
                    }
                ]
            });
        } catch (err) {
            console.error(`✗ Failed to process component ${name}:`, err);
        }
    }

    // Write registry index file
    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(registryIndex, null, 2), 'utf-8');
    console.log('✓ Generated index.json');
    console.log('🎉 Registry built successfully!');
}

run().catch(console.error);
