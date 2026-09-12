---
title: 供应链安全与合规
description: BrutxUI 的供应链安全防护体系、Ed25519 签名验证、密钥轮换及 CycloneDX 1.5 SBOM 合规指南
---

# 供应链安全与合规

现代前端工程极度依赖外部开源组件与构建产物分发链路。BrutxUI 从架构设计阶段即将**防篡改**与**透明合规**作为核心契约，建立了涵盖「规范化完整性哈希」、「Ed25519 数字签名」、「严格验签门禁」、「CycloneDX 1.5 SBOM 物料清单」以及「本地审计日志追踪」的全链路防御模型。

---

## 威胁模型与防护目标

BrutxUI 采用以源码形式将组件代码直接集成至用户项目的模式（区别于传统 npm 预编译包）。这一模式带来了高度的定制自由，但同时也对分发源的纯洁性提出了更高要求：

| 攻击途径 | 风险描述 | BrutxUI 防御机制 |
| :--- | :--- | :--- |
| **中间人劫持 / CDN 篡改** | 网络链路劫持恶意替换组件源码 | Manifest 规范化 SHA-256 完整性复算与强校验 |
| **未授权发布 / 伪造源** | 攻击者伪造 Registry 元数据发布恶意组件 | Ed25519 非对称数字签名与受信任公钥链校验 |
| **版本漂移与静默篡改** | 依赖关系发生恶意静默重定向 | 严格锁定组件间 Registry 依赖图（`registryDependencies`） |
| **企业供应链合规盲区** | 无法审计项目引入的底层三方依赖与许可协议 | 原生导出 CycloneDX 1.5 格式 SBOM 软件物料清单 |
| **本地状态漂移** | 本地代码被非预期修改导致与基线偏离 | `doctor --fail-on drift` 与完整性自愈（`restore-integrity`） |

---

## 完整性复算与 Ed25519 签名

### 1. 规范化内容哈希复算
当 CLI 从远端 Registry 拉取 `registry-manifest.json` 时，首先执行第一道防线——**内容规范化 SHA-256 复算**：
- 提取 `name`、`schemaVersion`、`registryVersion`、`items` 等核心实体字段进行规范化序列化并计算哈希；
- 将计算结果与 Manifest 中的 `integrity` 字段进行比对；
- 动态时间戳（`buildTimestamp`）、提交哈希（`gitCommit`）与签名元数据自身不参与计算，确保构建幂等与抗重放干扰。
- **防护收益**：即使攻击者试图修改 Manifest 中的任何组件声明或代码摘要，只要未能伪造全局哈希，请求将立即被拒绝。

### 2. Ed25519 数字签名验签
第二道防线为**非对称数字签名验签**：
- 发布流程使用维护者私钥对 Manifest 的规范化哈希生成 Ed25519 数字签名；
- Manifest 携带签名结果 `signature` 与密钥标识符 `keyId`；
- CLI 在本地通过受信任的公钥匹配 `keyId`，验证签名确由官方或受信任的维护者签发。

### 3. 开箱即用的官方信任锚
对于绝大多数开发者，这一安全链路是**零配置（Zero-config）、静默生效**的：
- CLI 内部内置了 BrutxUI 官方发布密钥的 Root 公钥；
- 当从官方 Registry 下载时，CLI 默认自动执行验签；
- 未签名的旧版 Manifest 保持平滑兼容跳过，不阻断常规业务。

---

## 严格签名模式（Strict Signature Mode）

### 默认 Warn 机制
在默认开发环境中，若发现未知 `keyId` 或验签失败，CLI 会输出警告（`warn`）并允许继续，以避免在企业内部网络配置或密钥迁移过渡期造成非预期阻断：

```text
[Signature] Manifest signed with unknown keyId "v1". No matching trusted public key found.
  (use --require-signature to enforce)
```

### 生产与 CI 严格门禁
在生产环境部署、CI/CD 自动化流水线或企业内网中，强烈建议激活**严格模式**。在严格模式下，任何验签失败或未信任密钥均会直接抛出 `REGISTRY_SIGNATURE_INVALID` 错误并以退出码 `1` 阻断执行：

可以通过以下任一方式激活严格签名模式：

```bash
# 方式 1：CLI 命令行参数（优先级最高）
npx brutx-vue@latest --require-signature add button

# 方式 2：CI 环境变量
export BRUTX_REQUIRE_SIGNATURE=1
npx brutx-vue@latest add button
```

或在项目配置文件 `components.json` 中声明项目级强制验签：

```json
{
  "$schema": "https://lidaixingchen.github.io/brutxui-vue3/schema.json",
  "$version": 1,
  "style": "brutalism",
  "requireSignature": true
}
```

---

## 企业私有 Registry 与密钥管理

企业在内网镜像或自建私有 Registry 时，可建立专属的公私钥体系与密钥轮换机制。

### 信任公钥解析优先级
CLI 按以下优先级解析受信任公钥，官方 Root 公钥始终作为底层信任锚并入：
1. **项目配置文件**：`components.json` 的 `trustedPublicKeys` 数组（最高优先级，同名 `keyId` 可覆盖官方配置）
2. **环境变量**：`BRUTX_REGISTRY_PUBLIC_KEYS`（JSON 数组字符串）
3. **内置公钥**：CLI 官方 Root 公钥（兜底信任锚）

