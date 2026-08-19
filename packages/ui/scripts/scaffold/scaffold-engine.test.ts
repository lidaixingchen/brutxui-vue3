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

    beforeEach(async () => {
        vfs = new MemoryFileSystemAdapter();
        await vfs.writeFile('/workspace/packages/ui/src/index.ts', `import './styles.css'\n`);
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
    });

    it('正常生成组件时原子创建多文件并精准注入 index.ts', async () => {
        const result = await engine.generate({
            type: 'component',
            name: 'FooBar',
            dryRun: false,
        });

        expect(result.success).toBe(true);
        expect(await vfs.pathExists('/workspace/packages/ui/src/components/foo-bar/FooBar.vue')).toBe(true);
        expect(await vfs.pathExists('/workspace/packages/ui/src/components/foo-bar/foo-bar-variants.ts')).toBe(true);
        expect(await vfs.pathExists('/workspace/packages/ui/src/components/foo-bar/foo-bar.test.ts')).toBe(true);

        const indexContent = await vfs.readFile('/workspace/packages/ui/src/index.ts');
        expect(indexContent).toContain(`export { default as FooBar } from './components/foo-bar/FooBar.vue'`);
    });

    it('过程中冲突中止时保证没有残留文件创建', async () => {
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
    });
});
