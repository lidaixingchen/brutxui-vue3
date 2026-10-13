import { describe, expect, it } from 'vitest';
import { validateRegistryItemInternalImports } from '../../scripts/validate-utils.js';
import { createRegistryCompiler } from '../../src/runner/build-runner.js';

describe('Registry component alias compilation', () => {
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
