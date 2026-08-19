import { describe, expect, it } from 'vitest';
import {
    assertKnownRegistryDeps,
    extractComponentFileDeps,
    extractDeps,
    extractRegistryDeps,
    extractUnknownRegistryDeps,
    getFileType,
    rewriteImports,
} from '../../src/compiler/ast-rewriter.js';

describe('AstRewriter', () => {
    it('rewrites component imports to registry aliases correctly', () => {
        const code = [
            'import Button from \'../button/Button.vue\';',
            'import { useLocale } from \'../composables/useLocale\';',
            'import { cn } from \'../lib/utils\';',
            'import LocalPart from \'./LocalPart.vue\';',
        ].join('\n');

        const rewritten = rewriteImports(code, 'dialog');
        expect(rewritten).toContain('\'@/components/ui/button/Button.vue\'');
        expect(rewritten).toContain('\'@/composables/useLocale\'');
        expect(rewritten).toContain('\'@/lib/utils\'');
        expect(rewritten).toContain('\'@/components/ui/dialog/LocalPart.vue\'');
    });

    it('rewrites same-directory imports for composables with composable context', () => {
        const code = 'import { helper } from \'./helper\';';
        expect(rewriteImports(code, 'button', 'composable')).toBe('import { helper } from \'@/composables/helper\';');
    });

    it('preserves comments, indentation and does not touch template or style in Vue SFC', () => {
        const sfc = [
            '<template>',
            '  <div>',
            '    <!-- import Fake from "../button/Button.vue" -->',
            '    <p>Some text with ./LocalPart.vue</p>',
            '  </div>',
            '</template>',
            '',
            '<script setup lang="ts">',
            '// Note: keep this comment untouched',
            'import Button from \'../button/Button.vue\';',
            'import LocalPart from \'./LocalPart.vue\';',
            '</script>',
            '',
            '<style scoped>',
            '.btn { background: url("./bg.png"); }',
            '</style>',
        ].join('\n');

        const rewritten = rewriteImports(sfc, 'dialog');

        // Template and Style should remain completely unchanged
        expect(rewritten).toContain('<!-- import Fake from "../button/Button.vue" -->');
        expect(rewritten).toContain('<p>Some text with ./LocalPart.vue</p>');
        expect(rewritten).toContain('.btn { background: url("./bg.png"); }');

        // Script block rewritten precisely
        expect(rewritten).toContain('// Note: keep this comment untouched');
        expect(rewritten).toContain('import Button from \'@/components/ui/button/Button.vue\';');
        expect(rewritten).toContain('import LocalPart from \'@/components/ui/dialog/LocalPart.vue\';');
    });

    it('extracts library and registry dependencies from rewritten code', () => {
        const code = [
            'import { cn } from \'@/lib/utils\';',
            'import type { TableColumn } from \'@/lib/data-table-types\';',
            'export { useForwardProps } from \'@/composables/useForwardProps\';',
            'import { tableKey } from \'@/lib/table-key.ts\';',
            'import Button from \'@/components/ui/button/Button.vue\';',
            'import DataTable from \'@/components/ui/data-table/DataTable.vue\';',
            'await import(\'@/components/ui/popover/PopoverContent.vue\');',
        ].join('\n');

        expect(extractDeps(code, 'lib')).toEqual(['data-table-types.ts', 'table-key.ts', 'utils.ts']);
        expect(extractDeps(code, 'composables')).toEqual(['useForwardProps.ts']);
        expect(extractRegistryDeps(code, 'data-table')).toEqual(['button', 'popover']);
        expect(extractUnknownRegistryDeps(code)).toEqual([]);
    });

    it('finds unknown component imports and throws descriptive errors', () => {
        const code = [
            'import Button from \'@/components/ui/button/Button.vue\';',
            'import Missing from \'@/components/ui/missing-widget/MissingWidget.vue\';',
        ].join('\n');

        expect(extractUnknownRegistryDeps(code)).toEqual(['missing-widget']);
        expect(() => assertKnownRegistryDeps(code, 'dialog', 'DialogContent.vue'))
            .toThrow('Unknown registry component import(s) in "dialog" (DialogContent.vue): missing-widget');
    });

    it('extracts component internal files', () => {
        const code = [
            'import Header from \'@/components/ui/dialog/DialogHeader.vue\';',
            'import Footer from \'@/components/ui/dialog/DialogFooter.vue\';',
        ].join('\n');

        expect(extractComponentFileDeps(code, 'dialog')).toEqual(['DialogFooter.vue', 'DialogHeader.vue']);
    });

    it('resolves correct registry file types', () => {
        expect(getFileType('src/components/button/Button.vue')).toBe('registry:ui');
        expect(getFileType('src/composables/useLocale.ts')).toBe('registry:hook');
        expect(getFileType('src/lib/utils.ts')).toBe('registry:lib');
        expect(getFileType('src/directives/vClickOutside.ts')).toBe('registry:directive');
    });
});
