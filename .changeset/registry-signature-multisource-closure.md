---
"brutx-vue": minor
---

CLI 基础设施全链路闭环（INFRASTRUCTURE_CLOSURE_PLAN）：

- **Ed25519 签名信任链闭环**：内置官方 Root 公钥（`OFFICIAL_PUBLIC_KEYS`），零配置即可验签官方 Registry；`components.json` 支持 `requireSignature` / `trustedPublicKeys` 项目级配置；`--require-signature` flag 现真正激活严格模式。
- **manifest 内容完整性校验**：验签前先复算 manifest 自身 integrity 并与 `integrity` 字段比对（与 build 侧共用 `computeRegistryManifestIntegrity` 单一实现源），封堵"篡改内容但保留原签名"的空子；签名/完整性失败不再折叠成泛化 `REGISTRY_FETCH_FAILED`。
- **默认多源 + 离线韧性**：默认 Registry 源改为 GitHub Raw + jsDelivr CDN 双源（`DEFAULT_REGISTRY_SOURCES`），零配置即可 CDN fallback；离线模式依次尝试各源缓存并输出 `[OFFLINE CACHE HIT]` 提示。
- **源管理子命令**：新增 `brutx registry list / add / remove` 命令式管理 `components.json` 的 `registries`。
- **缓存可观测性**：`brutx doctor` 报告缓存条目数、占用体积与离线可用状态。
- **构建侧自动签发**：`build-registry.ts` 检测 `BRUTX_REGISTRY_PRIVATE_KEY` / `BRUTX_REGISTRY_KEY_ID` 时对 registry-manifest 自动签名（CI 注入），Fork/本地保持未签名向后兼容。
