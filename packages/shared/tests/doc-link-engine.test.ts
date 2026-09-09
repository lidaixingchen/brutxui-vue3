import { describe, it, expect, beforeEach } from 'vitest';
import { DocLinkEngine } from '../../../scripts/docs/lib/doc-link-engine.mjs';
import { MemoryFileSystemAdapter } from '../../../scripts/docs/lib/doc-link-fs.mjs';

describe('DocLinkEngine (文档链接检查与自愈引擎)', () => {
    let vfs: MemoryFileSystemAdapter;
    const ROOT = '/workspace';

    beforeEach(() => {
        vfs = new MemoryFileSystemAdapter();
    });

    describe('CommonMark 分词与代码围栏保护', () => {
        it('正确跳过 4 级反引号嵌套 3 级反引号的代码块，不提取伪链接', async () => {
            const content = [
                '# 测试围栏',
                '````carousel',
                '```ts',
                '[fake-link](fake-target.md)',
                '```',
                '````',
                '[real-link](./guides/REAL.md)',
            ].join('\n');

            await vfs.writeFile(`${ROOT}/docs/guides/REAL.md`, '# Real');
            await vfs.writeFile(`${ROOT}/docs/test.md`, content);

            const engine = new DocLinkEngine(vfs, { rootDir: ROOT, targetFiles: ['docs/test.md'] });
            const report = await engine.scan();

            expect(report.dead.length).toBe(0);
            expect(report.scannedCount).toBe(1);
        });

        it('行内多反引号代码块中的链接展示示例在 fix 时不被改写', async () => {
            const content = [
                '# 行内代码示例',
                '请勿修改此示例：`` `[demo](old-path.md)` ``',
                '有效链接：[有效目标](./target.md)',
            ].join('\n');

            await vfs.writeFile(`${ROOT}/docs/target.md`, '# Target');
            await vfs.writeFile(`${ROOT}/docs/test.md`, content);

            const engine = new DocLinkEngine(vfs, { rootDir: ROOT, targetFiles: ['docs/test.md'] });
            const fixResult = await engine.fix();

            expect(fixResult.changedLinks).toBe(0);
            const after = await vfs.readFile(`${ROOT}/docs/test.md`);
            expect(after).toBe(content);
        });
    });

    describe('跨平台大小写一致性核验与自愈', () => {
        it('能够精准识别大小写假阳性并自愈为真实大小写', async () => {
            // 在内存文件系统中写入正确的大写文件
            await vfs.writeFile(`${ROOT}/docs/guides/VISUAL_SYSTEM.md`, '# Visual System');
            // 在另一篇文档中误写为小写文件名
            await vfs.writeFile(`${ROOT}/docs/plans/ui/demo.md`, '[视觉规范](../../guides/visual_system.md)');

            const engine = new DocLinkEngine(vfs, {
                rootDir: ROOT,
                targetFiles: ['docs/plans/ui/demo.md', 'docs/guides/VISUAL_SYSTEM.md'],
            });

            const report = await engine.scan();
            expect(report.caseErrors.length).toBe(1);
            expect(report.caseErrors[0].target).toBe('../../guides/visual_system.md');
            expect(report.caseErrors[0].realTarget).toBe('../../guides/VISUAL_SYSTEM.md');

            // 执行自愈
            const fixResult = await engine.fix();
            expect(fixResult.changedFiles).toBe(1);

            // 复测验证：大小写错误清零
            const afterReport = await engine.scan();
            expect(afterReport.caseErrors.length).toBe(0);
            expect(afterReport.dead.length).toBe(0);

            const fixedContent = await vfs.readFile(`${ROOT}/docs/plans/ui/demo.md`);
            expect(fixedContent).toContain('[视觉规范](../../guides/VISUAL_SYSTEM.md)');
        });
    });

    describe('纯动态 Basename 倒排索引自愈', () => {
        it('文档归档移动后，零配置自动纠偏重算相对路径', async () => {
            // 原活跃方案已移入 2026 年度归档目录
            await vfs.writeFile(
                `${ROOT}/docs/archive/2026/cli/Tailwind解耦方案.md`,
                '# Tailwind 归档方案'
            );
            // 引用方仍指向旧位置 docs/plans/Tailwind解耦方案.md
            await vfs.writeFile(
                `${ROOT}/docs/guides/DOC_GOVERNANCE.md`,
                '[关联方案](../plans/Tailwind解耦方案.md)'
            );

            const engine = new DocLinkEngine(vfs, {
                rootDir: ROOT,
                targetFiles: [
                    'docs/archive/2026/cli/Tailwind解耦方案.md',
                    'docs/guides/DOC_GOVERNANCE.md',
                ],
            });

            // 扫描阶段：死链被标记并给出启发式建议
            const report = await engine.scan();
            expect(report.dead.length).toBe(1);
            expect(report.dead[0].heuristicFix).toBe('../archive/2026/cli/Tailwind解耦方案.md');

            // 执行修复
            const fixResult = await engine.fix();
            expect(fixResult.changedFiles).toBe(1);

            // 修复后再次扫描：0 死链
            const afterReport = await engine.scan();
            expect(afterReport.dead.length).toBe(0);

            const fixedDoc = await vfs.readFile(`${ROOT}/docs/guides/DOC_GOVERNANCE.md`);
            expect(fixedDoc).toBe('[关联方案](../archive/2026/cli/Tailwind解耦方案.md)');
        });

        it('命中保留字黑名单（如 README.md）时安全阻断，不进行盲目猜测', async () => {
            await vfs.writeFile(`${ROOT}/packages/cli/README.md`, '# CLI Readme');
            await vfs.writeFile(`${ROOT}/packages/ui/README.md`, '# UI Readme');
            await vfs.writeFile(
                `${ROOT}/docs/guides/index.md`,
                '[说明](./README.md)' // 此处不存在 README.md
            );

            const engine = new DocLinkEngine(vfs, {
                rootDir: ROOT,
                targetFiles: ['docs/guides/index.md'],
            });

            const report = await engine.scan();
            expect(report.dead.length).toBe(1);
            // 黑名单保护：不猜测
            expect(report.dead[0].heuristicFix).toBeNull();

            // fix 亦不发生改写
            const fixResult = await engine.fix();
            expect(fixResult.changedFiles).toBe(0);
        });
    });

    describe('锚点解析与 VitePress 自定义 id 兼容', () => {
        it('能够正确识别 VitePress 自定义锚点与清洗内联 HTML', async () => {
            const targetContent = [
                '# 组件总览',
                '## 按钮 <code>Button</code> {#custom-btn}',
                '## 正常标题',
            ].join('\n');

            await vfs.writeFile(`${ROOT}/docs/guides/components.md`, targetContent);
            await vfs.writeFile(
                `${ROOT}/docs/plans/demo.md`,
                '[自定义锚点](../guides/components.md#custom-btn)\n[正常锚点](../guides/components.md#正常标题)'
            );

            const engine = new DocLinkEngine(vfs, {
                rootDir: ROOT,
                targetFiles: ['docs/guides/components.md', 'docs/plans/demo.md'],
            });

            const report = await engine.scan();
            expect(report.dead.length).toBe(0);
            expect(report.anchorWarn.length).toBe(0);
        });
    });

    describe('高危边界与防御性自愈增强', () => {
        it('链接文本与目标完全同名时，精准替换 URL 且绝不损坏展示文本', async () => {
            // 测试针对 indexOf 前向误匹配的防御：展示文本也是 target.md
            const content = '参考链接：[target.md](target.md)';
            await vfs.writeFile(`${ROOT}/docs/guides/target.md`, '# New Target Location');
            await vfs.writeFile(`${ROOT}/docs/plans/ui/doc.md`, content);

            const engine = new DocLinkEngine(vfs, {
                rootDir: ROOT,
                targetFiles: ['docs/guides/target.md', 'docs/plans/ui/doc.md'],
            });

            const fixResult = await engine.fix();
            expect(fixResult.changedFiles).toBe(1);

            const after = await vfs.readFile(`${ROOT}/docs/plans/ui/doc.md`);
            // 文本 "[target.md]" 必须完好无损，圆括号内的 URL 被替换为相对路径
            expect(after).toBe('参考链接：[target.md](../../guides/target.md)');
        });

        it('能够正确解析并识别 URL 百分号编码路径', async () => {
            await vfs.writeFile(`${ROOT}/docs/guides/设计规范.md`, '# 设计规范');
            await vfs.writeFile(
                `${ROOT}/docs/plans/doc.md`,
                '[设计规范](../guides/%E8%AE%BE%E8%AE%A1%E8%A7%84%E8%8C%83.md)'
            );

            const engine = new DocLinkEngine(vfs, {
                rootDir: ROOT,
                targetFiles: ['docs/guides/设计规范.md', 'docs/plans/doc.md'],
            });

            const report = await engine.scan();
            // 能够正常识别并存在，不产生 404 死链
            expect(report.dead.length).toBe(0);
        });

        it('多重同名方案在不同领域（cli vs ui）下按领域精准消歧自愈', async () => {
            // cli 领域有一个 config.md，ui 领域也有一个同名 config.md
            await vfs.writeFile(`${ROOT}/docs/plans/cli/config.md`, '# CLI Config');
            await vfs.writeFile(`${ROOT}/docs/plans/ui/config.md`, '# UI Config');

            // 位于 ui 领域的一篇方案，引用了失效的相对路径 config.md
            await vfs.writeFile(`${ROOT}/docs/plans/ui/feature.md`, '[配置方案](../config.md)');

            const engine = new DocLinkEngine(vfs, {
                rootDir: ROOT,
                targetFiles: [
                    'docs/plans/cli/config.md',
                    'docs/plans/ui/config.md',
                    'docs/plans/ui/feature.md',
                ],
            });

            const report = await engine.scan();
            expect(report.dead.length).toBe(1);
            // 应该精准自愈到同在 ui 领域的 config.md，而不是跨领域漂移到 cli
            expect(report.dead[0].heuristicFix).toBe('config.md');

            await engine.fix();
            const after = await vfs.readFile(`${ROOT}/docs/plans/ui/feature.md`);
            expect(after).toBe('[配置方案](config.md)');
        });

        it('跨生命周期安全防线：Tier 1 常青文档禁止自动自愈连入 Tier 2 历史归档', async () => {
            // 历史归档区（Tier 2）存在一个已被废弃的普通文档
            await vfs.writeFile(`${ROOT}/docs/archive/2026/core/legacy.md`, '# 历史废弃普通文档');
            // 常青规范文档（Tier 1）误写了一个普通死链
            await vfs.writeFile(`${ROOT}/docs/guides/VISUAL_SYSTEM.md`, '[过时引用](../components/legacy.md)');

            const engine = new DocLinkEngine(vfs, {
                rootDir: ROOT,
                targetFiles: ['docs/archive/2026/core/legacy.md', 'docs/guides/VISUAL_SYSTEM.md'],
            });

            const report = await engine.scan();
            expect(report.dead.length).toBe(1);
            // 常青文档非方案类死链被拦截，禁止自愈连入历史归档区
            expect(report.dead[0].heuristicFix).toBeNull();

            // fix 执行时不盲目改写
            const fixResult = await engine.fix();
            expect(fixResult.changedFiles).toBe(0);
        });

        it('自愈时完整保留末尾 #anchor 锚点与尖括号包裹', async () => {
            await vfs.writeFile(`${ROOT}/docs/guides/detail.md`, '# 标题\n## 细节 {#detail-anchor}');
            await vfs.writeFile(
                `${ROOT}/docs/plans/doc.md`,
                '链接：[详情](<./old/detail.md#detail-anchor>)'
            );

            const engine = new DocLinkEngine(vfs, {
                rootDir: ROOT,
                targetFiles: ['docs/guides/detail.md', 'docs/plans/doc.md'],
            });

            const report = await engine.scan();
            expect(report.dead.length).toBe(1);

            await engine.fix();
            const after = await vfs.readFile(`${ROOT}/docs/plans/doc.md`);
            // 尖括号与 #detail-anchor 完整保留
            expect(after).toBe('链接：[详情](<../guides/detail.md#detail-anchor>)');
        });
    });

    describe('改写幂等性保障', () => {
        it('连续运行多次 fix，第二轮改写文件数严格为 0', async () => {
            await vfs.writeFile(`${ROOT}/docs/archive/2026/ui/Button方案.md`, '# Button Doc');
            await vfs.writeFile(`${ROOT}/docs/plans/menu.md`, '[Button](../plans/ui/Button方案.md)');

            const engine = new DocLinkEngine(vfs, {
                rootDir: ROOT,
                targetFiles: ['docs/archive/2026/ui/Button方案.md', 'docs/plans/menu.md'],
            });

            const firstFix = await engine.fix();
            expect(firstFix.changedFiles).toBe(1);

            const secondFix = await engine.fix();
            expect(secondFix.changedFiles).toBe(0);
            expect(secondFix.changedLinks).toBe(0);
        });
    });
});
