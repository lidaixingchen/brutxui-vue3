# Changelog 自动化设计

## 背景

BrutxUI 已经在使用 Conventional Commits 规范（从 git log 可见 `feat`、`fix`、`docs`、`style`、`refactor`、`test`、`build`、`ci`、`chore`、`release` 等前缀），但目前没有自动化的 CHANGELOG 生成机制。每次发版时需要手动编写版本说明，容易遗漏变更、格式不一致，且无法追溯到具体 commit。

当前发布流程（`scripts/release/check-release.mjs`）覆盖了版本校验、构建、测试、产物审计，但缺少变更日志的自动生成和归档环节。

## 目标

- 基于 Conventional Commits 自动从 git history 生成 CHANGELOG.md。
- 按版本分组，每个版本下按类型（Features、Bug Fixes、Breaking Changes 等）分类。
- 支持 monorepo 结构，可为 UI 包和 CLI 包分别生成或统一生成。
- 生成的 CHANGELOG 格式清晰、可读，包含 commit hash 和关联 PR/Issue 链接。
- 集成到发布流程中，发版前自动更新 CHANGELOG.md。
- 提供手动触发和 dry-run 模式，方便预览。

## 非目标

- 不替换现有的 commit 规范（不引入 commitlint 强制校验，后续可单独做）。
- 不引入重型工具链（如 lerna-semantic-release 全家桶）。
- 不处理 npm publish 或 GitHub Release 的自动创建（已在后续规划中）。
- 不在第一阶段做自动 tag 生成。

## 首次生成策略

当项目已有历史 commit 但无 `CHANGELOG.md` 时，采用以下策略：

- **默认行为**：只从最近一个 tag（或首次 release commit）到 HEAD 生成，不追溯全部历史。
- **全量模式**：通过 `--full-history` 参数，从第一个 commit 开始生成完整 CHANGELOG。
- **首次运行提示**：检测到无 `CHANGELOG.md` 时，提示用户选择生成范围。

```bash
# 只生成最近一个版本的变更
pnpm changelog

# 生成完整历史（首次使用）
pnpm changelog --full-history
```

## 推荐方案

采用 **conventional-changelog-cli** 生态 + 自定义脚本 的轻量方案。

### 工具选型对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| conventional-changelog-cli | 生态成熟、Conventional Commits 原生支持、preset 可扩展 | CLI 模式功能有限，复杂定制需要 API |
| git-cliff | Rust 编写、速度快、配置灵活、monorepo 支持好 | 需要额外安装 Rust 二进制 |
| changelogithub | 轻量、GitHub Release 集成好 | 过度依赖 GitHub API |
| 自研脚本 + conventional-commits-parser | 完全可控、无额外依赖 | 维护成本高 |

**推荐方案：conventional-changelog + 自定义 Node.js 脚本**

理由：
1. 项目已使用 Node.js 生态，无需引入外部二进制。
2. `conventional-commits-parser` 可直接解析 commit，`conventional-changelog-core` 可生成标准格式。
3. 自定义脚本可灵活处理 monorepo 的包级过滤。
4. 与现有 `scripts/release/` 目录风格一致。

## 实现设计

### 1. 新增依赖

```json
{
  "devDependencies": {
    "conventional-changelog-core": "^10.0.0",
    "conventional-changelog-writer": "^8.0.0",
    "conventional-commits-parser": "^6.0.0",
    "conventional-changelog-preset-loader": "^5.0.0"
  }
}
```

安装在根目录 `package.json`，作为全局 devDependency。

### 2. 脚本结构

```
scripts/
  release/
    check-release.mjs       # 已有
    generate-changelog.mjs  # 新增
```

`generate-changelog.mjs` 是核心脚本，职责：

1. 读取 git tags，确定版本范围（上一个 tag → HEAD，或指定范围）。
2. 解析范围内的 commit messages，按 Conventional Commits 规范分类。
3. 按包过滤（可选）：只包含影响特定包的 commit。
4. 生成 Markdown 格式的 CHANGELOG 条目。
5. 将新条目 prepend 到 `CHANGELOG.md`。

### 3. Commit 分类映射

```javascript
const TYPE_LABELS = {
    feat: '✨ Features',
    fix: '🐛 Bug Fixes',
    docs: '📝 Documentation',
    style: '💄 Styles',
    refactor: '♻️ Code Refactoring',
    perf: '⚡ Performance',
    test: '✅ Tests',
    build: '📦 Build',
    ci: '🔧 CI',
    chore: '🏠 Chores',
    revert: '⏪ Reverts',
};

// 需要排除的 commit 类型（不出现在 CHANGELOG 中）
const EXCLUDED_TYPES = ['release'];

// 说明：
// - release: 前缀的 commit（如 "release: bump version to 0.6.8"）是版本发布操作，
//   不代表功能变更，因此排除在 CHANGELOG 之外。
// - chore: 类型默认排除，除非包含 BREAKING CHANGE。
```

