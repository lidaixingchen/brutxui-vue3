# 发布架构与原理

> 本文档解释发布**系统**的工作原理与一次性配置；**每次发布的操作手册见 [RELEASE.md](./RELEASE.md)**。
> 结构性问题（谁调用谁、改动破坏面）优先用 CodeGraph 查询。

## 版本发布链路

`publish.yml` 由 push `v*` tag 触发，云端完成发布。整体流程由**发布门禁检验**与**状态机发布协调器**两阶段构成：

### 1. 发布门禁检验（`pnpm release:check`）

在进入实际分发前，执行全量质量与一致性拦截：
- **Changeset 消费校验**：`.changeset/` 下不得残留未消费的变更集
- **代码与类型门禁**：`turbo run build test typecheck lint`（严格依赖并发构建与单测）
- **静态契约与规范门禁**：执行 `pnpm check:contracts` 校验多包导出与令牌一致性
- **真实消费者构建矩阵**：执行 `test-consumers` 验证真实打包产物的独立安装与构建
- **生成物一致性校验**：`git diff --exit-code` 确保工作区与 commit 绝对一致

### 2. 状态机发布协调器（`scripts/release/release-coordinator.mjs`）

门禁通过后，云端统一启动状态机协调器执行密封打包与原子分发，严格遵循六大状态流转：

1. **`PREPARED`**：密封打包各包 tarball 并编译 registry 产物，生成权威快照 `release-manifest.json` 与 `SHA256SUMS` 校验清单；
2. **`DRAFT_ASSETS_READY`**：创建或复用 GitHub Release Draft，先行上传所有 registry 资产、tarball 密封包与校验清单；
3. **`RELEASE_PUBLISHED`**：将 GitHub Release 设为 Published，但显式保留 `make_latest: "false"`，对外公开资产寻址能力，但严密隔离 latest 主通道；
4. **`NPM_PACKAGES_READY`**：以一次性打包的密封原件逐包发布到 npm。若版本已存在，执行双哈希强校验（本地 tarball 与远程 npm 的 shasum / integrity），一致则安全幂等通过，不一致则立即熔断阻断；
5. **`CHANNELS_ADVANCED`**：npm 验证全部通过后，针对正式版本原子推进分发通道：更新 GitHub Release 为 `make_latest: "true"`，并将 npm latest dist-tag 指向当前版本（预发布版本严格隔离）；
6. **`COMPLETED`**：持久化发布审计清单，发布成功结束。

本地与 CI 均可通过 `pnpm release`（加 `--dry-run` 预览）执行全流程协调；针对状态机逻辑的自动化演练由 `pnpm test:release` 独立保障。

## Changelog 自动生成（changeset）

### 工作原理

1. **声明变更**：PR 时通过 `pnpm changeset` 交互式生成 `.changeset/*.md` 文件，描述变更类型（major/minor/patch）和变更内容
2. **版本提升**：合并 PR 后运行 `pnpm release:prepare`（底层调用 `changeset version`），读取 `.changeset/*.md`，自动 bump 受影响包版本号并生成各包 CHANGELOG；配置了 `"commit"` 时自动生成 `RELEASING` commit（`skipCI` 已配置为 `false`）
3. **门禁与发布**：本地运行 `pnpm release:check` 验证全部契约，打 tag 推送后由 CI 状态机协调器完成发布

### `[skip ci]` 陷阱（已规避，供溯源）

> [!NOTE]
> **Changeset 默认 `[skip ci]` 行为规避**
> changeset 2.31 在 `"commit": true` 时，`pnpm version-packages` 生成的 `RELEASING` 提交**默认带 `[skip ci]`**。若 tag 指向该提交，`publish.yml`（由 `v*` tag 触发）会被 `[skip ci]` 静默跳过、npm 不发布。已在 `.changeset/config.json` 通过 `"commit": ["@changesets/cli/commit", { "skipCI": false }]` 关闭。即便如此，发布后仍需核对 GitHub Actions 的 Publish run 是否成功、npm 是否真的出新版本。

### Commit 格式要求

