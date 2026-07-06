import { describe, expect, it } from 'vitest';
import { COMPONENT_FILES, computeRegistryIntegrity } from 'brutx-shared-vue';
import { COMPONENT_FILES as REGISTRY_COMPONENT_FILES } from '../scripts/component-files';
import {
    extractDeps,
    extractRegistryDeps,
    getFileType,
    rewriteImports,
} from '../scripts/build-registry';

describe('build-registry helpers', () => {
    it('keeps the registry compatibility mapping pointed at shared metadata', () => {
        expect(REGISTRY_COMPONENT_FILES).toBe(COMPONENT_FILES);
        expect(COMPONENT_FILES.button.files).toContain('Button.vue');
    });

    it('rewrites component imports to registry aliases', () => {
        const code = [
            "import Button from '../button/Button.vue'",
            "import { useLocale } from '../composables/useLocale'",
            "import { cn } from '../lib/utils'",
            "import LocalPart from './LocalPart.vue'",
        ].join('\n');

        expect(rewriteImports(code, 'dialog')).toContain("'@/components/ui/button/Button.vue'");
        expect(rewriteImports(code, 'dialog')).toContain("'@/composables/useLocale'");
        expect(rewriteImports(code, 'dialog')).toContain("'@/lib/utils'");
        expect(rewriteImports(code, 'dialog')).toContain("'@/components/ui/dialog/LocalPart.vue'");
    });

    it('rewrites same-directory imports for composables without routing them to components', () => {
        const code = "import { helper } from './helper'";

        expect(rewriteImports(code, 'button', 'composable')).toBe("import { helper } from '@/composables/helper'");
    });

    it('extracts library and registry dependencies from rewritten code', () => {
        const code = [
            "import { cn } from '@/lib/utils'",
            "import { tableKey } from '@/lib/table-key.ts'",
            "import Button from '@/components/ui/button/Button.vue'",
            "import DataTable from '@/components/ui/data-table/DataTable.vue'",
        ].join('\n');

        expect(extractDeps(code, 'lib')).toEqual(['utils.ts', 'table-key.ts']);
        expect(extractRegistryDeps(code, 'data-table')).toEqual(['button']);
    });

    it('classifies registry file types and computes stable integrity', () => {
        expect(getFileType('components/ui/button/Button.vue')).toBe('registry:ui');
        expect(getFileType('composables/useLocale.ts')).toBe('registry:hook');
        expect(getFileType('lib/data-table-utils.ts')).toBe('registry:lib');

        expect(computeRegistryIntegrity([
            { content: 'one' },
            { content: 'two' },
        ])).toBe('sha256-a0ef70c43442d404b1ed004b6649348633dda30e2ffac547c29a2b753abafa89');
    });
});