### 4. 输出格式

```markdown
# Changelog

## [0.6.9](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.6.8...v0.6.9) (2026-06-25)

### ✨ Features

* **cli:** 新增 `brutx-vue doctor` 命令 ([abc1234](https://github.com/lidaixingchen/brutxui-vue3/commit/abc1234))
* **ui:** 新增 ColorPicker 组件 ([def5678](https://github.com/lidaixingchen/brutxui-vue3/commit/def5678))

### 🐛 Bug Fixes

* **cli:** 修复 Windows shell 兼容性 ([406e9ae](https://github.com/lidaixingchen/brutxui-vue3/commit/406e9ae))

### ⚠ BREAKING CHANGES

* **ui:** `Button` 的 `variant` 属性重命名为 `type`

---

## [0.6.8](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.6.7...v0.6.8) (2026-06-24)
...
```

### 5. Scope 过滤（Monorepo 支持）

commit message 中的 scope 用于标识影响的包：

- `feat(ui):` → 影响 `packages/ui`，CHANGELOG 条目出现在 UI 包和全局 CHANGELOG。
- `fix(cli):` → 影响 `packages/cli`，CHANGELOG 条目出现在 CLI 包和全局 CHANGELOG。
- `docs:` → 影响文档，出现在全局 CHANGELOG。
- 无 scope → 出现在全局 CHANGELOG。

可选模式：通过 `--scope ui` 或 `--scope cli` 参数，只生成特定包的 CHANGELOG。

### 6. 根目录脚本

在 `package.json` 中新增 scripts：

```json
{
    "scripts": {
        "changelog": "node scripts/release/generate-changelog.mjs",
        "changelog:dry": "node scripts/release/generate-changelog.mjs --dry-run",
        "changelog:full": "node scripts/release/generate-changelog.mjs --full-history",
        "changelog:ui": "node scripts/release/generate-changelog.mjs --scope ui",
        "changelog:cli": "node scripts/release/generate-changelog.mjs --scope cli"
    }
}
```

### 7. 与发布流程集成

在 `check-release.mjs` 的 `main()` 函数末尾、`Release check passed` 之前，增加可选的 CHANGELOG 生成步骤：

```javascript
// check-release.mjs 新增
function generateChangelog() {
    printGroup('Generating CHANGELOG');
    runPnpm(['run', 'changelog']);
    console.log('CHANGELOG.md updated.');
}
```

或者作为独立步骤，在 CI 的 release workflow 中手动调用：

```yaml
# .github/workflows/release.yml 中新增步骤
- name: Generate CHANGELOG
  run: pnpm changelog
```

### 8. dry-run 模式

```bash
pnpm changelog:dry
```

输出到 stdout 而不写文件，方便预览即将生成的内容。

## 核心逻辑伪代码

```javascript
// scripts/release/generate-changelog.mjs
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const REPO_URL = 'https://github.com/lidaixingchen/brutxui-vue3';
const EXCLUDED_TYPES = ['release'];

/**
 * 获取最近的 git tag
 * 降级策略：无 tag 时返回 null，由调用方决定从第一个 commit 开始
 */
function getLatestTag() {
    try {
        return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
    } catch {
        // 无 tag 时 git describe 会报错，返回 null
        return null;
    }
}

/**
 * 获取指定范围内的 commits
 * @param {string|null} tag - 起始 tag，null 表示从第一个 commit 开始
 */
function getCommitsSince(tag) {
    const range = tag ? `v${tag}..HEAD` : 'HEAD';
    const log = execSync(`git log ${range} --format='%H|%s|%an|%ae'`, { encoding: 'utf-8' });
    return log.trim().split('\n').filter(Boolean);
}

function parseCommit(message) { /* 解析 type(scope): subject */ }
function categorize(commits) { /* 按 type 分组 */ }
function renderMarkdown(version, date, categories) { /* 生成 Markdown */ }
function prependToChangelog(newEntry) { /* 写入 CHANGELOG.md 头部 */ }

function main() {
    const isDryRun = process.argv.includes('--dry-run');
    const isFullHistory = process.argv.includes('--full-history');
    const scopeFilter = getArgValue('--scope');

    const tag = isFullHistory ? null : getLatestTag();
    const version = getVersionFromPackageJson();
    const commits = getCommitsSince(tag);

    // 过滤逻辑：
    // 1. 排除 EXCLUDED_TYPES 中的类型（如 release）
    // 2. 排除非 breaking 的 chore 类型
    const parsed = commits
        .map(parseCommit)
        .filter(c => !EXCLUDED_TYPES.includes(c.type))
        .filter(c => !c.isChore || c.isBreaking);

    const filtered = scopeFilter
        ? parsed.filter(c => !c.scope || c.scope === scopeFilter)
        : parsed;

    const categorized = categorize(filtered);
    const entry = renderMarkdown(version, new Date().toISOString().slice(0, 10), categorized);

    if (isDryRun) {
        console.log(entry);
    } else {
        prependToChangelog(entry);
        console.log('CHANGELOG.md updated.');
    }
}
```

