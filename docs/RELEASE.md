# 发布流程

## 版本发布

> [!IMPORTANT]
> **发布前置检查（防坑指南）**
> 1. **检查工作区（`git status`）**：在开始发布流程前，**必须**运行 `git status` 审视工作区。确保所有应当包含在本次发布的实质性改动（组件源码、测试、文档、注册表等）已被全部提交或妥善 staged。**严禁在工作区留有未提交组件代码的情况下直接运行发布和打 tag**，这会导致发布产物不完整。
> 2. **重新编译注册表**：若工作区包含组件的增删改，必须先运行 `pnpm --filter brutx-registry-vue build` 重新编译并生成注册表最新的 JSON 描述文件，再进行发布门禁检查。

- 提交信息格式固定为 `release: bump version to <ui-version> for ui and <cli-version> for cli`。如果只发布其中一个包，仍保持该格式，并填写当前实际版本。
- 哪个 NPM 包版本发生变化就发布哪个包；当前公开发布包为 `brutx-ui-vue`（`packages/ui/`）和 `brutx-vue`（`packages/cli/`）。
- tag 命名固定以 UI 包版本为主，格式为 `v<ui-version>`，例如 `v0.6.6`。CLI 版本不单独创建 tag。
- 推送 `main` 和对应的 `v*` tag 后，由云端自动发布。
- 任何影响组件安装、注册表生成或发布产物的改动，都必须同步检查 `packages/ui/`、`packages/shared/`、`packages/registry/`、`packages/cli/` 四处：源码文件、组件元数据、registry 构建脚本/JSON、CLI 安装复制逻辑必须保持一致。
- 发布前必须执行完整检查：`pnpm release`（`turbo run build test typecheck lint && changeset publish`）。
- 如果本地验证 release tag，设置 `RELEASE_TAG=v<ui-version>` 后再运行 `pnpm release`；GitHub Actions 中会自动读取 `GITHUB_REF_NAME`。
- 发布前必须检查 `pnpm-lock.yaml` 是否需要同步。若只修改包自身 `version` 且运行 pnpm 后 lockfile 无变化，可以不提交 lockfile；若修改 `dependencies`、`devDependencies`、`peerDependencies` 或 lockfile 自动变化，必须提交同步后的 `pnpm-lock.yaml`。

## Changelog 自动生成

项目使用 changeset 管理变更日志。

### 使用方法

```bash
pnpm changeset        # 交互式声明变更（PR 时使用）
pnpm version-packages # bump 版本号 + 生成 CHANGELOG（合并 changeset 后使用）
pnpm release          # turbo run build test typecheck lint && changeset publish
```

### 工作原理

1. **声明变更**：PR 时通过 `pnpm changeset` 交互式生成 `.changeset/*.md` 文件，描述变更类型（major/minor/patch）和变更内容
2. **版本提升**：合并 PR 后运行 `pnpm version-packages`，changeset 读取 `.changeset/*.md`，自动 bump 受影响包的版本号并生成 CHANGELOG
3. **发布**：`pnpm release` 先运行 turbo 构建/测试/类型检查/lint 门禁，通过后 `changeset publish` 发布到 npm

### Commit 格式要求

```text
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert
scope: ui | cli | docs | registry | shared | theme（可选）
```

Breaking Change 标记方式：

- `feat(ui)!: 重命名 Button API`（加 `!`）
- commit body 中写 `BREAKING CHANGE: description`

### 配置

可在 `package.json` 中配置：

```json
{
  "changelog": {
    "repoUrl": "https://github.com/lidaixingchen/brutxui-vue3",
    "excludeTypes": ["release", "chore"]
  }
}
```

## 根 CHANGELOG.md 生成

根仓库的 [CHANGELOG.md](../CHANGELOG.md) 由 [scripts/release/generate-changelog.mjs](../scripts/release/generate-changelog.mjs) 维护，与 changeset 各包独立 CHANGELOG 互补：脚本汇总两个 tag 之间的 conventional commits，按类型分组并生成单行条目（与 v0.9.4 起的精简风格一致）。

### 使用方法

```bash
pnpm changelog                          # 生成新版本段并插入到 CHANGELOG.md 顶部
pnpm changelog:dry                      # 干跑：仅打印到 stdout，不写文件
pnpm changelog -- --from v0.9.4         # 显式指定起始 tag
pnpm changelog -- --version 0.9.6 --date 2026-08-01
pnpm changelog -- --scope ui            # 仅生成 ui scope 的条目
```

### 工作原理

1. **解析范围**：默认从 `packages/ui/package.json` 读取版本号，组装 `v<version>` tag。若该 tag 已存在 → 起点取上一个 tag、终点取该 tag；否则起点取最新 tag、终点取 `HEAD`（开发中未打 tag 场景）
2. **收集 commits**：`git log <from>..<to>` 按 `%H%x1f%s%x1f%b%x1f%an%x1f%ae` 分隔提取
3. **解析与过滤**：按 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 正则拆解 type/scope/subject；`release` 类型一律剔除；`chore` 类型仅在标记为 breaking 时保留
4. **分类与渲染**：breaking 独立置顶；其余按 `feat / fix / refactor / perf / docs / ci / build / test / style / revert / chore` 顺序成段。每个条目格式 `* **scope:** subject ([sha7](commit-url))`，body 默认不展开
5. **写入**：`stripUnreleasedSection` 移除旧的 `## [Unreleased]` 段，再在保留的文件头之后插入 `## [Unreleased](.../compare/v<version>...HEAD)` 与新版本段

