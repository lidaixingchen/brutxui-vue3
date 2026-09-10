import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractReleaseNotes, parseReleaseSection } from '../../../scripts/release/extract-release-notes.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

describe('parseReleaseSection', () => {
    it('正确解析包含 compareUrl 和分类正文的版本段落', () => {
        const fixture = `
# 更新日志

## [Unreleased](https://github.com/example/repo/compare/v1.0.0...HEAD)

## [1.0.0](https://github.com/example/repo/compare/v0.9.0...v1.0.0) - 2026-09-09

### ✨ Features
* **ui:** 新增基础按钮

### 🐛 Bug Fixes
* **cli:** 修复路径参数

## [0.9.0](https://github.com/example/repo/compare/v0.8.0...v0.9.0) - 2026-08-01

### 🐛 Bug Fixes
* 旧修复
`;
        const result = parseReleaseSection(fixture, '1.0.0');
        expect(result).not.toBeNull();
        expect(result?.version).toBe('1.0.0');
        expect(result?.compareUrl).toBe('https://github.com/example/repo/compare/v0.9.0...v1.0.0');
        expect(result?.body).toContain('### ✨ Features');
        expect(result?.body).toContain('* **ui:** 新增基础按钮');
        expect(result?.body).toContain('* **cli:** 修复路径参数');
        expect(result?.body).not.toContain('## [0.9.0]');
        expect(result?.body).not.toContain('旧修复');
    });

    it('兼容 Windows CRLF 换行并正确识别下一个版本边界', () => {
        const fixture =
            '## [1.2.3](https://github.com/example/repo/compare/v1.2.2...v1.2.3) - 2026-09-09\r\n\r\n' +
            '### 🐛 Bug Fixes\r\n\r\n' +
            '* **core:** 修复边界\r\n\r\n' +
            '## 归档版本\r\n\r\n' +
            '* 归档说明';

        const result = parseReleaseSection(fixture, 'v1.2.3');
        expect(result).not.toBeNull();
        expect(result?.version).toBe('1.2.3');
        expect(result?.compareUrl).toBe('https://github.com/example/repo/compare/v1.2.2...v1.2.3');
        expect(result?.body).toBe('### 🐛 Bug Fixes\r\n\r\n* **core:** 修复边界');
    });

    it('标题行包含额外后缀字符时不会泄漏到正文中', () => {
        const fixture =
            '## [2.0.0-beta.1](https://github.com/example/repo/compare/v1.0.0...v2.0.0-beta.1) - 2026-09-09 (Yanked)\n\n' +
            '### ⚠️ Breaking Changes\n\n' +
            '* 破坏性调整';

        const result = parseReleaseSection(fixture, '2.0.0-beta.1');
        expect(result).not.toBeNull();
        expect(result?.body.startsWith('### ⚠️ Breaking Changes')).toBe(true);
        expect(result?.body).not.toContain('(Yanked)');
    });

    it('支持含元字符如 + 的 SemVer 版本号精确匹配', () => {
        const fixture =
            '## [1.0.0+20260909](https://github.com/example/repo/compare/v1.0.0...v1.0.0+20260909)\n\n' +
            '* 构建元数据版本';

        const result = parseReleaseSection(fixture, '1.0.0+20260909');
        expect(result).not.toBeNull();
        expect(result?.version).toBe('1.0.0+20260909');
        expect(result?.body).toBe('* 构建元数据版本');
    });

    it('未匹配到目标版本时返回 null', () => {
        const fixture = '## [1.0.0](https://example.com) - 2026-01-01\n\n* 内容';
        const result = parseReleaseSection(fixture, '2.0.0');
        expect(result).toBeNull();
    });
});

describe('extractReleaseNotes', () => {
    it('能从真实根 CHANGELOG.md 中提取当前版本并自动附加 Full Changelog 链接', () => {
        const notes = extractReleaseNotes('v0.11.2', repoRoot);
        expect(notes).toContain('### 🐛 Bug Fixes');
        expect(notes).toContain('修复安全中心依赖漏洞');
        expect(notes).toMatch(/\*\*Full Changelog\*\*:\s+https:\/\/github\.com\/lidaixingchen\/brutxui-vue3\/compare\/v0\.11\.1\.\.\.v0\.11\.2/);
    });

    it('能自动回退到归档目录提取已归档的历史版本日志', () => {
        const notes = extractReleaseNotes('v0.10.2', repoRoot);
        expect(notes).toContain('### ♻️ Code Refactoring');
        expect(notes).toMatch(/\*\*Full Changelog\*\*:\s+https:\/\/github\.com\/lidaixingchen\/brutxui-vue3\/compare\/v0\.10\.1\.\.\.v0\.10\.2/);
    });

    it('空正文场景下仍能正常输出 Full Changelog 链接', () => {
        const emptyFixture = '## [3.0.0](https://github.com/example/repo/compare/v2.0.0...v3.0.0) - 2026-09-09\n\n## [2.0.0](https://example.com)';
        const parsed = parseReleaseSection(emptyFixture, '3.0.0');
        expect(parsed?.body).toBe('');
    });

    it('对完全不存在的版本抛出友好异常', () => {
        expect(() => extractReleaseNotes('v99.99.99', repoRoot)).toThrowError(/未找到版本 v99\.99\.99 的更新日志/);
    });
});
