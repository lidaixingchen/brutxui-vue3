import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMPONENT_METADATA } from 'brutx-shared-vue';
import { scanComponentFiles } from 'brutx-shared-vue/scan';
import { validateRegistryItemInternalImports } from '../../scripts/validate-utils.js';
import { MemoryFileSystemAdapter } from '../../src/fs/memory-fs.js';
import { createRegistryCompiler } from '../../src/runner/build-runner.js';

describe('Registry component alias compilation', () => {
    it.each(['disk', 'VFS'])('uses the same source paths for manifest generation and %s registry delivery', async backend => {
        const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-registry-imports-'));
        try {
            const paths = {
                componentsDir: path.join(rootDir, 'src/components'),
                composablesDir: path.join(rootDir, 'src/composables'),
                directivesDir: path.join(rootDir, 'src/directives'),
                localesDir: path.join(rootDir, 'src/locales'),
                libDir: path.join(rootDir, 'src/lib'),
                typesDir: path.join(rootDir, 'src/types'),
                manifestPath: path.join(rootDir, 'registry-manifest.json'),
                outputDir: path.join(rootDir, 'registry'),
            };
            const sources = {
                'tsconfig.json': JSON.stringify({
                    compilerOptions: { paths: { '@/*': ['./src/*'] } },
                }),
                'src/components/button/Button.vue': [
                    '<script setup lang="ts">',
                    'import { adapter } from "../../lib/adapter.js";',
                    'import { Badge } from "@/components/ui/badge";',
                    'import { wrap } from "./sub";',
                    'import { variant } from "./helper.variant";',
                    'import svg from "./icon.svg?raw";',
                    'import styles from "./button.css?raw";',
                    'void adapter;',
                    'void Badge;',
                    'void wrap;',
                    'void variant;',
                    'void svg;',
                    'void styles;',
                    '</script>',
                ].join('\n'),
                'src/components/button/helper.variant.ts': 'export const variant = "dotted";',
                'src/components/button/icon.svg': '<svg>\r\n<text>合法替换字符 �</text>\r\n</svg>',
                'src/components/button/button.css': '.button { color: red; }\r\n',
                'src/components/button/sub/index.ts': 'export { wrap } from "./wrap";',
                'src/components/button/sub/wrap.ts': [
                    'import { helper } from "./helper";',
                    'import Badge from "../../badge/Badge.vue";',
                    'export const wrap = [helper, Badge];',
                ].join('\n'),
                'src/components/button/sub/helper.ts': 'export const helper = "nested";',
                'src/components/button/helper.ts': 'export const helper = "root";',
                'src/components/badge/Badge.vue': '<template><span /></template>',
                'src/lib/adapter.ts': 'export { helper as adapter } from "./sub/helper.js";',
                'src/lib/sub/helper.ts': 'export { helper } from "@/composables/sub/helper";',
                'src/composables/sub/helper.ts': 'export const helper = "composable";',
            };
            for (const [relativePath, content] of Object.entries(sources)) {
                const filename = path.join(rootDir, relativePath);
                fs.mkdirSync(path.dirname(filename), { recursive: true });
                fs.writeFileSync(filename, content);
            }
            const manifest = scanComponentFiles(paths);
            expect(manifest.button.lib).toEqual(['adapter.ts']);
            fs.writeFileSync(paths.manifestPath, JSON.stringify(manifest));

            const vfs = backend === 'VFS' ? new MemoryFileSystemAdapter({
                ...Object.fromEntries(Object.entries(sources).map(([relativePath, content]) =>
                    [path.join(rootDir, relativePath), content],
                )),
                [paths.manifestPath]: JSON.stringify(manifest),
            }) : undefined;
            const { compiler } = await createRegistryCompiler({
                fs: vfs,
                paths,
                metadata: { button: COMPONENT_METADATA.button, badge: COMPONENT_METADATA.badge },
                publicProjection: {
                    button: {
                        componentId: 'button',
                        exports: [{ source: './Button.vue', sourceName: 'default', publicName: 'Button', kind: 'value' }],
                    },
                    badge: {
                        componentId: 'badge',
                        exports: [{ source: './Badge.vue', sourceName: 'default', publicName: 'Badge', kind: 'value' }],
                    },
                },
            });
            const { items } = await compiler.compileAll();
            const item = items.get('button')!;
            const files = new Map(item.files.map(file => [file.path, file.content]));

            expect(files.get('components/ui/button/Button.vue')).toContain('from "@/lib/adapter.js"');
            expect(files.get('components/ui/button/Button.vue')).toContain('from "@/components/ui/button/sub/index"');
            expect(files.get('components/ui/button/Button.vue')).toContain('from "@/components/ui/badge"');
            expect(files.get('components/ui/button/Button.vue')).toContain('from "@/components/ui/button/helper.variant"');
            expect(files.get('components/ui/button/Button.vue')).toContain('from "@/components/ui/button/icon.svg?raw"');
            expect(files.get('components/ui/button/icon.svg')).toBe(sources['src/components/button/icon.svg']);
            expect(files.get('components/ui/button/Button.vue')).toContain('from "@/components/ui/button/button.css?raw"');
            expect(files.get('components/ui/button/button.css')).toBe(sources['src/components/button/button.css']);
            expect(files.get('components/ui/button/sub/index.ts')).toContain('from "@/components/ui/button/sub/wrap"');
            expect(files.get('components/ui/button/sub/wrap.ts')).toContain('from "@/components/ui/button/sub/helper"');
            expect(files.get('components/ui/button/sub/wrap.ts')).toContain('from "@/components/ui/badge/Badge.vue"');
            expect(files.get('lib/adapter.ts')).toContain('from "@/lib/sub/helper.js"');
            expect(files.get('lib/sub/helper.ts')).toContain('from "@/composables/sub/helper"');
            expect(files.get('composables/sub/helper.ts')).toContain('export const helper');
            expect(item.registryDependencies).toContain('badge');
            expect(items.get('badge')?.files.map(file => file.path)).toContain('components/ui/badge/Badge.vue');
            expect([...items.values()].flatMap(validateRegistryItemInternalImports)).toEqual([]);

            const incomplete = { ...item, files: item.files.filter(file => file.path !== 'lib/sub/helper.ts') };
            expect(validateRegistryItemInternalImports(incomplete)).toEqual([
                expect.stringContaining('imports "@/lib/sub/helper.js"'),
            ]);

            const scopedPaths = { ...paths, libDir: path.join(paths.componentsDir, 'button/lib') };
            const scopedSource = path.join(paths.componentsDir, 'button/Button.vue');
            const scopedHelper = path.join(scopedPaths.libDir, 'helper.ts');
            const scopedContent = '<script setup>import { helper } from "./lib/helper"; void helper;</script>';
            const helper = 'export const helper = true;';
            fs.mkdirSync(scopedPaths.libDir, { recursive: true });
            fs.writeFileSync(scopedSource, scopedContent);
            fs.writeFileSync(scopedHelper, helper);
            await vfs?.writeFile(scopedSource, scopedContent);
            await vfs?.writeFile(scopedHelper, helper);
            const { compiler: scopedCompiler } = await createRegistryCompiler({
                fs: vfs,
                paths: scopedPaths,
                manifest: scanComponentFiles(scopedPaths),
                metadata: { button: COMPONENT_METADATA.button, badge: COMPONENT_METADATA.badge },
                publicProjection: {
                    componentId: 'button',
                    exports: [{ source: './Button.vue', sourceName: 'default', publicName: 'Button', kind: 'value' }],
                },
            });
            const { item: scopedItem } = await scopedCompiler.compileItem('button');
            const scopedFiles = new Map(scopedItem.files.map(file => [file.path, file.content]));

            expect(scopedFiles.get('components/ui/button/Button.vue')).toContain('from "@/components/ui/button/lib/helper"');
            expect(scopedFiles.get('components/ui/button/lib/helper.ts')).toBe(helper);
            expect(validateRegistryItemInternalImports(scopedItem)).toEqual([]);

            const binaryPath = path.join(paths.componentsDir, 'button/icon.png');
            const invalidUtf8 = Uint8Array.of(0x89, 0x50, 0x4e, 0x47);
            const importBinary = '<script setup>import icon from "./icon.png"; void icon;</script>';
            fs.writeFileSync(scopedSource, importBinary);
            fs.writeFileSync(binaryPath, invalidUtf8);
            await vfs?.writeFile(scopedSource, importBinary);
            await vfs?.writeFile(binaryPath, invalidUtf8);

            await expect(scopedCompiler.compileItem('button')).rejects.toThrow(/icon\.png.*UTF-8/u);
        } finally {
            fs.rmSync(rootDir, { recursive: true, force: true });
        }
    });

    it('compiles Popconfirm dependencies and imports to registry distribution aliases', async () => {
        const { compiler } = await createRegistryCompiler({ validateManifestFreshness: false });
        const { item } = await compiler.compileItem('popconfirm');
        const componentFile = item.files.find(file => file.path === 'components/ui/popconfirm/Popconfirm.vue');

        expect(componentFile).toBeDefined();
        expect(item.registryDependencies).toEqual(expect.arrayContaining(['button', 'popover']));
        expect(componentFile?.content).toContain("from '@/components/ui/popover'");
        expect(componentFile?.content).toContain("from '@/components/ui/button'");
        expect(componentFile?.content).not.toContain("from '@/components/popover'");
        expect(componentFile?.content).not.toContain("from '@/components/button'");
        expect(validateRegistryItemInternalImports(item)).toEqual([]);

        const sourceAliasItem = {
            ...item,
            files: item.files.map(file => file.path === componentFile?.path
                ? {
                    ...file,
                    content: file.content.replace(
                        "from '@/components/ui/popover'",
                        "from '@/components/popover'",
                    ),
                }
                : file),
        };

        expect(validateRegistryItemInternalImports(sourceAliasItem)).toEqual(
            expect.arrayContaining([expect.stringContaining('"@/components/popover"')]),
        );
    });
});
