import { describe, expect, it } from 'vitest';
import { SfcAstEngine } from './sfc-ast-engine.js';

describe('SfcAstEngine', () => {
    describe('parse', () => {
        it('identifies plain TS/JS source code based on filename', () => {
            const code = 'export const a: number = 1;\nimport { ref } from "vue";';
            const desc = SfcAstEngine.parse(code, 'utils.ts');
            expect(desc.isSfc).toBe(false);
            expect(desc.script).toBeUndefined();
            expect(desc.scriptSetup).toBeUndefined();
            expect(desc.styles).toHaveLength(0);
        });

        it('parses standard Vue SFC with script setup and style', () => {
            const code = `
<template>
    <button>{{ text }}</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const text = ref('hello');
</script>

<style scoped>
button { color: red; }
</style>
`.trim();

            const desc = SfcAstEngine.parse(code, 'button.vue');
            expect(desc.isSfc).toBe(true);
            expect(desc.scriptSetup).toBeDefined();
            expect(desc.scriptSetup?.lang).toBe('ts');
            expect(desc.scriptSetup?.setup).toBe(true);
            expect(desc.scriptSetup?.content).toContain('const text = ref');
            expect(desc.templateContent).toContain('<button>{{ text }}</button>');
            expect(desc.styles).toHaveLength(1);
            expect(desc.styles[0]?.scoped).toBe(true);
        });

        it('correctly parses Vue 3.3+ generic attributes with nested brackets', () => {
            const code = `
<template>
    <div>{{ item }}</div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>, K extends keyof T = keyof T">
import { defineProps } from 'vue';
defineProps<{ item: T; keyName: K }>();
</script>
`.trim();

            const desc = SfcAstEngine.parse(code, 'generic-component.vue');
            expect(desc.isSfc).toBe(true);
            expect(desc.scriptSetup).toBeDefined();
            expect(desc.scriptSetup?.generic).toBe('T extends Record<string, unknown>, K extends keyof T = keyof T');
            expect(desc.scriptSetup?.content).toContain('defineProps<{ item: T; keyName: K }>()');
        });

        it('ignores pseudo-script tags inside HTML comments', () => {
            const code = `
<template>
    <!-- <script>const dummy = true;</script> -->
    <div>Real content</div>
</template>

<script setup lang="ts">
export const real = 123;
</script>
`.trim();

            const desc = SfcAstEngine.parse(code, 'comment.vue');
            expect(desc.isSfc).toBe(true);
            expect(desc.scriptSetup).toBeDefined();
            expect(desc.scriptSetup?.content.trim()).toBe('export const real = 123;');
            expect(desc.script).toBeUndefined();
        });

        it('supports both normal <script> and <script setup> in the same SFC', () => {
            const code = `
<script lang="ts">
export interface ButtonOption {
    label: string;
}
</script>

<script setup lang="ts">
import { ref } from 'vue';
const count = ref(0);
</script>
`.trim();

            const desc = SfcAstEngine.parse(code, 'dual-script.vue');
            expect(desc.isSfc).toBe(true);
            expect(desc.script).toBeDefined();
            expect(desc.script?.setup).toBe(false);
            expect(desc.script?.content).toContain('export interface ButtonOption');
            expect(desc.scriptSetup).toBeDefined();
            expect(desc.scriptSetup?.setup).toBe(true);
        });

        it('does not treat plain TS containing HTML strings as SFC', () => {
            const code = `const template = '<template><div>hello</div></template>';\nimport { foo } from 'bar';`;
            const desc = SfcAstEngine.parse(code, 'constants.ts');
            expect(desc.isSfc).toBe(false);
        });
    });

    describe('analyzeModules & extractModuleSpecifiers', () => {
        it('classifies static value and type-only imports', () => {
            const code = `
import { type PropType, defineComponent } from 'vue';
import type { ButtonProps } from './button-types';
import { type A, type B } from './all-types';
import { loader } from '@/lib/utils';
export { themeConfig } from '@/lib/theme';
export type { Theme } from '@/lib/theme';
`.trim();

            const analysis = SfcAstEngine.analyzeModules(code, 'test.ts');
            const map = new Map(analysis.dependencies.map(s => [s.specifier, s]));

            expect(map.get('vue')).toMatchObject({ specifier: 'vue', isTypeOnly: false, isDynamic: false });
            expect(map.get('./button-types')).toMatchObject({ specifier: './button-types', isTypeOnly: true, isDynamic: false });
            expect(map.get('./all-types')).toMatchObject({ specifier: './all-types', isTypeOnly: true, isDynamic: false, hasVerbatimSideEffect: true });
            expect(map.get('@/lib/utils')).toMatchObject({ specifier: '@/lib/utils', isTypeOnly: false, isDynamic: false });
            expect(map.get('@/lib/theme')).toMatchObject({ specifier: '@/lib/theme', isTypeOnly: false, isDynamic: false });

            // 验证 verbatimModuleSyntax 边界
            const allTypesRef = analysis.references.find(r => r.specifier === './all-types');
            expect(allTypesRef?.hasVerbatimSideEffect).toBe(true);
            const buttonTypesRef = analysis.references.find(r => r.specifier === './button-types');
            expect(buttonTypesRef?.hasVerbatimSideEffect).toBe(false);
        });

        it('identifies dynamic imports', () => {
            const code = `
const mod = await import('@/components/lazy-modal');
const dynamic = import(\`@/lib/dynamic-helper\`);
`.trim();

            const specifiers = SfcAstEngine.extractModuleSpecifiers(code, 'test.ts');
            expect(specifiers).toContainEqual(expect.objectContaining({ specifier: '@/components/lazy-modal', isTypeOnly: false, isDynamic: true }));
            expect(specifiers).toContainEqual(expect.objectContaining({ specifier: '@/lib/dynamic-helper', isTypeOnly: false, isDynamic: true }));
        });

        it('marks non-literal dynamic import as partial completeness', () => {
            const code = `const modName = 'pkg';\nconst mod = await import(modName);`;
            const analysis = SfcAstEngine.analyzeModules(code, 'dynamic.ts');
            expect(analysis.completeness).toBe('partial');
            expect(analysis.diagnostics.some(d => d.code === 'AST_DYNAMIC_IMPORT_NON_LITERAL')).toBe(true);
        });

        it('marks CommonJS require calls as candidate references with partial completeness', () => {
            const code = `const fs = require('fs');`;
            const analysis = SfcAstEngine.analyzeModules(code, 'cjs.js');
            expect(analysis.completeness).toBe('partial');
            expect(analysis.references.some(r => r.kind === 'require' && r.specifier === 'fs')).toBe(true);
        });

        it('reports invalid completeness on SFC syntax errors', () => {
            const brokenSfc = `<template><div unclosed></template>`;
            const analysis = SfcAstEngine.analyzeModules(brokenSfc, 'broken.vue');
            expect(analysis.completeness).toBe('invalid');
            expect(analysis.diagnostics.some(d => d.code === 'SFC_PARSE_ERROR')).toBe(true);
        });

        it('reports error diagnostic and invalid completeness on unsupported script lang', () => {
            const code = `<script lang="coffeescript">\nimport a from 'a';\n</script>`;
            const analysis = SfcAstEngine.analyzeModules(code, 'coffee.vue');
            expect(analysis.completeness).toBe('invalid');
            expect(analysis.diagnostics.some(d => d.code === 'AST_UNKNOWN_SCRIPT_LANG')).toBe(true);
        });

        it('extracts module specifiers across dual <script> blocks in SFC', () => {
            const code = `
<script lang="ts">
import { defineComponent } from 'vue';
import type { CommonProps } from './types';
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { useButton } from '@/composables/useButton';
</script>
`.trim();

            const specifiers = SfcAstEngine.extractModuleSpecifiers(code, 'component.vue');
            const map = new Map(specifiers.map(s => [s.specifier, s]));

            expect(map.get('vue')).toMatchObject({ specifier: 'vue', isTypeOnly: false, isDynamic: false });
            expect(map.get('./types')).toMatchObject({ specifier: './types', isTypeOnly: true, isDynamic: false });
            expect(map.get('@/composables/useButton')).toMatchObject({ specifier: '@/composables/useButton', isTypeOnly: false, isDynamic: false });
        });

        it('handles inline type-only imports correctly', () => {
            const code = `import { type VariantProps } from 'class-variance-authority';`;
            const items = SfcAstEngine.extractModuleSpecifiers(code, 'button.ts');
            expect(items).toContainEqual(expect.objectContaining({ specifier: 'class-variance-authority', isTypeOnly: true, isDynamic: false }));
        });

        it('handles mixed value and inline type imports', () => {
            const code = `import { type A, b } from 'mix';`;
            const items = SfcAstEngine.extractModuleSpecifiers(code, 'mix.ts');
            expect(items).toContainEqual(expect.objectContaining({ specifier: 'mix', isTypeOnly: false, isDynamic: false }));
        });

        it('handles default import mixed with inline type', () => {
            const code = `import d, { type Foo } from 'def';`;
            const items = SfcAstEngine.extractModuleSpecifiers(code, 'def.ts');
            expect(items).toContainEqual(expect.objectContaining({ specifier: 'def', isTypeOnly: false, isDynamic: false }));
        });

        it('handles export type re-exports', () => {
            const code = `export { type Foo } from './bar';\nexport type * from './star';`;
            const items = SfcAstEngine.extractModuleSpecifiers(code, 'export.ts');
            expect(items).toContainEqual(expect.objectContaining({ specifier: './bar', isTypeOnly: true, isDynamic: false }));
            expect(items).toContainEqual(expect.objectContaining({ specifier: './star', isTypeOnly: true, isDynamic: false }));
        });
    });

    describe('transformImports & transform', () => {
        it('preserves native single quotes, double quotes and template backticks', () => {
            const code = `
import { a } from 'pkg-a';
import { b } from "pkg-b";
const c = import(\`pkg-c\`);
`.trim();

            const transformed = SfcAstEngine.transformImports(code, ctx => {
                if (ctx.specifier === 'pkg-a') return 'alias-a';
                if (ctx.specifier === 'pkg-b') return 'alias-b';
                if (ctx.specifier === 'pkg-c') return 'alias-c';
                return ctx.specifier;
            }, 'test.ts');

            expect(transformed).toContain("import { a } from 'alias-a';");
            expect(transformed).toContain('import { b } from "alias-b";');
            expect(transformed).toContain('const c = import(`alias-c`);');
        });

        it('achieves character-level fidelity preserving JSDoc, inline comments and empty lines in SFC', () => {
            const code = `
<template>
    <div>test</div>
</template>

<script setup lang="ts">
/**
 * Leading comment
 */
import { ref } from 'vue'; // trailing inline comment

// Intermediary comment
import { utils } from '@/lib/utils';

const x = ref(1);
</script>
`.trim();

            const transformed = SfcAstEngine.transformImports(code, ctx => {
                if (ctx.specifier === '@/lib/utils') return '@/shared/utils';
                return ctx.specifier;
            }, 'button.vue');

            expect(transformed).toContain("/**\n * Leading comment\n */");
            expect(transformed).toContain("// trailing inline comment");
            expect(transformed).toContain("// Intermediary comment");
            expect(transformed).toContain("import { utils } from '@/shared/utils';");
            expect(transformed).toContain("<template>\n    <div>test</div>\n</template>");
        });

        it('transforms imports correctly in dual <script> SFC blocks', () => {
            const code = `
<script lang="ts">
import { a } from '@/lib/a';
</script>

<script setup lang="ts">
import { b } from '@/lib/b';
</script>
`.trim();

            const transformed = SfcAstEngine.transformImports(code, ctx => {
                return ctx.specifier.replace('@/lib/', '@/core/');
            }, 'dual.vue');

            expect(transformed).toContain("import { a } from '@/core/a';");
            expect(transformed).toContain("import { b } from '@/core/b';");
        });

        it('properly escapes quotes, backslashes and newlines in replacement specifiers', () => {
            const code = `import { a } from 'old-pkg';`;
            const transformed = SfcAstEngine.transformImports(code, () => {
                return "new'pkg\\path\nline";
            }, 'test.ts');

            expect(transformed).toBe(`import { a } from 'new\\'pkg\\\\path\\nline';`);
        });

        it('returns changed=false when no replacements are made', () => {
            const code = `import { a } from 'pkg';`;
            const result = SfcAstEngine.transform(code, ctx => ctx.specifier, 'test.ts');
            expect(result.changed).toBe(false);
            expect(result.code).toBe(code);
        });

        it('escapes quotes in replacement specifier to produce valid output', () => {
            const code = `import { a } from 'pkg';`;
            const result = SfcAstEngine.transform(code, () => {
                return "invalid'quote";
            }, 'test.ts');

            expect(result.changed).toBe(true);
            expect(result.code).toContain("invalid\\'quote");
        });

        it('blocks transform when source has invalid syntax', () => {
            const code = `import { a } from;`;
            const result = SfcAstEngine.transform(code, () => 'new-pkg', 'test.ts');
            expect(result.changed).toBe(false);
            expect(result.code).toBe(code);
            expect(result.diagnostics.length).toBeGreaterThan(0);
        });
    });
});
