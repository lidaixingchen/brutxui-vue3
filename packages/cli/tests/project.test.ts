import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { resolveImportAlias, detectProjectType, detectPackageManager, getAliasFromTsConfig, resolveAliasPath, clearProjectTypeCache } from '../src/lib/project.js';

describe('resolveImportAlias', () => {
    it('should correctly resolve import aliases based on config', () => {
        const content = `import { Button } from "@/components/ui/button";\nimport { cn } from "@/lib/utils";`;

        const config = {
            style: 'brutalism',
            tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
            aliases: {
                components: '~/components',
                utils: '~/utils/cn'
            }
        };

        const resolved = resolveImportAlias(content, config);

        expect(resolved).toContain('import { Button } from "~/components/ui/button";');
        expect(resolved).toContain('import { cn } from "~/utils/cn";');
    });

    it('should preserve original imports if alias config matches default alias', () => {
        const content = `import { Button } from "@/components/ui/button";\nimport { cn } from "@/lib/utils";`;

        const config = {
            style: 'brutalism',
            tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
            aliases: {
                components: '@/components',
                utils: '@/lib/utils'
            }
        };

        const resolved = resolveImportAlias(content, config);

        expect(resolved).toContain('import { Button } from "@/components/ui/button";');
        expect(resolved).toContain('import { cn } from "@/lib/utils";');
    });

    it('should correctly resolve deeply nested component imports', () => {
        const content = `import { AccordionItem } from "@/components/ui/accordion";\nimport { useToast } from "@/composables/useToast";`;

        const config = {
            style: 'brutalism',
            tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
            aliases: {
                components: '~/components',
                utils: '~/utils/cn',
                composables: '~/hooks'
            }
        };

        const resolved = resolveImportAlias(content, config);

        expect(resolved).toContain('import { AccordionItem } from "~/components/ui/accordion";');
        expect(resolved).toContain('import { useToast } from "~/hooks/useToast";');
    });

    it('should correctly rewrite relative nested imports', () => {
        const content = `import { Root } from "./accordion-root";\nimport { Button } from "@/components/ui/button";`;

        const config = {
            style: 'brutalism',
            tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
            aliases: {
                components: '~/components',
                utils: '~/utils/cn'
            }
        };

        const resolved = resolveImportAlias(content, config);

        expect(resolved).toContain('import { Root } from "./accordion-root";');
        expect(resolved).toContain('import { Button } from "~/components/ui/button";');
    });
});

describe('getAliasFromTsConfig', () => {
    let tmpDir: string;

    afterEach(async () => {
        if (tmpDir && await fs.pathExists(tmpDir)) {
            await fs.remove(tmpDir);
        }
    });

    it('should read @ alias mapping correctly', async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-alias-test-'));
        const tsconfig = {
            compilerOptions: {
                baseUrl: '.',
                paths: {
                    '@/*': ['./src/*']
                }
            }
        };
        await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), tsconfig);

        const aliases = await getAliasFromTsConfig(tmpDir);
        expect(aliases).toEqual({
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables'
        });
    });

    it('should read ~ alias mapping correctly', async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-alias-test-'));
        const tsconfig = {
            compilerOptions: {
                baseUrl: '.',
                paths: {
                    '~/*': ['./*']
                }
            }
        };
        await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), tsconfig);

        const aliases = await getAliasFromTsConfig(tmpDir);
        expect(aliases).toEqual({
            components: '~/components',
            utils: '~/lib/utils',
            composables: '~/composables'
        });
    });

    it('should return null if no tsconfig exists', async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-alias-test-'));
        const aliases = await getAliasFromTsConfig(tmpDir);
        expect(aliases).toBeNull();
    });

    it('should return null if tsconfig exists but has no paths', async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-alias-test-'));
        await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), { compilerOptions: {} });
        const aliases = await getAliasFromTsConfig(tmpDir);
        expect(aliases).toBeNull();
    });

    it('should prefer conventional alias @/* over first listed non-conventional alias', async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-alias-test-'));
        const tsconfig = {
            compilerOptions: {
                baseUrl: '.',
                paths: {
                    'assets/*': ['./src/assets/*'],
                    '@/*': ['./src/*']
                }
            }
        };
        await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), tsconfig);

        const aliases = await getAliasFromTsConfig(tmpDir);
        expect(aliases).toEqual({
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables'
        });
    });
});

