import { describe, expect, it } from 'vitest';
import { SfcAstEngine } from './sfc-ast-engine.js';

describe('SfcAstEngine', () => {
    describe('parse', () => {
        it('identifies plain TS/JS source code', () => {
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
            expect(desc.scriptSetup?.content).toContain('const count = ref(0);');
        });
    });

    describe('extractModuleSpecifiers', () => {
        it('classifies static value and type-only imports', () => {
            const code = `
import { ref, computed } from 'vue';
import type { Component } from 'vue';
import { type PropType, defineComponent } from 'vue';
import type { ButtonProps } from './button-types';
import { type A, type B } from './all-types';
import { loader } from '@/lib/utils';
export { themeConfig } from '@/lib/theme';
export type { Theme } from '@/lib/theme';
`.trim();

            const specifiers = SfcAstEngine.extractModuleSpecifiers(code, 'test.ts');
            const map = new Map(specifiers.map(s => [s.specifier, s]));

            expect(map.get('vue')).toEqual({ specifier: 'vue', isTypeOnly: false, isDynamic: false });
            expect(map.get('./button-types')).toEqual({ specifier: './button-types', isTypeOnly: true, isDynamic: false });
            expect(map.get('./all-types')).toEqual({ specifier: './all-types', isTypeOnly: true, isDynamic: false });
            expect(map.get('@/lib/utils')).toEqual({ specifier: '@/lib/utils', isTypeOnly: false, isDynamic: false });
            expect(map.get('@/lib/theme')).toEqual({ specifier: '@/lib/theme', isTypeOnly: false, isDynamic: false });
        });

        it('identifies dynamic imports', () => {
            const code = `
const mod = await import('@/components/lazy-modal');
const helper = await import(\`@/lib/dynamic-helper\`);
`.trim();

            const specifiers = SfcAstEngine.extractModuleSpecifiers(code, 'lazy.ts');
            expect(specifiers).toContainEqual({ specifier: '@/components/lazy-modal', isTypeOnly: false, isDynamic: true });
            expect(specifiers).toContainEqual({ specifier: '@/lib/dynamic-helper', isTypeOnly: false, isDynamic: true });
        });

        it('extracts module specifiers across dual <script> blocks in SFC', () => {
            const code = `
<script lang="ts">
import type { HeaderProps } from '@/components/header/types';
export * from '@/components/header/constants';
</script>

<script setup lang="ts">
import { useHeader } from '@/composables/useHeader';
import { Button } from '@/components/button';
</script>
`.trim();

            const specifiers = SfcAstEngine.extractModuleSpecifiers(code, 'header.vue');
            const names = specifiers.map(s => s.specifier);

            expect(names).toContain('@/components/header/types');
            expect(names).toContain('@/components/header/constants');
            expect(names).toContain('@/composables/useHeader');
            expect(names).toContain('@/components/button');
        });
    });

    describe('transformImports', () => {
        it('preserves native single quotes, double quotes and template backticks', () => {
            const code = `
import { a } from '@/lib/utils';
import { b } from "@/components/button";
const dynamic = import(\`@/composables/useLocale\`);
`.trim();

            const transformed = SfcAstEngine.transformImports(code, ctx => {
                if (ctx.specifier.startsWith('@/')) {
                    return ctx.specifier.replace('@/', '~/');
                }
                return ctx.specifier;
            }, 'quotes.ts');

            expect(transformed).toContain("import { a } from '~/lib/utils';");
            expect(transformed).toContain('import { b } from "~/components/button";');
            expect(transformed).toContain('const dynamic = import(`~/composables/useLocale`);');
        });

        it('achieves character-level fidelity preserving JSDoc, inline comments and empty lines in SFC', () => {
            const code = `
<template>
    <div class="card">
        <!-- user slot -->
        <slot />
    </div>
</template>

<script setup lang="ts">
/**
 * Button component with brutalist aesthetic.
 *
 * @author BrutxUI Team
 */
import { ref } from 'vue'; // reactive hook
import { buttonVariants } from '@/components/ui/button/button-variants';

// Initialize count
const count = ref(0);

/* Block comment */
import { cn } from '@/lib/utils';
</script>

<style scoped>
.card { border: 2px solid black; }
</style>
`.trim();

            const transformed = SfcAstEngine.transformImports(code, ctx => {
                if (ctx.specifier === '@/components/ui/button/button-variants') {
                    return '@myrepo/ui/button-variants';
                }
                if (ctx.specifier === '@/lib/utils') {
                    return '@myrepo/utils';
                }
                return ctx.specifier;
            }, 'card.vue');

            expect(transformed).toContain("import { buttonVariants } from '@myrepo/ui/button-variants';");
            expect(transformed).toContain("import { cn } from '@myrepo/utils';");
            expect(transformed).toContain('/**\n * Button component with brutalist aesthetic.');
            expect(transformed).toContain('// reactive hook');
            expect(transformed).toContain('// Initialize count');
            expect(transformed).toContain('/* Block comment */');
            expect(transformed).toContain('<style scoped>\n.card { border: 2px solid black; }\n</style>');
        });

        it('transforms imports correctly in dual <script> SFC blocks', () => {
            const code = `
<script lang="ts">
export { defaultVariants } from '@/components/ui/common';
</script>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
</script>
`.trim();

            const transformed = SfcAstEngine.transformImports(code, ctx => {
                if (ctx.specifier === '@/components/ui/common') return '@/components/common';
                if (ctx.specifier === '@/composables/useTheme') return '@/hooks/useTheme';
                return ctx.specifier;
            }, 'dual.vue');

            expect(transformed).toContain("export { defaultVariants } from '@/components/common';");
            expect(transformed).toContain("import { useTheme } from '@/hooks/useTheme';");
        });
    });
});
