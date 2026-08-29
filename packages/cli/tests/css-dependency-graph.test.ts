import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import {
    computeRelativeImportSpecifier,
    injectImportStatement,
    scanCssGraph,
    stripCssComments,
} from '../src/lib/css/index.js';
import { BRUTX_CSS_END_MARKER, BRUTX_CSS_START_MARKER } from '../src/lib/constants.js';

describe('CssDependencyGraphEngine', () => {
    const cwd = path.resolve('/workspace');

    describe('stripCssComments', () => {
        it('应将块注释替换为等长空白字符以保持行号与字符偏移量绝对一致', () => {
            const raw = '/* comment */\n@import "./a.css";';
            const stripped = stripCssComments(raw);
            expect(stripped.length).toBe(raw.length);
            expect(stripped).toBe('             \n@import "./a.css";');
            expect(stripped.split('\n').length).toBe(raw.split('\n').length);
        });

        it('应正确处理多行注释', () => {
            const raw = '/* line 1\n   line 2\n   line 3 */\n@import "./b.css";';
            const stripped = stripCssComments(raw);
            expect(stripped.length).toBe(raw.length);
            expect(stripped.split('\n').length).toBe(raw.split('\n').length);
        });
    });

    describe('computeRelativeImportSpecifier', () => {
        it('同级目录下的文件应生成 ./ 前缀的 POSIX 路径', () => {
            const from = path.resolve(cwd, 'src/styles/main.css');
            const to = path.resolve(cwd, 'src/styles/tokens.css');
            expect(computeRelativeImportSpecifier(from, to)).toBe('./tokens.css');
        });

        it('子目录下的文件应生成正确相对路径', () => {
            const from = path.resolve(cwd, 'src/main.css');
            const to = path.resolve(cwd, 'src/styles/tokens.css');
            expect(computeRelativeImportSpecifier(from, to)).toBe('./styles/tokens.css');
        });

        it('跨级父目录文件应生成 ../ 前缀路径', () => {
            const from = path.resolve(cwd, 'src/nested/main.css');
            const to = path.resolve(cwd, 'src/styles/tokens.css');
            expect(computeRelativeImportSpecifier(from, to)).toBe('../styles/tokens.css');
        });
    });

    describe('injectImportStatement', () => {
        it('若已包含相同 @import 则幂等返回原内容', () => {
            const original = '@import "tailwindcss";\n@import "./tokens.css";\nbody { color: red; }';
            const injected = injectImportStatement(original, './tokens.css');
            expect(injected).toBe(original);
        });

        it('若存在 @import "tailwindcss"，应精准插入在其后一行', () => {
            const original = '@import "tailwindcss";\nbody { color: red; }';
            const injected = injectImportStatement(original, './tokens.css');
            expect(injected).toBe('@import "tailwindcss";\n@import "./tokens.css";\nbody { color: red; }');
        });

        it('若存在 @charset，应插入在 @charset 之后', () => {
            const original = '@charset "UTF-8";\nbody { color: red; }';
            const injected = injectImportStatement(original, './tokens.css');
            expect(injected).toBe('@charset "UTF-8";\n@import "./tokens.css";\nbody { color: red; }');
        });

        it('若无 @import "tailwindcss" 或 @charset，插入在文件顶部', () => {
            const original = 'body { color: red; }';
            const injected = injectImportStatement(original, './tokens.css');
            expect(injected).toBe('@import "./tokens.css";\nbody { color: red; }');
        });
    });

    describe('scanCssGraph', () => {
        it('单文件无导入时能正确解析节点属性与 tokens 存在性', async () => {
            const fs = new MemoryFileSystemAdapter();
            const mainPath = path.resolve(cwd, 'src/main.css');
            const tokenBlock = `${BRUTX_CSS_START_MARKER}\n:root { --brutal-bg: #fff; }\n${BRUTX_CSS_END_MARKER}`;
            await fs.writeFile(mainPath, `@import "tailwindcss";\n${tokenBlock}`);

            const graph = await scanCssGraph(mainPath, { fs, cwd });

            expect(graph.hasBrutxTokens).toBe(true);
            expect(graph.tokenNodePaths).toEqual([mainPath]);
            expect(graph.circularPaths).toHaveLength(0);
            expect(graph.missingImports).toHaveLength(0);
            expect(graph.nodes.get(mainPath)?.hasTailwindCore).toBe(true);
            expect(graph.nodes.get(mainPath)?.hasTokensBlock).toBe(true);
        });

        it('能递归遍历多层嵌套 @import 依赖并发现子节点中的 tokens', async () => {
            const fs = new MemoryFileSystemAdapter();
            const mainPath = path.resolve(cwd, 'src/main.css');
            const themePath = path.resolve(cwd, 'src/theme.css');
            const tokensPath = path.resolve(cwd, 'src/tokens.css');

            const tokenBlock = `${BRUTX_CSS_START_MARKER}\n:root { --brutal-bg: #fff; }\n${BRUTX_CSS_END_MARKER}`;
            await fs.writeFile(mainPath, '@import "./theme.css";');
            await fs.writeFile(themePath, '@import "./tokens.css";');
            await fs.writeFile(tokensPath, tokenBlock);

            const graph = await scanCssGraph(mainPath, { fs, cwd });

            expect(graph.hasBrutxTokens).toBe(true);
            expect(graph.tokenNodePaths).toEqual([tokensPath]);
            expect(graph.nodes.size).toBe(3);
            expect(graph.missingImports).toHaveLength(0);
        });

        it('应忽略块注释中的废弃 @import，避免产生 404 悬空误报', async () => {
            const fs = new MemoryFileSystemAdapter();
            const mainPath = path.resolve(cwd, 'src/main.css');
            const realPath = path.resolve(cwd, 'src/real.css');

            await fs.writeFile(
                mainPath,
                '/* @import "./deleted-1.css"; */\n@import "./real.css";\n/*\n @import "./deleted-2.css";\n*/'
            );
            await fs.writeFile(realPath, 'body { margin: 0; }');

            const graph = await scanCssGraph(mainPath, { fs, cwd });

            expect(graph.missingImports).toHaveLength(0);
            expect(graph.nodes.size).toBe(2);
            expect(graph.nodes.has(realPath)).toBe(true);
        });

        it('应兼容 layer() 与媒体查询修饰符的 @import 语法', async () => {
            const fs = new MemoryFileSystemAdapter();
            const mainPath = path.resolve(cwd, 'src/main.css');
            const utilPath = path.resolve(cwd, 'src/utilities.css');
            const mobilePath = path.resolve(cwd, 'src/mobile.css');

            await fs.writeFile(
                mainPath,
                '@import "./utilities.css" layer(utilities);\n@import url("./mobile.css") screen and (max-width: 768px);'
            );
            await fs.writeFile(utilPath, '@utility brutal-card { border: 2px solid black; }');
            await fs.writeFile(mobilePath, 'body { font-size: 14px; }');

            const graph = await scanCssGraph(mainPath, { fs, cwd });

            expect(graph.missingImports).toHaveLength(0);
            expect(graph.nodes.size).toBe(3);
            expect(graph.nodes.get(mainPath)?.imports[0].modifiers).toBe('layer(utilities)');
            expect(graph.nodes.get(mainPath)?.imports[1].modifiers).toBe('screen and (max-width: 768px)');
        });

        it('应正确捕获循环引用并中断递归防止爆栈', async () => {
            const fs = new MemoryFileSystemAdapter();
            const aPath = path.resolve(cwd, 'src/a.css');
            const bPath = path.resolve(cwd, 'src/b.css');

            await fs.writeFile(aPath, '@import "./b.css";');
            await fs.writeFile(bPath, '@import "./a.css";');

            const graph = await scanCssGraph(aPath, { fs, cwd });

            expect(graph.circularPaths.length).toBeGreaterThan(0);
            expect(graph.circularPaths[0]).toEqual([aPath, bPath, aPath]);
        });

        it('应精准捕获 404 悬空引用并报告来源路径与行号', async () => {
            const fs = new MemoryFileSystemAdapter();
            const mainPath = path.resolve(cwd, 'src/main.css');

            await fs.writeFile(mainPath, '/* header */\n\n@import "./non-existent.css";');

            const graph = await scanCssGraph(mainPath, { fs, cwd });

            expect(graph.missingImports).toHaveLength(1);
            expect(graph.missingImports[0]).toEqual({
                from: mainPath,
                specifier: './non-existent.css',
                line: 3,
            });
        });

        it('应支持路径别名解析（@/ 与 ~/）', async () => {
            const fs = new MemoryFileSystemAdapter();
            const mainPath = path.resolve(cwd, 'src/main.css');
            const tokensPath = path.resolve(cwd, 'src/styles/tokens.css');

            await fs.writeFile(mainPath, '@import "@/styles/tokens.css";');
            await fs.writeFile(
                tokensPath,
                `${BRUTX_CSS_START_MARKER}\n:root { --brutal-bg: #000; }\n${BRUTX_CSS_END_MARKER}`
            );

            const resolveAlias = async (specifier: string) => {
                if (specifier.startsWith('@/')) {
                    return path.resolve(cwd, 'src', specifier.slice(2));
                }
                return path.resolve(cwd, specifier);
            };

            const graph = await scanCssGraph(mainPath, { fs, cwd, resolveAlias });

            expect(graph.hasBrutxTokens).toBe(true);
            expect(graph.tokenNodePaths).toEqual([tokensPath]);
            expect(graph.missingImports).toHaveLength(0);
        });
    });
});
