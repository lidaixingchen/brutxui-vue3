# CLI 基础设施全链路闭环改进计划

> 方案类型：优化
> 状态：archived
> 日期：2026-07-28
> 修订记录：2026-08-11 归档 —— 全部闭环落地，移入 archive/2026/
> 修订记录：2026-08-11 落地核查确认 —— 签名链（CI 自动签发/内置公钥/严格模式）、源管理（registry list/add/remove）、离线可观测全部闭环；默认源由双源 CDN 收敛为单源 Release 系架构演进决策

本文旨在解决 `cli/manifest` (4ce99d7) 与 `cli/registry` (b084a17) 引入的两项核心基础设施（Ed25519 签名校验、多 Registry 源与离线韧性）在落地后面临的**“CLI 引擎就绪，但全链路未闭环”**问题，提出具体的闭环深化方案。

> [!NOTE]
> **文件路径厘清**：本计划中涉及签名签发的 Manifest 均为编译后发布的注册表产物 [packages/registry/registry/registry-manifest.json](../../../packages/registry/registry/registry-manifest.json)，切勿与 UI 包前置 AST 扫描生出的 [packages/ui/registry-manifest.json](../../../packages/ui/registry-manifest.json) 混淆。

---

## 1. 现状基线与主要张力

### 1.1 现状成果（已落地能力）
根据 `4ce99d7` 和 `b084a17` 的提交历史与测试套件：
- **Ed25519 签名设施**：`packages/cli/src/lib/signature.ts` 已支持基于 `crypto` 的 SPKI/PKCS8 密钥对生成、Integrity 哈希签名、公钥轮换（Key Rotation）以及 `--require-signature` 严格模式。
- **多源与离线韧性**：`packages/cli/src/lib/registry-source.ts` 已实现 `fetchWithSources` 多源按序重试、`BRUTX_OFFLINE=1` / `--offline` 零网络强复用缓存、Bearer Token 认证标头注入及 `brutx doctor` 可达性探测。

### 1.2 核心张力（为什么缺乏体感）
1. **签名未闭环**：CLI 具备验签逻辑，但 `packages/registry` 的 `build-registry.ts` 在 CI/CD 构建发布产物时，未接入私钥自动签发逻辑，导致发出的 `packages/registry/registry/registry-manifest.json` 缺乏 `signature` / `keyId` 字段，CLI 默认触发向后兼容短路（Skipped）。
2. **信任链依赖环境变量**：受信任公钥需用户显式配置 `BRUTX_REGISTRY_PUBLIC_KEYS`，缺少官方 Root 公钥内置管理机制。
3. **默认源单一**：`DEFAULT_REGISTRY_URL` 仅配置了单条 GitHub Raw 链接，未利用多源引擎在默认配置下提供 CDN 冗余。
4. **缺乏源管理交互**：配置多源仍需手动编辑 `components.json` 的 `registries` 数组，缺乏命令行快捷入口。

---

## 2. 改进方案与任务拆解

### 任务一：Ed25519 签名全链路闭环 (P0)

#### 1. CI/CD 注册表构建自动化签发与安全隔离
* **目标**：在 `packages/registry/scripts/build-registry.ts` 中集成签名步骤，确保产出的 `packages/registry/registry/registry-manifest.json` 带有权威签名，同时防止 CI 秘钥泄露。
* **实现步骤**：
  1. 在 GitHub Actions 主分支（`main`）发布工作流（如 `github.ref == 'refs/heads/main'`）中安全注入 Secret：秘钥环境变量 `BRUTX_REGISTRY_PRIVATE_KEY`（PKCS8 Base64 格式）与 `BRUTX_REGISTRY_KEY_ID`。Fork PR 或非受信环境不注入私钥。
  2. 修改 `build-registry.ts`，在生成 `registry-manifest.json` 的 `integrity` 字段后，若检测到私钥环境变量，调用 `signManifestIntegrity()` 生成签名并写入 Manifest。
  3. 未配置私钥时（如本地开发 build 或 Fork CI build）保留未签名状态，输出 Debug 日志提醒。

#### 2. 内置官方根公钥与信任链规范 (P1)
* **目标**：遵循无硬编码规范（收拢至 `constants.ts`），让用户在不设置环境变量的情况下开箱即用校验官方 Registry 的真实性。
* **实现步骤**：
  1. 在 `packages/cli/src/lib/constants.ts` 中集中管理 `OFFICIAL_PUBLIC_KEYS` Trust Store 常量数组，包含结构化元数据（`keyId`、`publicKey`、`status` 等），避免在业务代码中内联硬编码字符串。
  2. `loadTrustedPublicKeys()` 解析逻辑调整为：优先读取 `components.json` 中的 `trustedPublicKeys` / 环境变量公钥，若未配置则回退至 `constants.ts` 的 `OFFICIAL_PUBLIC_KEYS`。
  3. 支持在项目 `components.json` 中配置 `trustedPublicKeys` 字段，允许项目级追加信任公钥。

