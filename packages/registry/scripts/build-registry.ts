import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMPONENTS } from 'brutx-shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_COMPONENTS_DIR = path.resolve(__dirname, '../../ui/src/components');
const OUTPUT_DIR = path.resolve(__dirname, '../registry');

/**
 * Reads component source with canonical LF newlines for registry payloads.
 *
 * @param filePath - Component source file path.
 * @returns Source code normalized for JSON registry content.
 */
function readComponentSource(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
}

async function run() {
    console.log('🚀 Starting registry build...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const componentNames = Object.keys(COMPONENTS);
    console.log(`📦 Found ${componentNames.length} components to process.`);

    const registryIndex: Record<string, any> = {
        name: 'brutx',
        homepage: 'https://brutxui.site',
        items: []
    };

    for (const name of componentNames) {
        try {
            const componentInfo = COMPONENTS[name];
            const componentFilePath = path.join(UI_COMPONENTS_DIR, `${name}.tsx`);

            if (!fs.existsSync(componentFilePath)) {
                throw new Error(`Source file not found at ${componentFilePath}`);
            }

            let code = readComponentSource(componentFilePath);

            code = code.replace(/['"]\.\.\/lib\/utils['"]/g, "'@/lib/utils'");
            code = code.replace(/['"]\.\.\/\.\.\/lib\/utils['"]/g, "'@/lib/utils'");

            for (const otherName of componentNames) {
                const relativeImportRegex = new RegExp(`(['"])\\.\\/${otherName}(['"])`, 'g');
                code = code.replace(relativeImportRegex, `$1@/components/ui/${otherName}$2`);
            }

            const registryDeps = new Set<string>();
            const matches = code.match(/@\/components\/ui\/([a-zA-Z0-9-]+)/g);
            if (matches) {
                for (const match of matches) {
                    const depName = match.replace('@/components/ui/', '');
                    if (depName !== name && componentNames.includes(depName)) {
                        registryDeps.add(depName);
                    }
                }
            }

            const title = name
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            const description = `A highly customizable neo-brutalist ${title} component built with Brutx design tokens.`;

            const tailwind = {
                config: {
                    theme: {
                        extend: {
                            borderWidth: {
                                '3': 'var(--brutal-border-width, 3px)'
                            },
                            borderColor: {
                                brutal: 'var(--brutal-border-color, #000000)'
                            },
                            borderRadius: {
                                brutal: 'var(--brutal-radius, 0px)'
                            },
                            colors: {
                                'brutal-bg': 'var(--brutal-bg, #ffffff)',
                                'brutal-fg': 'var(--brutal-fg, #000000)',
                                'brutal-primary': 'var(--brutal-primary, #FF6B6B)',
                                'brutal-secondary': 'var(--brutal-secondary, #4ECDC4)',
                                'brutal-accent': 'var(--brutal-accent, #FFE66D)',
                                'brutal-destructive': 'var(--brutal-destructive, #EF476F)',
                                'brutal-success': 'var(--brutal-success, #7FB069)',
                                'brutal-muted': 'var(--brutal-muted, #f3f4f6)',
                                'brutal-ring': 'var(--brutal-ring, #000000)'
                            },
                            boxShadow: {
                                brutal: 'var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-shadow-color, #000000)',
                                'brutal-sm': 'calc(var(--brutal-shadow-offset-x, 4px) / 2) calc(var(--brutal-shadow-offset-y, 4px) / 2) 0px 0px var(--brutal-shadow-color, #000000)',
                                'brutal-lg': 'calc(var(--brutal-shadow-offset-x, 4px) * 1.5) calc(var(--brutal-shadow-offset-y, 4px) * 1.5) 0px 0px var(--brutal-shadow-color, #000000)',
                                'brutal-xl': 'calc(var(--brutal-shadow-offset-x, 4px) * 2) calc(var(--brutal-shadow-offset-y, 4px) * 2) 0px 0px var(--brutal-shadow-color, #000000)'
                            }
                        }
                    }
                }
            };

            const cssVars = {
                light: {
                    'brutal-border-width': '3px',
                    'brutal-border-color': '#000000',
                    'brutal-shadow-offset-x': '4px',
                    'brutal-shadow-offset-y': '4px',
                    'brutal-shadow-color': '#000000',
                    'brutal-radius': '0px',
                    'brutal-pressed-offset': '2px',
                    'brutal-bg': '#ffffff',
                    'brutal-fg': '#000000',
                    'brutal-primary': '#FF6B6B',
                    'brutal-secondary': '#4ECDC4',
                    'brutal-accent': '#FFE66D',
                    'brutal-destructive': '#EF476F',
                    'brutal-success': '#7FB069',
                    'brutal-muted': '#f3f4f6',
                    'brutal-ring': '#000000',
                    'brutal-info': '#4A90D9'
                },
                dark: {
                    'brutal-border-width': '3px',
                    'brutal-border-color': '#ffffff',
                    'brutal-shadow-offset-x': '4px',
                    'brutal-shadow-offset-y': '4px',
                    'brutal-shadow-color': '#ffffff',
                    'brutal-radius': '0px',
                    'brutal-pressed-offset': '2px',
                    'brutal-bg': '#111827',
                    'brutal-fg': '#ffffff',
                    'brutal-primary': '#FF6B6B',
                    'brutal-secondary': '#4ECDC4',
                    'brutal-accent': '#FFE66D',
                    'brutal-destructive': '#EF476F',
                    'brutal-success': '#7FB069',
                    'brutal-muted': '#1f2937',
                    'brutal-ring': '#ffffff',
                    'brutal-info': '#4A90D9'
                }
            };

            const registryItem = {
                $schema: 'https://ui.shadcn.com/schema/registry-item.json',
                name: name,
                type: 'registry:ui',
                title: title,
                description: description,
                dependencies: componentInfo.dependencies || [],
                registryDependencies: Array.from(registryDeps),
                files: [
                    {
                        path: `components/ui/${name}.tsx`,
                        content: code,
                        type: 'registry:ui'
                    }
                ],
                tailwind,
                cssVars
            };

            const outputPath = path.join(OUTPUT_DIR, `${name}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(registryItem, null, 2), 'utf-8');
            console.log(`✓ Generated ${name}.json (Registry dependencies: [${Array.from(registryDeps).join(', ')}])`);

            registryIndex.items.push({
                name: name,
                type: 'registry:ui',
                title: title,
                description: description,
                dependencies: componentInfo.dependencies || [],
                registryDependencies: Array.from(registryDeps),
                files: [
                    {
                        path: `components/ui/${name}.tsx`,
                        type: 'registry:ui'
                    }
                ],
                tailwind,
                cssVars
            });
        } catch (err: any) {
            console.error(`✗ Failed to process component ${name}:`, err.message || err);
        }
    }

    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(registryIndex, null, 2), 'utf-8');
    console.log('✓ Generated index.json');
    console.log('🎉 Registry built successfully!');
}

run().catch(console.error);
