# CLI 基础设施全链路闭环改进计划

本文旨在解决 `cli/manifest` (4ce99d7) 与 `cli/registry` (b084a17) 引入的两项核心基础设施（Ed25519 签名校验、多 Registry 源与离线韧性）在落地后面临的**“CLI 引擎就绪，但全链路未闭环”**问题，提出具体的闭环深化方案。

---

## 1. 现状基线与主要张力

### 1.1 现状成果（已落地能力）
根据 `4ce99d7` 和 `b084a17` 的提交历史与测试套件：
- **Ed25519 签名设施**：`packages/cli/src/lib/signature.ts` 已支持基于 `crypto` 的 SPKI/PKCS8 密钥对生成、Integrity 哈希签名、公钥轮换（Key Rotation）以及 `--require-signature` 严格模式。
- **多源与离线韧性**：`packages/cli/src/lib/registry-source.ts` 已实现 `fetchWithSources` 多源按序重试、`BRUTX_OFFLINE=1` / `--offline` 零网络强复用缓存、Bearer Token 认证标头注入及 `brutx doctor` 可达性探测。

### 1.2 核心张力（为什么缺乏体感）
1. **签名未闭环**：CLI 具备验签逻辑，但 `packages/registry` 的 `build-registry.ts` 在 CI/CD 构建发布产物时，未接入私钥自动签发逻辑，导致发出的 Manifest 缺乏 `signature` / `keyId` 字段，CLI 默认触发向后兼容短路（Skipped）。
2. **信任链依赖环境变量**：受信任公钥需用户显式配置 `BRUTX_REGISTRY_PUBLIC_KEYS`，缺少官方 Root 公钥内置机制。
3. **默认源单一**：`DEFAULT_REGISTRY_URL` 仅配置了单条 GitHub Raw 链接，未利用多源引擎在默认配置下提供 CDN 冗余。
4. **缺乏源管理交互**：配置多源仍需手动编辑 `components.json` 的 `registries` 数组，缺乏命令行快捷入口。

---

## 2. 改进方案与任务拆解

### 任务一：Ed25519 签名全链路闭环 (P0)

#### 1. CI/CD 注册表构建自动化签发
* **目标**：在 `packages/registry/scripts/build-registry.ts` 中集成签名步骤，确保产出的 `registry-manifest.json` 带有权威签名。
* **实现步骤**：
  1. 在 GitHub Actions 发布工作流中注入秘钥环境变量 `BRUTX_REGISTRY_PRIVATE_KEY`（PKCS8 Base64 格式）与 `BRUTX_REGISTRY_KEY_ID`。
  2. 修改 `build-registry.ts`，在生成 `registry-manifest.json` 的 `integrity` 字段后，调用 `signManifestIntegrity()` 生成签名并写入 Manifest。
  3. 未配置私钥时（如本地开发 build）保留未签名状态或打出调试日志。

#### 2. 内置官方根公钥与信任链 (P1)
* **目标**：让用户在不设置环境变量的情况下，也能开箱即用校验官方 Registry 的真实性。
* **实现步骤**：
  1. 在 `packages/cli/src/lib/signature.ts` 中硬编码内置 `OFFICIAL_PUBLIC_KEYS` 数组作为静态 Trust Store。
  2. `loadTrustedPublicKeys()` 解析逻辑调整为：`环境变量公钥 || OFFICIAL_PUBLIC_KEYS`。
  3. 支持在 `components.json` 中配置 `trustedPublicKeys` 字段，允许项目级追加信任公钥。

#### 3. 严格模式项目级配置 (P1)
* **目标**：允许团队在项目中强制开启签名校验。
* **实现步骤**：
  1. 扩展 `BrutalistConfig` 类型，增加 `requireSignature?: boolean` 字段。
  2. 修改 `packages/cli/src/lib/signature-mode.ts`，提升优先级：`--require-signature` > `BRUTX_REQUIRE_SIGNATURE` > `config.requireSignature`。

---

### 任务二：多源与离线韧性体验深化 (P0 - P1)

#### 1. 官方默认源 CDN 冗余 (P0)
* **目标**：在零配置情况下利用多源引擎提供高可用兜底。
* **实现步骤**：
  1. 修改 `packages/cli/src/lib/constants.ts` 中的 `DEFAULT_REGISTRY_URL`，重构为 `DEFAULT_REGISTRY_SOURCES` 数组：
     ```typescript
     export const DEFAULT_REGISTRY_SOURCES = [
         'https://raw.githubusercontent.com/lidaixingchen/brutxui-vue3/main/packages/registry/registry',
         'https://cdn.jsdelivr.net/gh/lidaixingchen/brutxui-vue3@main/packages/registry/registry',
     ] as const;
     ```
  2. 调整 `resolveRegistrySources()`：未配置自定义源时，默认返回 `DEFAULT_REGISTRY_SOURCES` 完整副本。

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

## 3. 验证与验收契约

| 模块 | 验证方式 | 期望结果 |
| --- | --- | --- |
| 自动签名 | `pnpm --filter brutx-registry-vue build` 配合私钥环境变量 | 生成的 `registry-manifest.json` 包含合法的 `keyId` 与 `signature` |
| 内置公钥验签 | 不配置环境变量，运行带 `--require-signature` 的 `brutx add` | 正确验证官方签名并通过，无 Warn 输出 |
| 默认 CDN Fallback | 模拟 GitHub Raw 网络超时/阻断环境 | CLI 自动输出 Fallback 警告并顺畅从 jsDelivr CDN 完成安装 |
| 离线模式 | 断网状态下执行 `brutx add button --offline` | 终端显示 `[OFFLINE CACHE HIT]` 提示，不发起 HTTP 请求并秒级完成安装 |

---

## 4. 相关参考文档
- [AGENTS.md](../AGENTS.md)
- [RELEASE.md](./RELEASE.md)
- [AUXILIARY_PACKAGES_IMPROVEMENT_PLAN_V2.md](./AUXILIARY_PACKAGES_IMPROVEMENT_PLAN_V2.md)
