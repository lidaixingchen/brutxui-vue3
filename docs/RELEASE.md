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
- 发布前必须执行完整检查：`pnpm release:check`。该门禁会覆盖构建、类型检查、lint、UI/CLI 测试、视觉测试、CLI 集成测试、注册表 build/validate、docs build、`exports` 与 Vite entry 同步校验、JS/CJS/CSS 产物冒烟检查和 `pnpm pack --dry-run` 包内容审计。
- 如果本地验证 release tag，设置 `RELEASE_TAG=v<ui-version>` 后再运行 `pnpm release:check`；GitHub Actions 中会自动读取 `GITHUB_REF_NAME`。
- 发布前必须检查 `pnpm-lock.yaml` 是否需要同步。若只修改包自身 `version` 且运行 pnpm 后 lockfile 无变化，可以不提交 lockfile；若修改 `dependencies`、`devDependencies`、`peerDependencies` 或 lockfile 自动变化，必须提交同步后的 `pnpm-lock.yaml`。

## Changelog 自动生成

项目使用基于 Conventional Commits 的自动 CHANGELOG 生成脚本（`scripts/release/generate-changelog.mjs`）。

### 使用方法

```bash
pnpm changelog        # 从最近 tag 到 HEAD 生成并更新 CHANGELOG.md
pnpm changelog:dry    # 预览生成内容（不写入文件）
pnpm changelog:full   # 从第一个 commit 开始生成完整历史
pnpm changelog:ui     # 只生成 scope 为 ui 的变更
pnpm changelog:cli    # 只生成 scope 为 cli 的变更
```

### 工作原理

1. **版本范围**：默认从最近的 git tag（如 `v0.8.0`）到 HEAD；`--full-history` 从第一个 commit 开始
2. **Commit 解析**：匹配 `type(scope): subject` 格式，提取类型、scope、描述、breaking 标记
3. **过滤规则**：排除 `release` 类型和非 breaking 的 `chore` 类型
4. **分类渲染**：Breaking Changes 置顶，然后按类型分组（✨ Features、🐛 Bug Fixes 等）
5. **写入文件**：新条目 prepend 到 CHANGELOG.md 头部，保留历史版本

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