### 注意事项

- 该脚本仅维护根 `CHANGELOG.md`；各包（`packages/ui/CHANGELOG.md`、`packages/cli/CHANGELOG.md`）仍由 changeset 在 `pnpm version-packages` 时生成
- 生成的条目依赖 commit message 质量——请严格遵守 [提交信息规范](./COMMIT_CONVENTION.md)
- dependabot 等 bot 的 PR body 默认会被忽略（脚本只取 subject + body，不展开多行表格）
- 推荐在 `pnpm version-packages` 之后、`git commit` 之前运行 `pnpm changelog:dry` 预览，确认无误后再 `pnpm changelog` 写入并随版本提升 commit 一起提交

## CHANGELOG 归档机制

为避免根 [CHANGELOG.md](../CHANGELOG.md) 随版本累积无限增长，自 v0.9.5 起引入归档机制：根文件仅保留**最近 3 个版本**的完整段落，更早的版本归档至独立文件。

### 目录结构

```
CHANGELOG.md                                  # 根文件：保留最近 3 个版本 + 归档索引段
apps/docs/changelog/                          # 归档目录（VitePress srcDir 下，可在文档站点访问）
├── index.md                                  # 归档索引页
├── v0.9.2.md                                 # 各版本独立文件
├── v0.9.1.md
└── ...
```

### 根文件格式

根 `CHANGELOG.md` 末尾的"归档版本"段仅保留版本号链接与日期，不展开内容：

```markdown
## 归档版本

> 以下版本已归档至 [`apps/docs/changelog/`](apps/docs/changelog/)，点击版本号查看完整变更记录：

* **[0.9.2](apps/docs/changelog/v0.9.2.md)** - 2026-07-08
* **[0.9.1](apps/docs/changelog/v0.9.1.md)** - 2026-07-06
...
```

### 归档文件格式

每个归档文件以 `v<version>.md` 命名，包含返回根 CHANGELOG 的链接和原版本段完整内容：

```markdown
# v<version>

> [← 返回主 CHANGELOG](../../../CHANGELOG.md)

## [<version>](https://github.com/lidaixingchen/brutxui-vue3/compare/v<previous>...v<version>) - <date>

[原版本段完整内容]
```

### VitePress 集成

归档目录通过 [apps/docs/.vitepress/config.ts](../apps/docs/.vitepress/config.ts) 中的 `generateChangelogSidebar()` 函数自动生成侧边栏：

- 扫描 `apps/docs/changelog/` 下的 `v*.md` 文件
- 按 major 版本分组（如 `v0.x`、`v1.x`）
- 当前 major 默认展开，更早的 major 折叠
- 归档版本增长时侧边栏自动更新，无需手动维护

访问入口：文档站点侧边栏的"归档版本"分组（路径 `/changelog/`）。

### 维护流程

发布新版本时：

1. 运行 `pnpm changelog` 生成新版本段并写入根 `CHANGELOG.md` 顶部
2. 检查根文件保留的版本数是否超过 3 个
3. 若超过，将最旧的版本段移动到 `apps/docs/changelog/v<version>.md`（保留原内容 + 添加返回链接）
4. 在根文件末尾的"归档版本"段添加该版本的链接条目
5. 侧边栏会自动包含新归档文件，无需手动修改 config.ts

> 注意：当前归档操作需手动执行，`generate-changelog.mjs` 脚本尚未集成自动归档逻辑。

## Breaking Change 迁移文档规范

任何包含 breaking change 的发布都必须提供迁移指南，让用户能低成本完成手动的版本升级。本规范是 v2.2 改进计划 [Item 9（组件迁移引擎）](./AUXILIARY_PACKAGES_IMPROVEMENT_PLAN_V2.md#9-组件迁移引擎) 暂缓期间的轻量替代方案——在缺少 codemod 自动迁移的前提下，把"迁移成本"压到最低。

### Commit 标记

- 标题行使用 `!` 标记 breaking：`feat(ui)!: 重命名 Button 的 variant 属性`
- 或在 commit body 中显式写 `BREAKING CHANGE: <描述>`

### 迁移指南模板

每个 breaking change 必须在 CHANGELOG 与 release notes 中按以下结构记录：

```markdown
#### ⚠️ Breaking Change: <组件名> — <变更概述>

**影响范围**
- <受影响的 props / slots / events / 方法列表>

**变更原因**
- <为什么这个 breaking 是必要的>

**迁移步骤**

Before（旧 API）：
\`\`\`vue
<template>
  <Button variant="primary" />
</template>
\`\`\`

After（新 API）：
\`\`\`vue
<template>
  <Button variant="default" />
</template>
\`\`\`

**自动迁移可行性**
- <评估是否需要 codemod：例如"全局替换 `variant="primary"` 为 `variant="default"` 即可"，或"涉及类型推断，需手动检查">
```

### 落地要求

- 没有 breaking change 的 release 可以省略此章节。
- 单个 release 含多个 breaking change 时，每个组件独立成段。
- 迁移步骤必须给出可复制的 before/after 代码片段，不允许仅文字描述。
- "自动迁移可行性" 字段用于在未来累积 codemod 候选清单——当评估为"需要 codemod"的 case 累计 ≥ 3 个时，触发 Item 9 启动条件。

## 供应链安全

GitHub Actions 工作流使用 SHA pin 锁定第三方 Action，由 [.github/dependabot.yml](../.github/dependabot.yml) 自动管理升级（每周一开 PR）。