### 公钥配置示例
公钥统一采用 **SPKI DER 格式的 Base64 单行编码**，便于在 JSON 与环境变量中直接传递。

在 `components.json` 中配置：

```json
{
  "trustedPublicKeys": [
    {
      "keyId": "corp-registry-2026",
      "publicKey": "MCowBQYDK2VwAyEA9Yg1r5Q3t6e...",
      "status": "active",
      "note": "企业内网 Registry 2026 年度签名公钥"
    }
  ]
}
```

在 CI/CD 中通过环境变量注入：

```bash
export BRUTX_REGISTRY_PUBLIC_KEYS='[{"keyId":"corp-registry-2026","publicKey":"MCowBQYDK2VwAyEA9Yg1r5Q3t6e..."}]'
```

### 平滑密钥轮换规范
当年度密钥到期或维护者更迭需轮换密钥时：
1. **签发阶段**：使用新私钥签发新版 Manifest（如 `keyId: "corp-2027"`）；
2. **过渡阶段**：在受信任公钥列表中同时保留旧 key（`corp-2026`）与新 key（`corp-2027`），新旧 Manifest 均可顺利验签；
3. **撤销阶段**：历史依赖全部平滑过渡后，将旧 key 从配置中移除，彻底阻断旧私钥资产的合法性。

---

## CycloneDX 1.5 软件物料清单（SBOM）

软件物料清单（Software Bill of Materials, SBOM）是现代企业安全合规（如 SOC 2、ISO 27001、Executive Order 14028）的核心要求。BrutxUI 全面拥抱 OWASP [CycloneDX 1.5](https://cyclonedx.org/) 行业标准规范。

### 1. 项目级 SBOM 导出（`doctor --sbom`）
在项目中随时可以一键生成当前项目已安装 BrutxUI 组件的完整物料清单：

```bash
# 默认生成至当前目录下的 ./brutx-sbom.json
npx brutx-vue@latest doctor --sbom

# 指定自定义输出路径
npx brutx-vue@latest doctor --sbom --sbom-output ./reports/brutx-sbom.json
```

导出的 SBOM 包含以下核心元数据：
- 规范版本：`specVersion: "1.5"`，格式 `bomFormat: "CycloneDX"`
- 组件集合：已安装的所有 UI 组件（声明为 `type: application`，唯一标识 `bom-ref: "brutx:<component>"`）
- 外部依赖：引入的 npm 依赖包及版本（声明为 `type: library`，唯一标识 `bom-ref: "npm:<package>"`）
- 完整依赖拓扑：`dependencies` 数组严格描述组件与 npm 包、组件与组件之间的引用关系
- 内容指纹：每个已安装组件的规范化内容哈希，供外部审计系统做基线比对

### 2. 注册表级 SBOM（发布资产）
在 Registry 构建阶段，构建引擎会自动编译输出 `registry-sbom.json`。该文件不仅涵盖注册表中的全部组件物料，还通过 `manifestIntegrity` 字段与对应的 `registry-manifest.json` 进行双向绑定锁定。

### 3. 企业级安全审计流水线集成
导出的 CycloneDX 1.5 SBOM 可无缝导入企业漏洞与资产分析平台：
- **Dependency-Track**：持续监控项目引入组件的脆弱性与漏洞公告（CVE）；
- **Snyk / Trivy**：直接摄取 SBOM 进行许可证合规分析（License Compliance）与安全门禁拦截；
- **GitHub Dependency Submission API**：自动上报组件依赖至代码仓库的 Dependency Graph 与 Dependabot 警报体系。

---

## 本地审计日志（Audit Log）

所有写操作（`add`、`update`、`remove`、`diff`）执行完毕后，CLI 会在项目根目录下的 `.brutx/audit.log` 自动追加单行 JSONL 格式的审计日志。

### 审计日志记录格式
每条日志完整记录了操作发生的上下文，为团队审计与事故追溯提供第一现场凭据：

```json
{
  "timestamp": "2026-09-12T14:30:00.000Z",
  "command": "add",
  "components": ["button", "card"],
  "registrySource": "https://github.com/lidaixingchen/brutxui-vue3/releases/latest/download",
  "success": true,
  "dryRun": false
}
```

### 诊断联动回溯
运行 `npx brutx-vue@latest doctor` 时，健康诊断引擎会自动扫描 `.brutx/audit.log` 中最近的失败记录：
- 若近期存在网络超时、源不可达或写入中断，`doctor` 会在终端高亮提示故障时间戳与失败原因，辅助开发者快速定位问题。

---

## 团队落地推荐清单

为了在团队中构建最高安全等级的前端工程，推荐采纳以下实践：

1. **启用严格验签门禁**：在 `components.json` 中配置 `"requireSignature": true`，禁止未经验签的代码写入；
2. **纳入 CI 漂移检测**：在持续集成流程中加入 `npx brutx-vue@latest doctor --ci --fail-on drift`，防止未经审计的手工篡改；
3. **定期归档 SBOM 资产**：在版本发布工作流中执行 `npx brutx-vue@latest doctor --sbom`，将 SBOM 产物随构建制品一同归档备查；
4. **规范 Git 追踪策略**：保留 `.brutx/` 元数据并提交至 Git 仓库，但将 `.brutx/cache/` 临时下载目录加入 `.gitignore`。