describe('resolveAliasPath', () => {
    let tmpDir: string;

    afterEach(async () => {
        if (tmpDir && await fs.pathExists(tmpDir)) {
            await fs.remove(tmpDir);
        }
    });

    it('should resolve @/components to src/components when tsconfig paths map @/* to ./src/*', async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-alias-path-test-'));
        const tsconfig = {
            compilerOptions: {
                baseUrl: '.',
                paths: {
                    '@/*': ['./src/*']
                }
            }
        };
        await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), tsconfig);

        const resolved = await resolveAliasPath('@/components', tmpDir);
        expect(resolved).toBe(path.resolve(tmpDir, 'src/components'));
    });

    it('should resolve ~/components to components when tsconfig paths map ~/* to ./*', async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-alias-path-test-'));
        const tsconfig = {
            compilerOptions: {
                baseUrl: '.',
                paths: {
                    '~/*': ['./*']
                }
            }
        };
        await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), tsconfig);

        const resolved = await resolveAliasPath('~/components', tmpDir);
        expect(resolved).toBe(path.resolve(tmpDir, 'components'));
    });

    it('should resolve @/components with src fallback when no tsconfig paths exist and src directory is present', async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-alias-path-test-'));
        await fs.ensureDir(path.join(tmpDir, 'src'));

        const resolved = await resolveAliasPath('@/components', tmpDir);
        expect(resolved).toBe(path.resolve(tmpDir, 'src/components'));
    });

    it('should resolve @/components to components when no tsconfig and no src directory exist', async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-alias-path-test-'));

        const resolved = await resolveAliasPath('@/components', tmpDir);
        expect(resolved).toBe(path.resolve(tmpDir, 'components'));
    });
});

describe('detectPackageManager', () => {
    it('should detect pnpm if pnpm-lock.yaml exists', async () => {
        const memFs = new MemoryFileSystemAdapter();
        await memFs.writeFile('/dummy/path/pnpm-lock.yaml', '');
        const pm = await detectPackageManager('/dummy/path', memFs);
        expect(pm).toBe('pnpm');
    });

    it('should detect yarn if yarn.lock exists', async () => {
        const memFs = new MemoryFileSystemAdapter();
        await memFs.writeFile('/dummy/path/yarn.lock', '');
        const pm = await detectPackageManager('/dummy/path', memFs);
        expect(pm).toBe('yarn');
    });

    it('should detect bun if bun.lockb exists', async () => {
        const memFs = new MemoryFileSystemAdapter();
        await memFs.writeFile('/dummy/path/bun.lockb', '');
        const pm = await detectPackageManager('/dummy/path', memFs);
        expect(pm).toBe('bun');
    });

    it('should detect npm as fallback if no lockfile exists', async () => {
        const memFs = new MemoryFileSystemAdapter();
        const pm = await detectPackageManager('/dummy/path', memFs);
        expect(pm).toBe('npm');
    });
});

describe('detectProjectType', () => {
    afterEach(() => {
        clearProjectTypeCache();
    });

    it('should detect nuxt if nuxt config exists', async () => {
        const memFs = new MemoryFileSystemAdapter();
        await memFs.writeFile('/dummy/path/nuxt.config.ts', '');
        const type = await detectProjectType('/dummy/path', memFs);
        expect(type).toBe('nuxt');
    });

    it('should detect vite-vue if vite config exists and vue dependency exists and no src dir', async () => {
        const memFs = new MemoryFileSystemAdapter();
        await memFs.writeFile('/dummy/path/vite.config.ts', '');
        await memFs.writeJson('/dummy/path/package.json', {
            dependencies: {
                vue: '^3.5.0'
            }
        });
        const type = await detectProjectType('/dummy/path', memFs);
        expect(type).toBe('vite-vue');
    });

    it('should detect vite-vue-src if vite config exists and vue dependency exists and src dir exists', async () => {
        const memFs = new MemoryFileSystemAdapter();
        await memFs.writeFile('/dummy/path/vite.config.ts', '');
        await memFs.writeJson('/dummy/path/package.json', {
            dependencies: {
                vue: '^3.5.0'
            }
        });
        await memFs.ensureDir('/dummy/path/src');
        const type = await detectProjectType('/dummy/path', memFs);
        expect(type).toBe('vite-vue-src');
    });
});
