# 发布流程

> 发布系统**原理**与一次性配置（供应链签名、归档机制、脚本工作原理）见 [发布架构与原理](RELEASE_ARCHITECTURE.md)。本文档只讲"每次发布怎么做"。

## 速查清单（TL;DR）

发布前先 `git status` 审视工作区，确保本次发布改动全部已提交，然后：

```bash
pnpm changeset             # ① 声明变更（PR 时已声明则跳过）
pnpm release:prepare       # ② 守卫 + bump 版本 + 生成包/根 CHANGELOG + 自动提交（一条命令）
pnpm release:check         # ③ 本地全量门禁检验（构建/契约/消费者/发布状态机）（或 pnpm release）
pnpm release:tag           # ④ 自动读 ui 版本打 annotated tag v<version>
git pushp origin main --tags   # ⑤ 推送后 CI 自动发布
```

> [!NOTE]
> - 发布后核对 GitHub Actions 的 **Publish** run 是否成功、npm 是否真的出新版本（`brutx-ui-vue` / `brutx-vue`）。
> - 发布后发现问题需补修：提交修复 commit → `pnpm release:tag --force`（重打 tag 指向最新 commit）→ 重新推送。

## 版本发布（操作手册）

### 核心命令

|命令|作用|
|---|---|
|`pnpm changeset`|交互式声明变更（PR 时使用）|
|`pnpm release:prepare`|版本准备：守卫 + `version-packages` + 根 CHANGELOG + 自动提交|
|`pnpm release:check`|发布前全量门禁检查：构建 + 单测 + 静态契约 + 消费者构建 + 发布状态机演练（`pnpm release` 同名别名）|
|`pnpm release:tag`|校验版本与提交一致后，打 annotated tag `v<version>`；`--force` 覆盖重打|
|`pnpm test:release`|发布协调状态机与工具链 provenance 单独演练测试|
|`pnpm changelog[:dry]`|单独生成/预览根 CHANGELOG（`release:prepare` 已内置，一般无需手动）|

### 发布步骤

1. **前置检查**
   - 工作区必须干净（`release:prepare` 会自动拦截已跟踪文件的未提交改动，未跟踪文件仅警告）——严禁在留有未提交组件代码时发布，否则产物不完整
   - 有未声明的变更先 `pnpm changeset`
   - 检查 `pnpm-lock.yaml`：若只改包自身 `version` 且 lockfile 无变化，可不提交 lockfile；若改了 `dependencies` / `devDependencies` / `peerDependencies` 或 lockfile 自动变化，必须提交同步后的 lockfile
   - **四处一致**：任何影响组件安装、注册表生成或发布产物的改动，都要同步检查 `packages/ui/`、`packages/shared/`、`packages/registry/`、`packages/cli/`（源码、组件元数据、registry 构建脚本、CLI 安装复制逻辑）

2. **`pnpm release:prepare`**：一条命令完成版本准备
   - 守卫：工作区干净 + 存在待发布 changeset
   - `pnpm version-packages`（changeset）→ bump 版本、生成各包 CHANGELOG、自动生成 `RELEASING` commit（`[skip ci]` 已配置关闭）
   - `pnpm changelog` → 更新根 CHANGELOG + 自动归档旧版本
   - 自动提交根 CHANGELOG（`docs: 更新根 CHANGELOG 至 <version>[并归档 ...]`）

3. **`pnpm release:check`（或 `pnpm release`）**：本地全量发布门禁检验
   - 执行 `turbo run build test typecheck lint`
   - 运行静态契约检查（`check:contracts`）
   - 运行真实消费者安装构建矩阵（`test-consumers`）
   - 运行发布状态机与 provenance 演练（`test:release`）
   - 检验通过后生成本地凭据 `tmp/release-check.json` 供打 tag 时校验

4. **`pnpm release:tag`**：自动读取 UI 包版本打 `v<version>` tag。tag 命名以 UI 包版本为主（如 `v0.10.0`），CLI 版本不单独打 tag。若 tag 已存在且指向当前提交，自动视为已完成。

5. **推送**：`git pushp origin main --tags`（直连为 `git push origin main --tags`）。推送后由云端发布状态机协调器自动发布（`publish.yml`）

6. **发布后核对**：确认 GitHub Actions 的 Publish run 成功，npm 上 `brutx-ui-vue` / `brutx-vue` 出新版本

### 发布后修复

- tag 已打但发布失败 / 需补修：提交修复 commit → `pnpm release:tag --force` 重打 tag（指向最新 commit）→ 重新推送
- 同一 tag 重跑或重推时，CI 发布状态机协调器自动执行幂等恢复：核验既有资产与已发布 npm 版本的 shasum，仅补齐未完成阶段，不篡改不可变资产。

## 防坑 Checklist

- [ ] 工作区干净（有未提交改动时 `release:prepare` 会中止）
- [ ] 四处一致：ui / shared / registry / cli 的源码、元数据、构建脚本、CLI 复制逻辑
- [ ] lockfile 已同步（依赖变更时）
- [ ] 严禁本地直接向 npm 发布：统一由 CI 发布状态机协调器完成，确保产物密封封存、SHA256SUMS 与 provenance 证据一致。
- [ ] Windows 下 `changeset version` 的 RELEASING commit 会因反斜杠 pathspec 报错（`fatal: pathspec '.changeset\xxx.md' did not match any files`）——属已知无害现象：版本 bump / 包 CHANGELOG / changeset 删除均已生效，改动随 prepare 后续 docs 提交一并入库，无需处理
- [ ] 发布后核对 Publish run 与 npm 版本

## Changelog 体系概览

- **各包 CHANGELOG**（`packages/ui/CHANGELOG.md` 等）：由 changeset 在 `version-packages` 时生成
- **根 CHANGELOG.md**：由脚本 `scripts/release/generate-changelog.mjs` 汇总两 tag 间 conventional commits；根文件仅保留最近 3 个版本，更早自动归档至 `apps/docs/changelog/`
- 工作原理与注意事项见 [发布架构与原理](RELEASE_ARCHITECTURE.md#根-changelogmd-生成)

## Breaking Change 迁移文档规范

任何包含 breaking change 的发布必须提供迁移指南（影响范围 / 变更原因 / before-after 迁移代码 / 自动迁移可行性评估），在 CHANGELOG 与 release notes 中按模板记录。完整模板与落地要求见 [发布架构与原理](RELEASE_ARCHITECTURE.md#breaking-change-迁移文档规范)。

## 供应链安全

GitHub Actions 使用 SHA pin 锁定第三方 Action（dependabot 每周一自动升级）；`registry-manifest.json` 发布时由 CI 注入私钥自动做 Ed25519 签名，CLI 零配置验签官方 Registry。详见 [发布架构与原理](RELEASE_ARCHITECTURE.md#供应链安全)。
