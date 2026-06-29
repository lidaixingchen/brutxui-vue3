# 发布流程

## 版本发布

- 提交信息格式固定为 `release: bump version to <ui-version> for ui and <cli-version> for cli`。如果只发布其中一个包，仍保持该格式，并填写当前实际版本。
- 哪个 NPM 包版本发生变化就发布哪个包；当前公开发布包为 `brutx-ui-vue`（`packages/ui/`）和 `brutx-vue`（`packages/cli/`）。
- tag 命名固定以 UI 包版本为主，格式为 `v<ui-version>`，例如 `v0.6.6`。CLI 版本不单独创建 tag。
- 推送 `main` 和对应的 `v*` tag 后，由云端自动发布。
- 任何影响组件安装、注册表生成或发布产物的改动，都必须同步检查 `packages/ui/`、`packages/shared/`、`packages/registry/`、`packages/cli/` 四处：源码文件、组件元数据、registry 构建脚本/JSON、CLI 安装复制逻辑必须保持一致。
- 发布前必须执行完整检查：`pnpm release:check`。该门禁会覆盖构建、类型检查、lint、UI/CLI 测试、视觉测试、CLI 集成测试、注册表 build/validate、docs build、导出产物检查和 `pnpm pack --dry-run` 包内容审计。
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
