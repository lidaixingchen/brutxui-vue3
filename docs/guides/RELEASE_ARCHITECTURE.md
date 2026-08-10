# 发布架构与原理

> 本文档解释发布**系统**的工作原理与一次性配置；**每次发布的操作手册见 [RELEASE.md](RELEASE.md)**。
> 结构性问题（谁调用谁、改动破坏面）优先用 CodeGraph 查询。

## 版本发布链路

`publish.yml` 由 push `v*` tag 触发，云端完成发布：

1. **发布门禁**：`turbo run build test typecheck lint`（test 依赖 build 自动等待）
2. **changeset 消费校验**：`.changeset/` 下不得残留未消费 changeset（否则报错）
3. **生成物一致性门禁**：`git diff --exit-code` 校验 `packages/ui/registry-manifest.json`、`packages/ui/src/styles.css` 与 commit 一致（registry 产物发布时构建、不入库，不在此列）
4. **创建/更新 GitHub Release**（`gh release create|edit`，幂等可重跑）
5. **上传 registry 产物**为 Release 资产（扁平命名，可寻址 `releases/latest/download/{name}.json`，重跑 `--clobber` 覆盖并清理已删除的旧资产）
6. **发布 npm**：`pnpm publish`（provenance），版本已存在时由 `EPUBLISHCONFLICT` 幂等跳过

本地 `pnpm release` 与 CI 门禁相同（`turbo run build test typecheck lint && changeset publish`）；tag 重推会重跑 CI，npm 已发布版本由幂等逻辑兜底。

## Changelog 自动生成（changeset）

### 工作原理

1. **声明变更**：PR 时通过 `pnpm changeset` 交互式生成 `.changeset/*.md` 文件，描述变更类型（major/minor/patch）和变更内容
2. **版本提升**：合并 PR 后运行 `pnpm version-packages`（`changeset version`），读取 `.changeset/*.md`，自动 bump 受影响包版本号并生成各包 CHANGELOG；配置了 `"commit"` 时自动生成 `RELEASING` commit（`skipCI` 已配置为 `false`）
3. **发布**：`pnpm release` 先跑 turbo 门禁，通过后 `changeset publish` 发布到 npm

### `[skip ci]` 陷阱（已规避，供溯源）

changeset 2.31 在 `"commit": true` 时，`pnpm version-packages` 生成的 `RELEASING` 提交**默认带 `[skip ci]`**。若 tag 指向该提交，`publish.yml`（由 `v*` tag 触发）会被 `[skip ci]` 静默跳过、npm 不发布。已在 `.changeset/config.json` 通过 `"commit": ["@changesets/cli/commit", { "skipCI": false }]` 关闭。即便如此，发布后仍需核对 GitHub Actions 的 Publish run 是否成功、npm 是否真的出新版本。

### Commit 格式要求

```text
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert
scope: ui | cli | docs | registry | shared | deps | theme（可选，支持并推荐使用如 `ui/toast` 的子 Scope）
```

Breaking Change 标记方式：

- `feat(ui)!: 重命名 Button API`（加 `!`）
- commit body 中写 `BREAKING CHANGE: description`

根 CHANGELOG 生成依赖 commit message 质量，请严格遵守 [提交信息规范](COMMIT_CONVENTION.md)。

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

任何包含 breaking change 的发布都必须提供迁移指南，让用户能低成本完成手动的版本升级。本规范是 v2.2 改进计划 [Item 9（组件迁移引擎）](../plans/辅助包改进方案-v2.md#9-组件迁移引擎) 暂缓期间的轻量替代方案——在缺少 codemod 自动迁移的前提下，把"迁移成本"压到最低。

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

### Registry manifest 自动签名

发布链路会对 `registry-manifest.json` 做 Ed25519 签名，CLI 零配置即可验签官方 Registry：

- **Secret 配置**：仓库需配置 `BRUTX_REGISTRY_PRIVATE_KEY`（PKCS8 DER base64 单行）与 `BRUTX_REGISTRY_KEY_ID`（`official-v1`）。私钥对应公钥硬编码于 CLI 的 `OFFICIAL_PUBLIC_KEYS`（`packages/cli/src/lib/constants.ts`），**二者必须匹配**，否则 CLI 严格模式验签会失败
- **发布时**：`publish.yml` 注入私钥环境变量，`brutx-registry-vue build` 自动签名（`signManifestFromEnv`）
- **签名与分发**：签名在发布流程中由 `publish.yml` 注入私钥自动完成，签名 manifest 随产物一起上传为 GitHub Release 资产（`releases/latest/download`），CLI 默认源即指向该端点。产物不入库，"push 到 main 即回填签名"的 `sign-manifest` job / `registry-sign.yml` 机制已随产物移出 git 一并拆除
- **未签名回退**：Fork / 本地 build 未注入私钥时保持未签名，CLI 向后兼容跳过
- **幂等性**：manifest 的 `buildTimestamp`/`gitCommit`/`integrity`/`signature`/`keyId` 均不参与 integrity 计算，签名只覆盖 integrity，跨发布稳定（发布时注入的 `gitCommit` 不影响签名）