```text
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert
scope: ui | cli | docs | registry | shared | deps | theme（可选，支持并推荐使用如 `ui/toast` 的子 Scope）
```

Breaking Change 标记方式：

- `feat(ui)!: 重命名 Button API`（加 `!`）
- commit body 中写 `BREAKING CHANGE: description`

根 CHANGELOG 生成依赖 commit message 质量，请严格遵守 [提交信息规范](./COMMIT_CONVENTION.md)。

## 根 CHANGELOG.md 生成

根仓库的 [CHANGELOG.md](../../CHANGELOG.md) 由 [scripts/release/generate-changelog.mjs](../../scripts/release/generate-changelog.mjs) 维护，与 changeset 各包独立 CHANGELOG 互补：脚本汇总两个 tag 之间的 conventional commits，按类型分组生成单行条目。

### 脚本工作原理

1. **解析范围**：默认从 `packages/ui/package.json` 读取版本号，组装 `v<version>` tag。若该 tag 已存在 → 起点取上一个 tag、终点取该 tag；否则起点取最新 tag、终点取 `HEAD`（发布前未打 tag 场景）
2. **收集 commits**：`git log <from>..<to>` 按 `%H%x1f%s%x1f%b%x1f%an%x1f%ae` 分隔提取
3. **解析与过滤**：按 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 正则拆解 type/scope/subject；`release`/`RELEASING` 类型一律剔除；`chore` 类型仅在标记为 breaking 时保留
4. **分类与渲染**：按 [scripts/release/changelog-sections.mjs](../../scripts/release/changelog-sections.mjs) 的 `SECTION_ORDER` 固定顺序渲染（破坏性变更 → 新功能 → 重构 → 修复 → 文档 → 测试 → 其余兜底），不依赖提交在 git log 中的出现顺序，保证跨版本稳定一致。条目格式 `* **scope:** subject ([sha7](../../../../commit-url))`，body 默认不展开
5. **写入**：`stripUnreleasedSection` 移除旧的 `## [Unreleased]` 段，再在文件头之后插入 `## [Unreleased](../../../../.../compare/v<version>...HEAD)` 与新版本段

### 注意事项

- 该脚本仅维护根 `CHANGELOG.md`；各包 CHANGELOG 仍由 changeset 在 `pnpm version-packages` 时生成
- dependabot 等 bot 的 PR body 默认会被忽略（脚本只取 subject + body，不展开多行表格）
- `pnpm changelog:dry` 可干跑预览（不写文件）；`--from` / `--version` / `--date` / `--scope` 可显式指定参数

## GitHub 发行版描述（Release Notes）同步

发布时通过 [scripts/release/extract-release-notes.mjs](../../scripts/release/extract-release-notes.mjs) 将 `CHANGELOG.md`（若已归档则回退至 `apps/docs/changelog/`）中对应版本的结构化变更日志提取为独立 Markdown 文件，并在末尾追加 `**Full Changelog**: https://github.com/.../compare/...`。在 CI (`publish.yml`) 中通过 `gh release create|edit --notes-file` 同步至 GitHub Release 页面，保证单一事实源。

## CHANGELOG 归档机制

为避免根 [CHANGELOG.md](../../CHANGELOG.md) 随版本累积无限增长，自 v0.9.5 起引入归档机制：根文件仅保留**最近 3 个版本**的完整段落，更早的版本归档至独立文件。

### 目录结构

```text
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

> 以下版本已归档至 [`../apps/docs/changelog/`](../apps/docs/changelog/)，点击版本号查看完整变更记录：

* **[0.9.2](apps/docs/changelog/v0.9.2.md)** - 2026-07-08
* **[0.9.1](apps/docs/changelog/v0.9.1.md)** - 2026-07-06
...
```

### 归档文件格式

每个归档文件以 `v<version>.md` 命名，包含返回根 CHANGELOG 的链接和原版本段完整内容：

```markdown
# v<version>

> [← 返回主 CHANGELOG](../guide/changelog.md)

## [<version>](https://github.com/lidaixingchen/brutxui-vue3/compare/v<previous>...v<version>) - <date>

[原版本段完整内容]
```

