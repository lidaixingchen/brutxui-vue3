import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { BarrelManager } from './barrel-manager.js';
import { ScaffoldEngine } from './scaffold-engine.js';

describe('BarrelManager (AST-assisted Line-Slice Injection)', () => {
    let barrelManager: BarrelManager;

    beforeEach(() => {
        barrelManager = new BarrelManager();
    });

    it('能够无损插入新导出并保留既有注释与格式', () => {
        const original = `import './styles.css'

// 基础组件
export { default as Button } from './components/button/Button.vue'
export { buttonVariants } from './components/button/button-variants'
`;
        const newExports = [
            `export { default as Avatar } from './components/avatar/Avatar.vue'`,
        ];

        const result = barrelManager.injectExports(original, newExports);
        expect(result).toContain(`export { default as Avatar } from './components/avatar/Avatar.vue'`);
        expect(result).toContain(`// 基础组件`);
        expect(result).toContain(`import './styles.css'`);
    });

    it('如果导出已存在则幂等跳过不重复追加', () => {
        const original = `export { default as Button } from './components/button/Button.vue'\n`;
        const result = barrelManager.injectExports(original, [
            `export { default as Button } from './components/button/Button.vue'`,
        ]);
        expect(result).toBe(original);
    });
});

describe('ScaffoldEngine (Transactional VFS Scaffolder)', () => {
    let vfs: MemoryFileSystemAdapter;
    let engine: ScaffoldEngine;

    const sampleComponentsTs = `import type { RegistryComponentMeta } from './types.js';

export const COMPONENTS: Record<string, RegistryComponentMeta> = {
    accordion: {
        titleZh: '折叠面板',
        category: 'navigation',
        dependencies: ['reka-ui', '@lucide/vue'],
        description: 'Collapsible content sections with keyboard navigation.',
    },
    button: {
        titleZh: '按钮',
        category: 'action',
        dependencies: ['reka-ui', '@lucide/vue'],
        description: 'Interactive button.',
    },
};
`;

    const sampleApiContractTs = `export const API_CONTRACT = {
    modules: [
    ],
    entries: [
        { id: 'root', subpath: '.', kind: 'root',
            moduleIds: ['root'],
            exports: [
            ],
        },
        { id: 'composables', subpath: './composables', kind: 'root',
            moduleIds: ['root'],
            exports: [
            ],
        },
    ],
    registry: [
    ],
}
`;

    async function installApiContract(): Promise<void> {
        await vfs.writeFile('/workspace/packages/ui/api-contract.ts', sampleApiContractTs);
    }

    beforeEach(async () => {
        vfs = new MemoryFileSystemAdapter();
        await vfs.writeFile('/workspace/packages/ui/src/index.ts', `import './styles.css'\n`);
        await vfs.writeFile('/workspace/packages/shared/src/components.ts', sampleComponentsTs);
        engine = new ScaffoldEngine({
            fs: vfs,
            projectRoot: '/workspace',
        });
    });

    it('dryRun 模式下只返回文件预览清单而不写盘', async () => {
        const plan = await engine.generate({
            type: 'component',
            name: 'DemoCard',
            dryRun: true,
        });

        expect(plan.success).toBe(true);
        expect(plan.files.length).toBeGreaterThan(0);
        expect(await vfs.pathExists('/workspace/packages/ui/src/components/demo-card/DemoCard.vue')).toBe(false);

        // 验证 dryRun 时 components.ts 未被篡改
        const metaContent = await vfs.readFile('/workspace/packages/shared/src/components.ts');
        expect(metaContent).toBe(sampleComponentsTs);
    });

    it('正常生成组件时原子创建多文件并返回导出意图与 components.ts', async () => {
        const result = await engine.generate({
            type: 'component',
            name: 'AlertBox',
            dryRun: false,
        });

        expect(result.success).toBe(true);
        expect(await vfs.pathExists('/workspace/packages/ui/src/components/alert-box/AlertBox.vue')).toBe(true);
        expect(await vfs.pathExists('/workspace/packages/ui/src/components/alert-box/alert-box-variants.ts')).toBe(true);
        expect(await vfs.pathExists('/workspace/packages/ui/src/components/alert-box/alert-box.test.ts')).toBe(true);

        const indexContent = await vfs.readFile('/workspace/packages/ui/src/index.ts');
        expect(indexContent).toBe(`import './styles.css'\n`);
        expect(result.injectedExports).toContain(`export { default as AlertBox } from './components/alert-box/AlertBox.vue'`);

        const metaContent = await vfs.readFile('/workspace/packages/shared/src/components.ts');
        expect(metaContent).toContain("'alert-box': {");
        expect(metaContent).toContain("titleZh: 'AlertBox 组件',");
        // 验证字母顺序：accordion -> alert-box -> button
        const accordionIdx = metaContent.indexOf('accordion: {');
        const alertBoxIdx = metaContent.indexOf("'alert-box': {");
        const buttonIdx = metaContent.indexOf('button: {');
        expect(accordionIdx).toBeLessThan(alertBoxIdx);
        expect(alertBoxIdx).toBeLessThan(buttonIdx);
    });

    it('公开组件生成会原子登记 API 契约、根入口投影与 Registry 映射', async () => {
        await installApiContract();

        const result = await engine.generate({
            type: 'component',
            name: 'AlertBox',
            dryRun: false,
        });

        expect(result.success).toBe(true);
        const contract = await vfs.readFile('/workspace/packages/ui/api-contract.ts');
        expect(contract).toContain("id: 'component:alert-box'");
        expect(contract).toContain("subpath: './alert-box'");
        expect(contract).toContain("publicName: 'AlertBox'");
        expect(contract).toContain("publicName: 'alertBoxVariants'");
        expect(contract).toContain("componentId: 'alert-box'");
        expect(contract).toContain("entryId: 'component:alert-box'");
        expect(result.files.map((file) => file.filePath)).toContain('/workspace/packages/ui/api-contract.ts');
    });

    it('公开组合式函数同时登记子路径与 composables 聚合投影', async () => {
        await installApiContract();

        const result = await engine.generate({
            type: 'composable',
            name: 'useSearchState',
            dryRun: false,
        });

        expect(result.success).toBe(true);
        const contract = await vfs.readFile('/workspace/packages/ui/api-contract.ts');
        expect(contract).toContain("id: 'composable:useSearchState'");
        expect(contract).toContain("subpath: './useSearchState'");
        expect(contract).toContain("publicName: 'useSearchState'");
        expect(contract).toContain("publicName: 'UseSearchStateOptions'");
        expect(contract).toContain("publicName: 'UseSearchStateReturn'");
    });

    it('内部组件只登记归属模块，不会扩张公开入口', async () => {
        await installApiContract();

        const result = await engine.generate({
            type: 'component',
            name: 'InternalCard',
            public: false,
            dryRun: false,
        });

        expect(result.success).toBe(true);
        const contract = await vfs.readFile('/workspace/packages/ui/api-contract.ts');
        expect(contract).toContain("id: 'component:internal-card'");
        expect(contract).toContain("public: false");
        expect(contract).not.toContain("subpath: './internal-card'");
        expect(contract).not.toContain("publicName: 'InternalCard'");
    });

    it('登记写入失败时回滚已创建骨架与契约内容', async () => {
        await installApiContract();
        const originalContract = await vfs.readFile('/workspace/packages/ui/api-contract.ts');
        const writeFile = vfs.writeFile.bind(vfs);
        vfs.writeFile = async (filePath, content, encoding) => {
            if (filePath === '/workspace/packages/ui/api-contract.ts') {
                throw new Error('injected API contract write failure');
            }
            await writeFile(filePath, content, encoding);
        };

        const result = await engine.generate({
            type: 'component',
            name: 'RollbackCard',
            dryRun: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('已自动回滚');
        expect(await vfs.pathExists('/workspace/packages/ui/src/components/rollback-card/RollbackCard.vue')).toBe(false);
        expect(await vfs.readFile('/workspace/packages/ui/api-contract.ts')).toBe(originalContract);
        expect(await vfs.readFile('/workspace/packages/shared/src/components.ts')).toBe(sampleComponentsTs);
    });

    it('过程中冲突中止时保证没有残留文件创建且回滚 components.ts', async () => {
        await vfs.writeFile('/workspace/packages/ui/src/components/conflict-item/ConflictItem.vue', 'existing');

        const result = await engine.generate({
            type: 'component',
            name: 'ConflictItem',
            dryRun: false,
            overwrite: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('已存在');
        expect(await vfs.pathExists('/workspace/packages/ui/src/components/conflict-item/conflict-item-variants.ts')).toBe(false);

        const metaContent = await vfs.readFile('/workspace/packages/shared/src/components.ts');
        expect(metaContent).toBe(sampleComponentsTs);
    });
});
