import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
    analyzeModuleSource,
    createModuleResolver,
    loadModuleAliases,
} from '../src/module-resolver.js';

const temporaryDirectories: string[] = [];

function createFixture(): string {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-module-resolver-'));
    temporaryDirectories.push(directory);
    return directory;
}

function writeFixture(rootDir: string, relativePath: string, content = ''): string {
    const filePath = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
}

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

describe('module resolver', () => {
    it('解析扩展名优先级、目录 index 和 Vue SFC', () => {
        const rootDir = createFixture();
        const importer = writeFixture(rootDir, 'src/entry.ts');
        const vueFile = writeFixture(rootDir, 'src/widgets/Panel.vue', '<template />');
        writeFixture(rootDir, 'src/widgets/index.ts');
        const resolver = createModuleResolver({ rootDir });

        const vueResult = resolver.resolve(importer, './widgets/Panel');
        const directoryResult = resolver.resolve(importer, './widgets');

        expect(vueResult.kind).toBe('internal');
        expect(vueResult.resolvedPath).toBe(path.resolve(vueFile).split(path.sep).join('/'));
        expect(directoryResult.normalizedPath).toBe('src/widgets/index.ts');
    });

    it('合并 tsconfig paths 与 Vite alias，并保留实际 importer', () => {
        const rootDir = createFixture();
        const tsconfigPath = writeFixture(rootDir, 'tsconfig.json', JSON.stringify({
            compilerOptions: {
                baseUrl: '.',
                paths: { '@/*': ['src/*'] },
            },
        }));
        const importer = writeFixture(rootDir, 'src/entry.ts');
        writeFixture(rootDir, 'src/lib/helper.ts');
        const aliases = loadModuleAliases(tsconfigPath);
        const resolver = createModuleResolver({
            rootDir,
            tsconfigPath,
            viteAliases: [{ find: '@', replacement: path.join(rootDir, 'src') }],
        });

        const result = resolver.resolve(importer, '@/lib/helper');

        expect(aliases).toHaveLength(1);
        expect(result.kind).toBe('internal');
        expect(result.importer).toBe(path.resolve(importer).split(path.sep).join('/'));
        expect(result.normalizedPath).toBe('src/lib/helper.ts');
    });

    it('在大小写不匹配时返回明确诊断', () => {
        const rootDir = createFixture();
        const importer = writeFixture(rootDir, 'src/entry.ts');
        writeFixture(rootDir, 'src/Actual.ts');
        const resolver = createModuleResolver({ rootDir, enforceCaseSensitive: true });

        const result = resolver.resolve(importer, './actual');

        expect(result.kind).toBe('unresolved');
        expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('MODULE_PATH_CASE_MISMATCH');
        expect(result.diagnostics[0]?.importer).toBe(path.resolve(importer).split(path.sep).join('/'));
    });

    it('在同优先级别名指向多个文件时返回歧义诊断', () => {
        const rootDir = createFixture();
        const importer = writeFixture(rootDir, 'src/entry.ts');
        writeFixture(rootDir, 'src/first/item.ts');
        writeFixture(rootDir, 'src/second/item.ts');
        const resolver = createModuleResolver({
            rootDir,
            aliases: [
                { find: '@', replacement: path.join(rootDir, 'src/first') },
                { find: '@', replacement: path.join(rootDir, 'src/second') },
            ],
        });

        const result = resolver.resolve(importer, '@/item');

        expect(result.kind).toBe('ambiguous');
        expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('MODULE_ALIAS_AMBIGUOUS');
        expect(result.candidates).toHaveLength(2);
    });

    it('保留外部包身份并识别 Node 内置模块', () => {
        const rootDir = createFixture();
        const importer = writeFixture(rootDir, 'src/entry.ts');
        const resolver = createModuleResolver({ rootDir });

        const scoped = resolver.resolve(importer, '@vue/compiler-sfc');
        const nodeBuiltin = resolver.resolve(importer, 'node:path');

        expect(scoped.kind).toBe('external');
        expect(scoped.packageName).toBe('@vue/compiler-sfc');
        expect(nodeBuiltin.kind).toBe('external');
        expect(nodeBuiltin.packageName).toBe('node:path');
        expect(nodeBuiltin.isNodeBuiltin).toBe(true);
    });
});

describe('SfcAstEngine module analysis adapter', () => {
    it('分别记录类型、重导出、静态动态引用并报告不可静态动态引用', () => {
        const importer = '/tmp/module-resolver-fixture/component.vue';
        const source = `<script setup lang="ts">
import type { Item } from './types'
export type { Item } from './types'
const load = () => import('./lazy')
const loadDynamic = (name: string) => import(name)
</script>`;

        const result = analyzeModuleSource(source, importer);
        const kinds = result.analysis.references.map((reference) => reference.kind);

        expect(kinds).toEqual(['import-declaration', 'export-declaration', 'dynamic-import']);
        expect(result.analysis.references[0]?.isTypeOnly).toBe(true);
        expect(result.analysis.references[1]?.isTypeOnly).toBe(true);
        expect(result.analysis.references[2]?.isDynamic).toBe(true);
        expect(result.analysis.diagnostics.map((diagnostic) => diagnostic.code)).toContain('AST_DYNAMIC_IMPORT_NON_LITERAL');
        expect(result.analysis.completeness).toBe('partial');
    });
});
