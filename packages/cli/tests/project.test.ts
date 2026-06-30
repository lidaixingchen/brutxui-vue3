import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { PathLike } from 'fs';
import { resolveImportAlias, detectProjectType, detectPackageManager, detectTailwindVersion, getAliasFromTsConfig, resolveAliasPath } from '../src/lib/project.js';

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

    it('should resolve composables and sibling locales aliases', () => {
        const content = `import { useLocale } from "@/composables/useLocale";\nimport { zhCN } from "@/locales/zh-CN";`;

        const config = {
            style: 'brutalism',
            tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
            aliases: {
                components: '~/components',
                utils: '~/shared/cn',
                composables: '~/shared/composables'
            }
        };

        const resolved = resolveImportAlias(content, config);

        expect(resolved).toContain('import { useLocale } from "~/shared/composables/useLocale";');
        expect(resolved).toContain('import { zhCN } from "~/shared/locales/zh-CN";');
    });
});

describe('tsconfig alias parsing', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should parse JSONC tsconfig files with trailing commas', async () => {
        const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-project-'));
        try {
            await fs.writeFile(path.join(cwd, 'tsconfig.json'), `{
                // common Vue alias
                "compilerOptions": {
                    "baseUrl": ".",
                    "paths": {
                        "@/*": ["./src/*",],
                    },
                },
            }`);

            expect(await getAliasFromTsConfig(cwd)).toEqual({
                components: '@/components',
                utils: '@/lib/utils',
                composables: '@/composables',
            });
            expect(await resolveAliasPath('@/components', cwd)).toBe(path.join(cwd, 'src', 'components'));
        } finally {
            await fs.remove(cwd);
        }
    });
});

describe('detectPackageManager', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should detect pnpm if pnpm-lock.yaml exists', async () => {
        vi.spyOn(fs, 'pathExists').mockImplementation((p: PathLike) => {
            return Promise.resolve(p.toString().endsWith('pnpm-lock.yaml'));
        });
        const pm = await detectPackageManager('/dummy/path');
        expect(pm).toBe('pnpm');
    });

    it('should detect yarn if yarn.lock exists', async () => {
        vi.spyOn(fs, 'pathExists').mockImplementation((p: PathLike) => {
            return Promise.resolve(p.toString().endsWith('yarn.lock'));
        });
        const pm = await detectPackageManager('/dummy/path');
        expect(pm).toBe('yarn');
    });

    it('should detect bun if bun.lockb exists', async () => {
        vi.spyOn(fs, 'pathExists').mockImplementation((p: PathLike) => {
            return Promise.resolve(p.toString().endsWith('bun.lockb'));
        });
        const pm = await detectPackageManager('/dummy/path');
        expect(pm).toBe('bun');
    });

    it('should detect npm as fallback if no lockfile exists', async () => {
        vi.spyOn(fs, 'pathExists').mockResolvedValue(false);
        const pm = await detectPackageManager('/dummy/path');
        expect(pm).toBe('npm');
    });
});

describe('detectProjectType', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should detect nuxt if nuxt config exists', async () => {
        vi.spyOn(fs, 'pathExists').mockImplementation((p: PathLike) => {
            const pStr = p.toString();
            if (pStr.endsWith('nuxt.config.js') || pStr.endsWith('nuxt.config.ts') || pStr.endsWith('nuxt.config.mjs')) {
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        });
        const type = await detectProjectType('/dummy/path');
        expect(type).toBe('nuxt');
    });

    it('should detect vite-vue if vite config exists and vue dependency exists and no src dir', async () => {
        vi.spyOn(fs, 'pathExists').mockImplementation((p: PathLike) => {
            const pStr = p.toString();
            if (pStr.endsWith('vite.config.js') || pStr.endsWith('vite.config.ts') || pStr.endsWith('vite.config.mjs')) {
                return Promise.resolve(true);
            }
            if (pStr.endsWith('src')) {
                return Promise.resolve(false);
            }
            return Promise.resolve(false);
        });
        vi.spyOn(fs, 'readJson').mockResolvedValue({
            dependencies: {
                vue: '^3.5.0'
            }
        });
        const type = await detectProjectType('/dummy/path');
        expect(type).toBe('vite-vue');
    });

    it('should detect vite-vue-src if vite config exists and vue dependency exists and src dir exists', async () => {
        vi.spyOn(fs, 'pathExists').mockImplementation((p: PathLike) => {
            const pStr = p.toString();
            if (pStr.endsWith('vite.config.js') || pStr.endsWith('vite.config.ts') || pStr.endsWith('vite.config.mjs')) {
                return Promise.resolve(true);
            }
            if (pStr.endsWith('src')) {
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        });
        vi.spyOn(fs, 'readJson').mockResolvedValue({
            dependencies: {
                vue: '^3.5.0'
            }
        });
        const type = await detectProjectType('/dummy/path');
        expect(type).toBe('vite-vue-src');
    });
});

describe('detectTailwindVersion', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should detect v4 if package.json has tailwindcss v4', async () => {
        vi.spyOn(fs, 'pathExists').mockResolvedValue(true);
        vi.spyOn(fs, 'readJson').mockResolvedValue({
            devDependencies: {
                tailwindcss: '^4.0.0'
            }
        });

        const version = await detectTailwindVersion('/dummy/path');
        expect(version).toBe('v4');
    });

    it('should detect v3 if package.json has tailwindcss v3', async () => {
        vi.spyOn(fs, 'pathExists').mockResolvedValue(true);
        vi.spyOn(fs, 'readJson').mockResolvedValue({
            devDependencies: {
                tailwindcss: '^3.4.1'
            }
        });

        const version = await detectTailwindVersion('/dummy/path');
        expect(version).toBe('v3');
    });

    it('should fallback to v3 if tailwind config file exists', async () => {
        vi.spyOn(fs, 'pathExists').mockImplementation((p: PathLike) => {
            return Promise.resolve(p.toString().endsWith('tailwind.config.js'));
        });

        const version = await detectTailwindVersion('/dummy/path');
        expect(version).toBe('v3');
    });
});