## 文件清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | `scripts/release/generate-changelog.mjs` | CHANGELOG 生成脚本 |
| 修改 | `package.json` | 增加 `changelog` / `changelog:dry` / `changelog:full` 脚本 |
| 修改 | `pnpm-workspace.yaml` 或根 `package.json` | 增加 conventional-changelog 相关 devDependencies |
| 新增 | `CHANGELOG.md` | 首次生成，后续每次 prepend |
| 修改 | `CONTRIBUTING.md` | 补充 commit 规范说明（如文件不存在则新建） |
| 可选修改 | `scripts/release/check-release.mjs` | 集成 CHANGELOG 生成步骤 |

## 配置文件支持

支持通过 `package.json` 中的 `changelog` 字段或独立的 `.changelogrc.json` 文件进行配置：

```json
// package.json
{
    "changelog": {
        "repoUrl": "https://github.com/lidaixingchen/brutxui-vue3",
        "excludeTypes": ["release", "chore"],
        "typeLabels": {
            "feat": "✨ Features",
            "fix": "🐛 Bug Fixes"
        },
        "scopeMap": {
            "ui": "packages/ui",
            "cli": "packages/cli"
        }
    }
}
```

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `repoUrl` | `string` | 从 git remote 推断 | 用于生成 commit 链接 |
| `excludeTypes` | `string[]` | `["release"]` | 排除的 commit 类型 |
| `typeLabels` | `Record<string, string>` | 内置映射 | 自定义类型标签 |
| `scopeMap` | `Record<string, string>` | `{}` | scope 到包路径的映射 |

配置优先级：命令行参数 > `package.json` > `.changelogrc.json` > 内置默认值。

## Commit 规范补充说明

当前项目已在使用 Conventional Commits，但建议在 `CONTRIBUTING.md`（或 README 贡献章节）中明确规范：

```
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert
scope: ui | cli | docs | registry | shared | theme（可选）
subject: 简短描述，中文或英文均可
```

示例：
- `feat(ui): 新增 ColorPicker 组件`
- `fix(cli): 修复 Windows 下路径分隔符问题`
- `docs: 更新主题实验室文档`
- `refactor(ui)!: 重命名 Button variant 属性` （`!` 表示 Breaking Change）

## Breaking Changes 标记

两种方式标记 Breaking Change：

1. **commit message 中加 `!`**：`feat(ui)!: change Button API` → 自动识别为 breaking。
2. **commit body 中写 `BREAKING CHANGE:`**：在 commit message body 中写 `BREAKING CHANGE: description`。

脚本会将 breaking changes 单独列出在每个版本的最前面（`⚠ BREAKING CHANGES` 分类）。

## 实施顺序

1. 安装 `conventional-changelog-core`、`conventional-commits-parser` 等依赖。
2. 编写 `scripts/release/generate-changelog.mjs` 核心逻辑。
3. 支持 `--dry-run` 和 `--scope` 参数。
4. 从当前 git history 生成初始 `CHANGELOG.md`。
5. 在根 `package.json` 中注册脚本。
6. 在 `check-release.mjs` 中可选集成。
7. 更新 README 或 CONTRIBUTING 文档中的 commit 规范说明。

## 验收标准

- `pnpm changelog` 能从最近一个 tag 到 HEAD 生成 CHANGELOG 条目并 prepend 到 `CHANGELOG.md`。
- `pnpm changelog:dry` 输出到 stdout，不修改文件。
- `pnpm changelog:ui` 只包含 scope 为 `ui` 或无 scope 的 commit。
- 生成的 CHANGELOG 中每条记录包含：类型 emoji、scope、描述、commit hash 链接。
- Breaking Changes 在每个版本中置顶显示。
- 脚本在无 tag 时能优雅降级（从第一个 commit 开始）。
- `pnpm changelog` 可重复执行，不产生重复条目（基于 tag 范围判断）。

## 风险与缓解

- **风险**：conventional-changelog-core API 变动频繁。
  **缓解**：封装一层薄 wrapper，核心解析用 `conventional-commits-parser`，生成用模板字符串，降低对高层 API 的依赖。

- **风险**：项目历史中存在不符合 Conventional Commits 的 commit。
  **缓解**：无法解析的 commit 归入 `🏠 Chores` 分类，不丢弃，但也不单独突出。

- **风险**：monorepo 中 commit scope 不统一。
  **缓解**：无 scope 的 commit 默认出现在所有包的 CHANGELOG 中；后期可通过 commitlint 强制 scope。

## 后续扩展

- **GitHub Release 集成**：基于 CHANGELOG 条目自动创建 GitHub Release。
- **commitlint hook**：在 commit-msg 阶段强制 Conventional Commits 格式。
- **自动 tag**：根据版本号自动创建 git tag。
- **CHANGELOG 翻译**：中英文双语 CHANGELOG。
