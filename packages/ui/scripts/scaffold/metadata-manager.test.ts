import { describe, it, expect, beforeEach } from 'vitest';
import ts from 'typescript';
import { MetadataManager } from './metadata-manager.js';

describe('MetadataManager (AST-assisted Component Metadata Insertion)', () => {
    let metadataManager: MetadataManager;

    beforeEach(() => {
        metadataManager = new MetadataManager();
    });

    const sampleComponentsSource = `import type { RegistryComponentMeta } from './types.js';

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
    dialog: {
        titleZh: '对话框',
        category: 'overlay',
        dependencies: ['reka-ui'],
        description: 'Modal dialog.',
    },
};
`;

    it('能够按字母序在中间位置插入新组件元数据并保留缩进与格式', () => {
        const result = metadataManager.injectComponentMeta(sampleComponentsSource, {
            kebabName: 'alert',
            titleZh: '提示',
            category: 'feedback',
            dependencies: ['reka-ui', '@lucide/vue'],
            description: 'Alert component.',
        });

        expect(result).toContain('alert: {');
        expect(result).toContain("titleZh: '提示',");
        expect(result).toContain("category: 'feedback',");

        // 验证字母顺序：accordion -> alert -> button -> dialog
        const accordionIdx = result.indexOf('accordion: {');
        const alertIdx = result.indexOf('alert: {');
        const buttonIdx = result.indexOf('button: {');
        const dialogIdx = result.indexOf('dialog: {');

        expect(accordionIdx).toBeLessThan(alertIdx);
        expect(alertIdx).toBeLessThan(buttonIdx);
        expect(buttonIdx).toBeLessThan(dialogIdx);
    });

    it('能够按字母序在首位插入新组件元数据', () => {
        const result = metadataManager.injectComponentMeta(sampleComponentsSource, {
            kebabName: 'aa-test',
            titleZh: 'AA测试',
            category: 'utility',
            dependencies: ['reka-ui'],
            description: 'Test component.',
        });

        expect(result).toContain("'aa-test': {");
        const aaIdx = result.indexOf("'aa-test': {");
        const accordionIdx = result.indexOf('accordion: {');
        expect(aaIdx).toBeLessThan(accordionIdx);
    });

    it('能够按字母序在末尾插入新组件元数据且无双逗号或语法错误', () => {
        const result = metadataManager.injectComponentMeta(sampleComponentsSource, {
            kebabName: 'toast',
            titleZh: '通知',
            category: 'feedback',
            dependencies: ['@lucide/vue'],
            description: 'Toast component.',
        });

        expect(result).toContain('toast: {');
        const dialogIdx = result.indexOf('dialog: {');
        const toastIdx = result.indexOf('toast: {');
        expect(dialogIdx).toBeLessThan(toastIdx);

        // 验证无双逗号
        expect(result).not.toContain('},\n,');
        expect(result).not.toContain('},\n    ,');

        // 验证生成的 TS 代码完全语法合法
        const sf = ts.createSourceFile('test.ts', result, ts.ScriptTarget.Latest, true);
        expect(sf.parseDiagnostics.length).toBe(0);
    });

    it('对包含单引号与反斜杠的输入能够正确转义', () => {
        const result = metadataManager.injectComponentMeta(sampleComponentsSource, {
            kebabName: 'special',
            titleZh: "带有 '单引号' 和 \\ 路径的组件",
            category: 'utility',
            dependencies: ['reka-ui'],
            description: "It's a \\special\\ component.",
        });

        expect(result).toContain("titleZh: '带有 \\'单引号\\' 和 \\\\ 路径的组件',");
        expect(result).toContain("description: 'It\\'s a \\\\special\\\\ component.',");

        const sf = ts.createSourceFile('test.ts', result, ts.ScriptTarget.Latest, true);
        expect(sf.parseDiagnostics.length).toBe(0);
    });

    it('若组件已存在则幂等返回原内容不重复插入', () => {
        const result = metadataManager.injectComponentMeta(sampleComponentsSource, {
            kebabName: 'button',
            titleZh: '新按钮',
            category: 'action',
            dependencies: [],
            description: 'New button.',
        });

        expect(result).toBe(sampleComponentsSource);
    });
});
