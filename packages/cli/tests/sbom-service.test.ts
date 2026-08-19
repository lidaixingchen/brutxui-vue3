import path from 'path';
import { describe, it, expect } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { generateProjectSbom } from '../src/lib/services/sbom-service.js';
import { CliError } from '../src/lib/error.js';

describe('Project SBOM Service (Ticket 5)', () => {
    it('throws CONFIG_NOT_FOUND when manifest does not exist or is empty', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/app');

        await expect(generateProjectSbom({ cwd: '/app', fs })).rejects.toThrow(CliError);
    });

    it('generates valid CycloneDX 1.5 JSON with normalized components and dependencies in MemoryFS', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/app/.brutx');
        await fs.writeJson('/app/components.json', {
            $schema: 'https://example.com/schema.json',
            $version: 1,
            style: 'brutalism',
            tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
            aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
        });

        // integrity: 'sha256-' + Base64('test-hash-string')
        // 'test-hash-string' -> hex '746573742d686173682d737472696e67'
        const base64Content = Buffer.from('test-hash-string', 'utf-8').toString('base64');
        const sriIntegrity = `sha256-${base64Content}`;

        await fs.writeJson('/app/.brutx/manifest.json', {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    registrySource: 'official',
                    integrity: sriIntegrity,
                    version: '0.1.0',
                    installedAt: new Date().toISOString(),
                    files: ['src/components/ui/button/Button.vue'],
                    dependencies: ['clsx', 'tailwind-merge'],
                    registryDependencies: [],
                },
                dialog: {
                    name: 'dialog',
                    registrySource: 'official',
                    integrity: sriIntegrity,
                    version: '0.1.0',
                    installedAt: new Date().toISOString(),
                    files: ['src/components/ui/dialog/Dialog.vue'],
                    dependencies: ['reka-ui'],
                    registryDependencies: ['button'],
                },
            },
        });

        const result = await generateProjectSbom({
            cwd: '/app',
            outputPath: 'custom-sbom.json',
            fs,
        });

        expect(result.componentCount).toBe(5); // 2 brutx components + 3 npm libraries (clsx, tailwind-merge, reka-ui)
        expect(result.specVersion).toBe('1.5');
        expect(result.targetPath).toBe(path.resolve('/app', 'custom-sbom.json'));

        const savedSbom = await fs.readJson<any>(result.targetPath);
        expect(savedSbom.bomFormat).toBe('CycloneDX');
        expect(savedSbom.specVersion).toBe('1.5');
        expect(savedSbom.components).toBeDefined();

        // 验证 button 组件
        const buttonComp = savedSbom.components.find((c: any) => c['bom-ref'] === 'brutx:button');
        expect(buttonComp).toBeDefined();
        expect(buttonComp.type).toBe('application');
        expect(buttonComp.hashes[0].alg).toBe('SHA-256');
        expect(buttonComp.hashes[0].content).toBe('746573742d686173682d737472696e67');
        expect(buttonComp.dependencies).toContain('npm:clsx');
        expect(buttonComp.dependencies).toContain('npm:tailwind-merge');

        // 验证 dialog 组件及其 registry 依赖
        const dialogComp = savedSbom.components.find((c: any) => c['bom-ref'] === 'brutx:dialog');
        expect(dialogComp).toBeDefined();
        expect(dialogComp.dependencies).toContain('brutx:button');
        expect(dialogComp.dependencies).toContain('npm:reka-ui');

        // 验证 npm library 组件
        const clsxComp = savedSbom.components.find((c: any) => c['bom-ref'] === 'npm:clsx');
        expect(clsxComp).toBeDefined();
        expect(clsxComp.type).toBe('library');
    });
});