#### 3. 严格模式与配置向下兼容 (P1)
* **目标**：允许团队在项目中强制开启签名校验，并保证旧版本配置文件的平滑兼容。
* **实现步骤**：
  1. 扩展 `BrutalistConfig` 类型，增加 `requireSignature?: boolean` 及 `trustedPublicKeys?: TrustedPublicKey[]` 字段。
  2. 修改 `packages/cli/src/lib/signature-mode.ts`，提升优先级：`--require-signature` > `BRUTX_REQUIRE_SIGNATURE` > `config.requireSignature`。
  3. CLI 在解析读取旧版未包含新字段的 `components.json` 时保持静默兼容，确保自动 Upgrade / Fallback 逻辑生效。

---

## 3. 任务二：多源与离线韧性体验深化 (P0 - P1)

#### 1. 官方默认源 CDN 冗余与缓存一致性 (P0)
* **目标**：在零配置情况下利用多源引擎提供高可用兜底，同时防范 CDN 延迟导致的数据不一致。
* **实现步骤**：
  1. 修改 `packages/cli/src/lib/constants.ts` 中的 `DEFAULT_REGISTRY_URL`，重构为 `DEFAULT_REGISTRY_SOURCES` 数组：
     ```typescript
     export const DEFAULT_REGISTRY_SOURCES = [
         'https://raw.githubusercontent.com/lidaixingchen/brutxui-vue3/main/packages/registry/registry',
         'https://cdn.jsdelivr.net/gh/lidaixingchen/brutxui-vue3@main/packages/registry/registry',
     ] as const;
     ```
  2. 调整 `resolveRegistrySources()`：未配置自定义源时，默认返回 `DEFAULT_REGISTRY_SOURCES` 副本。
  3. 增强多源降级一致性处理：当第一源（GitHub Raw）超时切至第二源（jsDelivr CDN）发生 integrity/signature 校验失败时，自动提示可能存在 CDN 延迟，并尝试强制拉取主源或抛出清晰一致性告警。

#### 2. 源管理 CLI 子命令扩展 (P1)
* **目标**：提供命令式的 Registry 源管理体验。
* **实现步骤**：
  1. 在 CLI 中新增 `brutx registry` 或 `brutx config` 子命令组：
     - `brutx registry list`：打印当前解析生效的所有源及其连通性状态。
     - `brutx registry add <url>`：向 `components.json` 的 `registries` 列表添加源。
     - `brutx registry remove <url>`：移除指定源。

#### 3. 离线模式与缓存可观测性增强 (P2)
* **目标**：增强离线命中时的显性终端感知。
* **实现步骤**：
  1. 当通过 `--offline` 或 `BRUTX_OFFLINE=1` 成功从缓存读取组件时，logger 输出 `[OFFLINE CACHE HIT]` 提示。
  2. 在 `brutx doctor` 诊断报告中，显式列出当前缓存条目数、占用体积以及离线可用状态。

---

## 4. 验证与验收契约

| 模块 | 验证方式 | 期望结果 |
| --- | --- | --- |
| 自动签名 | `pnpm --filter brutx-registry-vue build` 配合私钥环境变量 | 生成的 `packages/registry/registry/registry-manifest.json` 包含合法的 `keyId` 与 `signature` |
| 内置公钥验签 | 不配置环境变量，运行带 `--require-signature` 的 `brutx add` | 正确验证官方签名并通过，无 Warn 输出 |
| 完整性复算 | 篡改已签名 manifest 的 `registryVersion`/`items`（保留原 `integrity`+`signature`）后运行严格模式 `brutx add` | 复算比对识破，抛出 `REGISTRY_SIGNATURE_INVALID`（默认模式 Warn） |
| 默认 CDN Fallback | 模拟 GitHub Raw 网络超时/阻断环境 | CLI 自动输出 Fallback 警告并顺畅从 jsDelivr CDN 完成安装 |
| 离线模式 | 断网状态下执行 `brutx add button --offline` | 终端显示 `[OFFLINE CACHE HIT]` 提示，不发起 HTTP 请求并秒级完成安装 |

> [!IMPORTANT]
> **验收依赖（部署态）**：上述"内置公钥验签"与"完整性复算"仅对**已签名**的 manifest 生效；
> 当前 main 上提交的 `registry-manifest.json` 仍为**未签名**（严格模式对未签名 manifest 静默跳过=向后兼容）。
> 需 CI `sign-manifest` job 在 main 上成功跑一次（或手动用官方私钥签署提交）后，
> 线上产出的已签名 manifest 才会真正激活"零配置开箱验签"。
>
> **幂等保证**：`sign-manifest` job 已 `unset GITHUB_SHA/COMMIT_SHA`，且 manifest 的
> `buildTimestamp`/`gitCommit`/`signature`/`keyId` 均不参与 integrity 计算，因此签名稳定、
> 产物完全幂等——首次补签后不会因每次 push 产生提交抖动。
>
> **完整性复算契约**：CLI 侧 `verifyManifestIntegrityAndSignature` 对 manifest 的
> `name/schemaVersion/registryVersion/items` 复算 sha256 并与 `integrity` 字段比对，再验签名。
> 复算算法与 build 侧共用 `brutx-shared-vue` 的 `computeRegistryManifestIntegrity`（单一实现源），
> 严禁 build 侧与 CLI 侧各自单独实现（否则规范化漂移会导致验签误判）。

---

## 5. 相关参考文档

- [AGENTS.md](../../../AGENTS.md)
- [RELEASE.md](../../guides/RELEASE.md)
- [AUXILIARY_PACKAGES_IMPROVEMENT_PLAN_V2.md](../../plans/辅助包改进方案-v2.md)
