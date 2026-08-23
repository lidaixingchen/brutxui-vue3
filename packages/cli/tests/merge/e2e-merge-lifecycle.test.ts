import { describe, expect, it } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../../src/lib/project-context.js';
import { MergeExecutor } from '../../src/lib/merge/merge-executor.js';
import { updateInstalledComponents, readManifest, computeInstalledContentHash } from '../../src/lib/manifest.js';
import { integrityNoConflictMarkersRule } from '../../src/lib/diagnostics/rules/integrity-rules.js';
import type { BrutalistConfig, RegistryItem } from '../../src/lib/types.js';

describe('3-Way Merge E2E Lifecycle', () => {
    const projectCwd = process.platform === 'win32' ? 'C:/workspace/lifecycle-app' : '/workspace/lifecycle-app';

    const sampleConfig: BrutalistConfig = {
        style: 'brutalism',
        tailwind: {
            config: 'tailwind.config.js',
            css: 'src/assets/main.css',
            baseColor: 'slate',
            cssVariables: true,
        },
        aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        },
    };

    // V0.10.0 (Base)
    const buttonV010: RegistryItem = {
        name: 'button',
        type: 'registry:ui',
        title: 'Button',
        description: 'Button',
        dependencies: [],
        registryDependencies: [],
        tailwind: {},
        cssVars: {},
        integrity: 'sha256-v010',
        files: [
            {
                path: 'components/ui/button/Button.vue',
                type: 'registry:ui',
                content: '<template>\n  <button class="btn">Click</button>\n  <span>Icon</span>\n</template>',
            },
        ],
    };

    // V0.11.0 (Upstream update in different line)
    const buttonV011: RegistryItem = {
        name: 'button',
        type: 'registry:ui',
        title: 'Button',
        description: 'Button',
        dependencies: [],
        registryDependencies: [],
        tailwind: {},
        cssVars: {},
        integrity: 'sha256-v011',
        files: [
            {
                path: 'components/ui/button/Button.vue',
                type: 'registry:ui',
                content: '<template>\n  <button class="btn">Click</button>\n  <span class="icon-v011" aria-hidden="true">Icon</span>\n</template>',
            },
        ],
    };

    it('end-to-end: install -> customize -> upgrade clean merge -> conflict -> doctor diagnose', async () => {
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const buttonPath = path.join(projectCwd, 'src/components/ui/button/Button.vue');

        // Step 1: 初次安装组件 (v0.10.0)
        await fs.ensureDir(path.dirname(buttonPath));
        await fs.writeFile(buttonPath, buttonV010.files[0].content);
        const initialHash = await computeInstalledContentHash([buttonPath], fs);

        await updateInstalledComponents(
            projectCwd,
            [
                {
                    item: buttonV010,
                    registrySource: 'official',
                    files: [buttonPath],
                    installedContentHash: initialHash,
                    version: '0.10.0',
                },
            ],
            {},
            fs
        );

        const manifest1 = await readManifest(projectCwd, fs);
        expect(manifest1?.components.button.version).toBe('0.10.0');

        // Step 2: 开发者本地定制代码 (在 button 标签上添加 class="my-custom-analytics")
        const customLocalContent = '<template>\n  <button class="btn my-custom-analytics">Click</button>\n  <span>Icon</span>\n</template>';
        await fs.writeFile(buttonPath, customLocalContent);

        // Step 3: 执行版本升级 (从 v0.10.0 升级到 v0.11.0)
        const mockFetcher = async (_name: string, _src?: string, _cache?: boolean) => buttonV010;
        const executor = new MergeExecutor({ fs, itemFetcher: mockFetcher });

        const transaction = ctx.createTransaction();
        const { plan, filesWritten } = await executor.planAndExecute(
            ctx,
            'button',
            buttonV011,
            { transaction }
        );

        expect(plan.hasConflicts).toBe(false);
        expect(plan.mergedFiles).toBe(1);

        const updatedHash = await computeInstalledContentHash(filesWritten, fs);
        await updateInstalledComponents(
            projectCwd,
            [
                {
                    item: buttonV011,
                    registrySource: 'official',
                    files: filesWritten,
                    installedContentHash: updatedHash,
                    version: '0.11.0',
                },
            ],
            { transaction },
            fs
        );

        await transaction.commit();

        // 验证合并后的文件内容：本地定制 my-custom-analytics 和官方新特性 icon-v011 / aria-hidden 均完整存在
        const mergedContent = await fs.readFile(buttonPath);
        expect(mergedContent).toContain('class="btn my-custom-analytics"');
        expect(mergedContent).toContain('class="icon-v011" aria-hidden="true"');

        // 验证 manifest 已更新到 0.11.0
        const manifest2 = await readManifest(projectCwd, fs);
        expect(manifest2?.components.button.version).toBe('0.11.0');

        // Step 4: 产生真实冲突场景 (双方修改同一行)
        const buttonV012Conflict: RegistryItem = {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button',
            dependencies: [],
            registryDependencies: [],
            tailwind: {},
            cssVars: {},
            integrity: 'sha256-v012',
            files: [
                {
                    path: 'components/ui/button/Button.vue',
                    type: 'registry:ui',
                    content: '<template>\n  <button class="btn official-refactor-btn">Click</button>\n  <span class="icon-v011" aria-hidden="true">Icon</span>\n</template>',
                },
            ],
        };

        const mockFetcherV011 = async () => buttonV011;
        const executorConflict = new MergeExecutor({ fs, itemFetcher: mockFetcherV011 });

        const conflictTrans = ctx.createTransaction();
        const conflictRes = await executorConflict.planAndExecute(
            ctx,
            'button',
            buttonV012Conflict,
            { transaction: conflictTrans, isCi: false }
        );

        expect(conflictRes.plan.hasConflicts).toBe(true);
        expect(conflictRes.plan.conflictedFiles).toBe(1);

        await conflictTrans.commit();

        const conflictedFileContent = await fs.readFile(buttonPath);
        expect(conflictedFileContent).toContain('<<<<<<< LOCAL');
        expect(conflictedFileContent).toContain('my-custom-analytics');
        expect(conflictedFileContent).toContain('=======');
        expect(conflictedFileContent).toContain('official-refactor-btn');
        expect(conflictedFileContent).toContain('>>>>>>> REMOTE');

        // 验证在 CI 模式下相同冲突会触发阻断抛错
        await expect(
            executorConflict.planAndExecute(ctx, 'button', buttonV012Conflict, { isCi: true })
        ).rejects.toThrow(/\[CI Blocked\]/);

        // Step 5: Doctor 巡检诊断未解冲突标记
        const diagContext = {
            cwd: projectCwd,
            config: ctx.config,
            env: ctx.env,
            manifest: manifest2!,
            offline: false,
            fs,
        };

        const doctorResults = await integrityNoConflictMarkersRule.check(diagContext);
        expect(doctorResults.length).toBe(1);
        expect(doctorResults[0].status).toBe('error');
        expect(doctorResults[0].fixId).toBeUndefined();
        expect(doctorResults[0].message).toContain('Unresolved merge conflict markers detected');
    });
});
