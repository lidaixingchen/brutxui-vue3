import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
    checkApiDependencies,
    formatDependencyDiagnostics,
} from './check-api-dependencies';
import type { ApiContract, ApiLayer } from 'brutx-shared-vue/api-contract';

const temporaryDirectories: string[] = [];

function createFixture(): string {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-api-dependencies-'));
    temporaryDirectories.push(directory);
    return directory;
}

function writeFixture(rootDir: string, relativePath: string, content = ''): string {
    const filePath = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
}

function contractFor(...modules: Array<{ path: string; layer: string }>): ApiContract {
    return {
        modules: modules.map((module, index) => ({
            id: `fixture:${index}`,
            source: module.path,
            owner: `fixture:${index}`,
            layer: module.layer as ApiLayer,
            public: false,
        })),
        entries: [],
        registry: [],
    };
}

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

describe('checkApiDependencies', () => {
    it('通过相对路径、tsconfig alias、目录 index、Vue、重导出和静态动态导入', () => {
        const packageRoot = createFixture();
        const entry = writeFixture(packageRoot, 'src/foundation/Entry.ts', `
import Helper from '@/runtime/helper'
export { default as VuePanel } from './VuePanel'
const load = () => import('./VuePanel')
`);
        writeFixture(packageRoot, 'src/runtime/helper.ts', 'export default 1');
        writeFixture(packageRoot, 'src/foundation/VuePanel.vue', '<template />');
        writeFixture(packageRoot, 'src/composite/Panel.vue', '<template />');
        writeFixture(packageRoot, 'src/composite/index.ts', "export { default as Panel } from './Panel.vue'\n");
        const tsconfigPath = writeFixture(packageRoot, 'tsconfig.json', JSON.stringify({
            compilerOptions: { baseUrl: '.', paths: { '@/*': ['src/*'] } },
        }));

        const result = checkApiDependencies({
            packageRoot,
            files: [entry],
            contract: contractFor(
                { path: 'src/foundation', layer: 'foundation' },
                { path: 'src/runtime', layer: 'runtime/helper' },
                { path: 'src/composite', layer: 'composite' },
            ),
            tsconfigPath,
        });

        expect(result.passed).toBe(true);
        expect(result.graph.edges.some((edge) => edge.isDynamic && edge.target?.endsWith('/VuePanel.vue'))).toBe(true);
        expect(result.graph.edges.some((edge) => edge.kind === 'export-declaration')).toBe(true);
    });

    it('拒绝 foundation 直接依赖 higher composite', () => {
        const packageRoot = createFixture();
        const entry = writeFixture(packageRoot, 'src/foundation/Entry.ts', "import Panel from '../composite/Panel.vue'\n");
        writeFixture(packageRoot, 'src/composite/Panel.vue', '<template />');

        const result = checkApiDependencies({
            packageRoot,
            files: [entry],
            contract: contractFor(
                { path: 'src/foundation', layer: 'foundation' },
                { path: 'src/composite', layer: 'composite' },
            ),
        });

        expect(result.passed).toBe(false);
        expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('DEPENDENCY_LAYER_VIOLATION');
    });

    it('追踪 barrel 的真实叶子并拒绝绕过层级', () => {
        const packageRoot = createFixture();
        const entry = writeFixture(packageRoot, 'src/foundation/Entry.ts', "import { Panel } from '../foundation/barrel'\n");
        writeFixture(packageRoot, 'src/foundation/barrel.ts', "export { default as Panel } from '../composite/Panel.vue'\n");
        writeFixture(packageRoot, 'src/composite/Panel.vue', '<template />');

        const result = checkApiDependencies({
            packageRoot,
            files: [entry],
            contract: contractFor(
                { path: 'src/foundation', layer: 'foundation' },
                { path: 'src/composite', layer: 'composite' },
            ),
        });

        expect(result.passed).toBe(false);
        expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('DEPENDENCY_BARREL_BYPASS');
        expect(formatDependencyDiagnostics(result, packageRoot)).toContain('barrel 重导出越过层级');
    });

    it('把类型边独立记录，但类型循环仍然失败', () => {
        const packageRoot = createFixture();
        const first = writeFixture(packageRoot, 'src/foundation/first.ts', "import type { Second } from './second'\nexport type { Second } from './second'\nexport interface First {}\n");
        writeFixture(packageRoot, 'src/foundation/second.ts', "import type { First } from './first'\nexport type { First } from './first'\nexport interface Second {}\n");

        const result = checkApiDependencies({
            packageRoot,
            files: [first],
            contract: contractFor({ path: 'src/foundation', layer: 'foundation' }),
        });

        expect(result.graph.edges.filter((edge) => edge.isTypeOnly)).toHaveLength(4);
        expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('DEPENDENCY_CYCLE');
        expect(result.passed).toBe(false);
    });

    it('明确报告大小写、未解析、动态引用和 runtime Node 依赖', () => {
        const packageRoot = createFixture();
        const entry = writeFixture(packageRoot, 'src/runtime/entry.ts', `
import './Missing'
import './Actual'
import 'node:path'
const load = (name: string) => import(name)
const requireDynamic = (name: string) => require(name)
`);
        writeFixture(packageRoot, 'src/runtime/actual.ts', 'export default 1');

        const result = checkApiDependencies({
            packageRoot,
            files: [entry],
            contract: contractFor({ path: 'src/runtime', layer: 'runtime/helper' }),
        });

        expect(result.passed).toBe(false);
        const codes = result.diagnostics.map((diagnostic) => diagnostic.code);
        expect(codes).toContain('MODULE_NOT_FOUND');
        expect(codes).toContain('MODULE_PATH_CASE_MISMATCH');
        expect(codes).toContain('MODULE_DYNAMIC_IMPORT_UNDECLARED');
        expect(codes).toContain('MODULE_DYNAMIC_REQUIRE_UNDECLARED');
        expect(codes).toContain('RUNTIME_BUILD_DEPENDENCY');
        const unresolved = result.diagnostics.find((diagnostic) => diagnostic.code === 'MODULE_NOT_FOUND');
        expect(unresolved?.range?.startLine).toBeTypeOf('number');
    });

    it('允许契约显式声明不可静态解析的动态引用', () => {
        const packageRoot = createFixture();
        const entry = writeFixture(packageRoot, 'src/runtime/entry.ts', 'export const load = (name: string) => import(name)\n');

        const result = checkApiDependencies({
            packageRoot,
            files: [entry],
            contract: {
                ...contractFor({ path: 'src/runtime', layer: 'runtime/helper' }),
                dynamicDependencies: [{ importer: 'src/runtime/entry.ts', specifier: '*' }],
            },
        });

        expect(result.passed).toBe(true);
        expect(result.diagnostics.some((diagnostic) => diagnostic.code === 'MODULE_DYNAMIC_IMPORT_UNDECLARED')).toBe(false);
    });

    it('拒绝同一路径的冲突层级声明', () => {
        const packageRoot = createFixture();
        const entry = writeFixture(packageRoot, 'src/foundation/entry.ts', 'export const value = 1\n');

        const result = checkApiDependencies({
            packageRoot,
            files: [entry],
            contract: contractFor(
                { path: 'src/foundation', layer: 'foundation' },
                { path: 'src/foundation', layer: 'composite' },
            ),
        });

        expect(result.passed).toBe(false);
        expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('CONTRACT_MODULE_LAYER_AMBIGUOUS');
    });

    it('拒绝没有契约归属的源码模块', () => {
        const packageRoot = createFixture();
        const entry = writeFixture(packageRoot, 'src/unknown/entry.ts', 'export const value = 1\n');

        const result = checkApiDependencies({
            packageRoot,
            files: [entry],
            contract: contractFor({ path: 'src/foundation', layer: 'foundation' }),
        });

        expect(result.passed).toBe(false);
        expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('MODULE_LAYER_UNDECLARED');
    });
});
