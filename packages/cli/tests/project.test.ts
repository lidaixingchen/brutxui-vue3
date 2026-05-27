import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs-extra';
import { resolveImportAlias, detectProjectType, detectPackageManager, detectTailwindVersion } from '../src/lib/project.js';

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
});

describe('detectPackageManager', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should detect pnpm if pnpm-lock.yaml exists', () => {
        vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
            return p.toString().endsWith('pnpm-lock.yaml');
        });
        const pm = detectPackageManager('/dummy/path');
        expect(pm).toBe('pnpm');
    });

    it('should detect yarn if yarn.lock exists', () => {
        vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
            return p.toString().endsWith('yarn.lock');
        });
        const pm = detectPackageManager('/dummy/path');
        expect(pm).toBe('yarn');
    });

    it('should detect bun if bun.lockb exists', () => {
        vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
            return p.toString().endsWith('bun.lockb');
        });
        const pm = detectPackageManager('/dummy/path');
        expect(pm).toBe('bun');
    });

    it('should detect npm as fallback if no lockfile exists', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(false);
        const pm = detectPackageManager('/dummy/path');
        expect(pm).toBe('npm');
    });
});

describe('detectProjectType', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should detect nextjs if next config exists and no src dir', () => {
        vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
            const pStr = p.toString();
            if (pStr.endsWith('next.config.js') || pStr.endsWith('next.config.mjs') || pStr.endsWith('next.config.ts')) {
                return true;
            }
            return false;
        });
        const type = detectProjectType('/dummy/path');
        expect(type).toBe('nextjs');
    });
});

describe('detectTailwindVersion', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should detect v4 if package.json has tailwindcss v4', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);
        vi.spyOn(fs, 'readJsonSync').mockReturnValue({
            devDependencies: {
                tailwindcss: '^4.0.0'
            }
        });

        const version = detectTailwindVersion('/dummy/path');
        expect(version).toBe('v4');
    });

    it('should detect v3 if package.json has tailwindcss v3', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);
        vi.spyOn(fs, 'readJsonSync').mockReturnValue({
            devDependencies: {
                tailwindcss: '^3.4.1'
            }
        });

        const version = detectTailwindVersion('/dummy/path');
        expect(version).toBe('v3');
    });

    it('should fallback to v3 if tailwind config file exists', () => {
        vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
            return p.toString().endsWith('tailwind.config.js');
        });

        const version = detectTailwindVersion('/dummy/path');
        expect(version).toBe('v3');
    });
});

