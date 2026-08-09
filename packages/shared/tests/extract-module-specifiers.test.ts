import { describe, expect, it } from 'vitest';
import {
    extractClassifiedModuleSpecifiers,
    extractModuleSpecifiers,
    extractScriptBlocks,
} from '../src/extract-module-specifiers.js';

describe('extractClassifiedModuleSpecifiers', () => {
    describe('内联 type 修饰符', () => {
        it('import { type Foo } from ... 判为 type-only', () => {
            const items = extractClassifiedModuleSpecifiers("import { type VariantProps } from 'class-variance-authority'");
            const item = items.find((i) => i.specifier === 'class-variance-authority');
            expect(item).toBeDefined();
            expect(item!.isTypeOnly).toBe(true);
        });

        it('import { type Foo, bar } from ... 为运行时依赖', () => {
            const items = extractClassifiedModuleSpecifiers("import { type A, b } from 'mix'");
            expect(items.find((i) => i.specifier === 'mix')!.isTypeOnly).toBe(false);
        });

        it('import d, { type Foo } from ...（含默认导入）非 type-only', () => {
            const items = extractClassifiedModuleSpecifiers("import d, { type Foo } from 'def'");
            expect(items.find((i) => i.specifier === 'def')!.isTypeOnly).toBe(false);
        });

        it('export { type Foo } from ... 判为 type-only', () => {
            const items = extractClassifiedModuleSpecifiers("export { type Foo } from './bar'");
            expect(items.find((i) => i.specifier === './bar')!.isTypeOnly).toBe(true);
        });

        it('export { type Foo, bar } from ... 为运行时依赖', () => {
            const items = extractClassifiedModuleSpecifiers("export { type Foo, bar } from './baz'");
            expect(items.find((i) => i.specifier === './baz')!.isTypeOnly).toBe(false);
        });

        it('export type * from ... 判为 type-only', () => {
            const items = extractClassifiedModuleSpecifiers("export type * from './star'");
            expect(items.find((i) => i.specifier === './star')!.isTypeOnly).toBe(true);
        });
    });

    describe('动态导入', () => {
        it('import(`./foo`) 模板字面量被提取为动态依赖', () => {
            const items = extractClassifiedModuleSpecifiers('const m = import(`./foo`)');
            const item = items.find((i) => i.specifier === './foo');
            expect(item).toBeDefined();
            expect(item!.isDynamic).toBe(true);
        });

        it('import("./foo") 字符串形式仍被提取', () => {
            expect(extractModuleSpecifiers('const m = import("./foo")')).toContain('./foo');
        });
    });
});

describe('extractScriptBlocks（单遍 HTML+JS 状态机）', () => {
    it('正常 SFC 提取 script setup 块', () => {
        const blocks = extractScriptBlocks(
            `<template>\n<div>hi</div>\n</template>\n<script setup lang="ts">\nimport { ref } from 'vue'\n</script>`
        );
        expect(blocks).toHaveLength(1);
        expect(blocks[0]).toContain("from 'vue'");
    });

    it('HTML 注释中未配对的引号不吞掉 script 块', () => {
        const blocks = extractScriptBlocks(`<!-- " unpaired -->\n<script>import a from 'aa'</script>`);
        expect(blocks.some((b) => b.includes("from 'aa'"))).toBe(true);
    });

    it('HTML 注释里的伪 <script> 标签不产生依赖', () => {
        const deps = extractModuleSpecifiers(
            `<!-- <script>import fake from 'fake'</script> -->\n<script>import real from 'real'</script>`
        );
        expect(deps).not.toContain('fake');
        expect(deps).toContain('real');
    });

    it('JS 行注释里的 </script> 不提前截断真实块', () => {
        const deps = extractModuleSpecifiers(`<script>\n// </script>\nimport x from 'y'\n</script>`);
        expect(deps).toContain('y');
    });

    it('JS 块注释里的 </script> 不提前截断真实块', () => {
        const deps = extractModuleSpecifiers(`<script>\n/* </script> */\nimport z from 'w'\n</script>`);
        expect(deps).toContain('w');
    });

    it('JS 字符串里的 </script> 不截断真实块', () => {
        const deps = extractModuleSpecifiers(`<script>\nconst s = "</script>"\nimport a from 'aa'\n</script>`);
        expect(deps).toContain('aa');
    });

    it('script 标签属性值含 >（generic）时正确进入 script 态', () => {
        const blocks = extractScriptBlocks(
            `<script setup lang="ts" generic="T extends object = Record<string, unknown>">\nimport { a } from 'aa'\n</script>`
        );
        expect(blocks).toHaveLength(1);
        expect(blocks[0]).toContain("from 'aa'");
    });

    it('纯 TS 字符串里的 <script> 文本不误判为 SFC', () => {
        const deps = extractModuleSpecifiers(`const s = "<script>const z = 1</script>"\nimport b from 'bb'\n`);
        expect(deps).not.toContain('const z');
        expect(deps).toContain('bb');
    });

    it('HTML 属性未配对引号不吞掉 script 块', () => {
        const deps = extractModuleSpecifiers(`<div data-x='unclosed>\n<script>import a from 'a'</script>`);
        expect(deps).toContain('a');
    });

    it('属性值里的 <script> 文本不误判为标签', () => {
        const deps = extractModuleSpecifiers(`<div data-x="<script>">\n<script>import r from 'r'</script>`);
        expect(deps).not.toContain('<script>');
        expect(deps).toContain('r');
    });

    it('多个 script 块都提取', () => {
        const deps = extractModuleSpecifiers(`<script>\nimport e from 'ee'\n</script>\n<script setup>\nimport f from 'ff'\n</script>`);
        expect(deps).toContain('ee');
        expect(deps).toContain('ff');
    });

    it('大写闭合标签 </SCRIPT> 不吞掉后续内容', () => {
        // 大小写不敏感闭合；若被当作无闭合处理会走兜底吞掉剩余部分
        const blocks = extractScriptBlocks(`<SCRIPT>import a from 'a'</SCRIPT>\nimport x from 'x'`);
        expect(blocks).toHaveLength(1);
        expect(blocks[0]).not.toContain('import x');
    });

    it('</script1> 这类非法闭合不当作真实闭合', () => {
        const deps = extractModuleSpecifiers(`<script>import b from 'b'</script1> 后面`);
        // 旧正则 `</script\b` 不会匹配 `</script1>`；此处应继续扫描到真实闭合或取到末尾
        expect(deps).toContain('b');
    });

    it('未闭合 script 块尽力取到末尾', () => {
        const blocks = extractScriptBlocks('<script>\nimport d from "dd"\n');
        expect(blocks.some((b) => b.includes('import d'))).toBe(true);
    });
});
