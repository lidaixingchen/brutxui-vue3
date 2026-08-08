import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { BrutalistConfig } from '../src/lib/types.js';
import { getInstalledComponentInfos } from '../src/lib/installed-components.js';

function makeConfig(): BrutalistConfig {
    return {
        $schema: 'https://example.com/schema.json',
        $version: 1,
        style: 'brutalism',
        tailwind: { config: 'tailwind.config.js', css: '@/styles/globals.css' },
        aliases: {
            components: 'src/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        },
    };
}

async function writeComponent(
    componentsPath: string,
    name: string,
    tsContent: string,
): Promise<void> {
    await fs.ensureDir(path.join(componentsPath, name));
    await fs.writeFile(path.join(componentsPath, name, `${name}.vue`), '<template><div /></template>', 'utf-8');
    await fs.writeFile(path.join(componentsPath, name, 'index.ts'), tsContent, 'utf-8');
}

describe('getInstalledComponentInfos dependency extraction', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-installed-'));
    });

    afterEach(async () => {
        await fs.remove(tmpDir);
    });

    it('extracts real imports and ignores commented imports', async () => {
        const componentsPath = path.join(tmpDir, 'src', 'components');
        await writeComponent(
            componentsPath,
            'button',
            [
                "import { computed } from 'vue';",
                "// import 'react';",
                "/* import 'lodash'; */",
                'export const btn = computed(() => 1);',
            ].join('\n'),
        );

        const infos = await getInstalledComponentInfos(tmpDir, makeConfig());
        expect(infos).toHaveLength(1);
        expect(infos[0].dependencies).toContain('vue');
        expect(infos[0].dependencies).not.toContain('react');
        expect(infos[0].dependencies).not.toContain('lodash');
    });

    it('extracts side-effect and dynamic imports', async () => {
        const componentsPath = path.join(tmpDir, 'src', 'components');
        await writeComponent(
            componentsPath,
            'alert',
            [
                "import 'focus-trap';",
                "const load = () => import('lazy-module');",
            ].join('\n'),
        );

        const infos = await getInstalledComponentInfos(tmpDir, makeConfig());
        expect(infos).toHaveLength(1);
        expect(infos[0].dependencies).toEqual(expect.arrayContaining(['focus-trap', 'lazy-module']));
    });

    it('keeps a real import that shares a line with a URL string', async () => {
        const componentsPath = path.join(tmpDir, 'src', 'components');
        await writeComponent(
            componentsPath,
            'card',
            "const url = 'https://example.com/x'; import { z } from 'zod';",
        );

        const infos = await getInstalledComponentInfos(tmpDir, makeConfig());
        expect(infos).toHaveLength(1);
        // URL 中的 `//` 不应被当作行注释剥离掉同一行的真实 import
        expect(infos[0].dependencies).toContain('zod');
        expect(infos[0].dependencies).not.toContain('example.com');
    });
});