### VitePress 集成

归档目录通过 [apps/docs/.vitepress/config.ts](../../apps/docs/.vitepress/config.ts) 中的 `generateChangelogSidebar()` 函数自动生成侧边栏：

- 扫描 `apps/docs/changelog/` 下的 `v*.md` 文件
- 按 major 版本分组（如 `v0.x`、`v1.x`）
- 当前 major 默认展开，更早的 major 折叠
- 归档版本增长时侧边栏自动更新，无需手动维护

访问入口：文档站点侧边栏的"归档版本"分组（路径 `/changelog/`）。

### 维护流程与自动归档

发布新版本时，`pnpm changelog` 自动完成：

1. 生成新版本段并写入根 `CHANGELOG.md` 顶部
2. 滑动窗口裁剪：若主日志版本数超过 3 个，自动将最旧版本切分并写入 `apps/docs/changelog/v<version>.md`
3. 在根 `CHANGELOG.md` 末尾的"归档版本"段追加该版本的链接条目
4. 将该版本连入文档站归档索引 [apps/docs/changelog/index.md](../../apps/docs/changelog/index.md)

侧边栏自动包含并更新新归档文件，无需手动维护。

## Breaking Change 迁移文档规范

任何包含 breaking change 的发布都必须提供迁移指南，让用户能低成本完成手动的版本升级。本规范是 v2.2 改进计划 [Item 9（组件迁移引擎）](../archive/2026/core/辅助包改进方案-v2.md#9-组件迁移引擎) 暂缓期间的轻量替代方案——在缺少 codemod 自动迁移的前提下，把"迁移成本"压到最低。

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

- 没有 breaking change 的 release 可以省略此章节
- 单个 release 含多个 breaking change 时，每个组件独立成段
- 迁移步骤必须给出可复制的 before/after 代码片段，不允许仅文字描述
- "自动迁移可行性" 字段用于在未来累积 codemod 候选清单——当评估为"需要 codemod"的 case 累计 ≥ 3 个时，触发 Item 9 启动条件

## 供应链安全

GitHub Actions 工作流使用 SHA pin 锁定第三方 Action，由 [.github/dependabot.yml](../../.github/dependabot.yml) 自动管理升级（每周一开 PR）。

### Registry manifest 自动签名与不可变快照

发布链路会对 `registry-manifest.json` 做 Ed25519 签名，并生成版本化快照元数据，CLI 零配置即可验签官方 Registry：

- **Secret 配置**：仓库需配置 `BRUTX_REGISTRY_PRIVATE_KEY`（PKCS8 DER base64 单行）与 `BRUTX_REGISTRY_KEY_ID`（`official-v1`）。私钥对应公钥硬编码于 CLI 的 `OFFICIAL_PUBLIC_KEYS`（`packages/cli/src/lib/constants.ts`），**二者必须匹配**，否则 CLI 严格模式验签会失败
- **快照与动态元数据**：`brutx-registry-vue build` 编译时动态注入 UI 发布版本号与 Git HEAD commit，并根据 Canonical JSON 规范严密计算覆盖 `name`、`version`、`items`、`keyId`、`releaseTag`、`gitCommit` 六大关键字段的 SHA-256 integrity 摘要，防止任何字段漂移或被单方篡改
- **签名与双通道分发**：发布流程在 CI 注入私钥自动完成签名，签名后的 manifest 与组件 JSON 随同版本 tarball 一并上传为 GitHub Release 资产。资产同时支持最新端点（`releases/latest/download`）与版本化历史端点（`releases/download/v<version>/`），供 CLI 精确回溯与自愈重放
- **未签名回退**：Fork / 本地 build 未注入私钥时保持未签名，CLI 默认模式向下兼容跳过签名验证，但仍通过 integrity 摘要保障内容完整
- **双哈希不可变校验**：发布状态机针对 npm 已存在版本与发布清单生成 `SHA256SUMS`，并在发布中比对本地密封 tarball 与远程 npm 注册表的 `shasum` 与 `integrity`，彻底杜绝内容静默覆盖
