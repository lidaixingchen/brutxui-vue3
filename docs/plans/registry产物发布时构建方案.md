# Registry 产物发布时构建计划（产物不入库）

> 方案类型：重构 / 流程改造
> 状态：**active**（已定稿：分发端点选型 GitHub Release 资产）
> 日期：2026-08-09
> 关联文档：[CLI基础设施闭环方案.md](CLI基础设施闭环方案.md)、[RELEASE.md](../guides/RELEASE.md)
> 修订记录：2026-08-10 全面审查后修正 —— 修正 CLI 侧 4 处行号（§3 拼接 :262→:401；T2 resolveVersionedSource :504-515→:659-670；§2.3 signature.ts 两处 :150-211/:274-297）；§1.1 归因补充 SBOM timestamp 消费点（:817）、gitCommit 双来源与"可复现构建"注释位置（:806）；§2.3 限定默认/严格模式语义、签名双环境变量；§3 增补预发布 tag 抢占 latest 风险；T1 增 create 幂等化、上传 glob 与数量校验、keyId 断言、GH_TOKEN 表述修正；T2 同步 @version 改动面与 DEFAULT_REGISTRY_URL 使用点；T3 补 COMPONENT_GUIDE.md 与 README Pages URL 并整理加粗；T5 补门禁 exclude 说明；T11 修正输入源缺失范围并增加 turbo gitignored 哈希实测验证；T13 补 :39 第二处过时注释与 :45 死配置；T14 精确 AGENTS.md 表格行号（:7-11）；§2.2 "三类"→"四路径"；§7 新增旧版 CLI 断供与预发布两条风险；§8 验证项补 keyId；§9 附录行号同步。
> 修订记录：2026-08-09 全面修正 —— 依据源码核验修正 §1.1 冲突归因、产物数量口径（86 组件）、若干行号引用；修正 T1/T2/T16 的 Release 资产扁平命名与按需拉取约束；修正 T10 误删范围（保留 ui manifest 的 linguist 标记）；T5/T6/T7 改为按路径细分保留 ui 侧生成文件的防漂移保护；T11 修正缓存键输入源缺口并考虑 Turbo Remote Cache 放大；补充发布顺序原子性、upload GH_TOKEN、英文文档与测试同步等遗漏。

---

## 1. 背景与目标

### 1.1 问题

`packages/registry/registry/` 下 90 个 JSON 产物（**86 组件** + `locale-zh-cn.json` + `index.json` + `registry-manifest.json` + `registry-sbom.json`）与 `packages/registry/.registry-cache.json` 目前**全部提交进 git main 分支**。由此引发两个持续性问题：

1. **反复发生的合并冲突**：产物是"双源驱动"的生成物——
   - 内容源：`packages/ui/src/**` 源码 + `packages/ui/registry-manifest.json` → 决定 `integrity`（内容哈希，[build-registry.ts:246-257](../../packages/registry/scripts/build-registry.ts#L246-L257)）；
   - 密钥源：`BRUTX_REGISTRY_PRIVATE_KEY`（仅 CI 环境）→ 决定 `signature`/`keyId`（[build-registry.ts:919-931](../../packages/registry/scripts/build-registry.ts#L919-L931)）。

   改任一源码 → 内容哈希 → `integrity` 变化 → 该组件 json + `index.json` + `registry-manifest.json` + `registry-sbom.json` **全部联动变化**；且 CI 构建注入 `gitCommit`（`GITHUB_SHA`，[build-registry.ts:1159](../../packages/registry/scripts/build-registry.ts#L1159)）与签名，本地构建无 `gitCommit` 且未签名。签名与 integrity 严格绑定（`signature = f(integrity)`，[build-registry.ts:928](../../packages/registry/scripts/build-registry.ts#L928)），无法"取一半"合并 → 只要本地改过源码再 pull，manifest 必冲突。

   > 冲突归因说明（避免误导）：产物并非"每次构建必然不同"。`buildTimestamp` 默认 `null`，仅在注入 `BRUTX_REGISTRY_BUILD_TIMESTAMP` 时变化（manifest 的 [build-registry.ts:1158](../../packages/registry/scripts/build-registry.ts#L1158)，SBOM `metadata.timestamp` 的 [:817](../../packages/registry/scripts/build-registry.ts#L817) 同款回退）；SBOM `serialNumber` 是内容哈希派生的**确定性值**（[build-registry.ts:860-875](../../packages/registry/scripts/build-registry.ts#L860-L875)，"可复现构建"注释见 [:806](../../packages/registry/scripts/build-registry.ts#L806)）。系统性差异来自**源码改动驱动的 integrity 变化**与 **CI 环境注入的 gitCommit/签名**（gitCommit 取 `GITHUB_SHA ?? COMMIT_SHA`，[build-registry.ts:1159](../../packages/registry/scripts/build-registry.ts#L1159)）。

2. **生成物入库的配套成本**：CI drift 门禁（[ci.yml:75-85](../../.github/workflows/ci.yml#L75-L85)、[publish.yml:66-83](../../.github/workflows/publish.yml#L66-L83)）、pre-commit 自动重建钩子（[.husky/pre-commit:7-15](../../.husky/pre-commit#L7-L15)）、签名回填 workflow（`registry-sign.yml`、`ci.yml` sign-manifest job）——全部围绕"产物必须与提交态一致"运转，增加 CI 复杂度和发布门禁风险。

### 1.2 目标

- **产物不再进入 main 分支**：`packages/registry/registry/` 与 `.registry-cache.json` 从 git 跟踪移除并加入 `.gitignore`；
- **产物改为"发布时构建"**：tag 触发的发布流程中，基于最新源码构建 + 官方私钥签名 + 上传到独立分发端点；
- **CLI 官方源指向新端点**，新版 CLI 零配置用户体验不中断，签名校验链路真正生效；**旧版 CLI 用户需升级**——产物移出 main 后其默认 raw URL 立即失效（固有破坏性，见 §7 风险表）；
- 拆除围绕"registry 产物入库"的机制（registry 侧的 drift 门禁、签名回填、pre-commit 重建）；**`packages/ui/registry-manifest.json` 与 `packages/ui/src/styles.css` 仍入库跟踪，其防漂移保护保留**（见 T5/T6/T7）。

### 1.3 非目标

- 不迁移 `packages/ui/registry-manifest.json`（UI 包源码侧清单，另一条链，见 §2.3），本期保持不变，**其 linguist 标记与防漂移保护一并保留**；
- 不做 git 历史重写（历史 commit 中的旧产物保留，不清理）；
- 不改变 CLI 的 `--registry <本地路径>` 本地源能力（[CONTRIBUTING.md](../../CONTRIBUTING.md) 的本地开发流程继续有效）。

---

## 2. 现状基线（调研结论）

### 2.1 产物清单与 git 跟踪状态

| 路径 | 文件 | git 跟踪 |
|---|---|---|
| `packages/registry/registry/*.json` | **86 组件** + `locale-zh-cn.json` + `index.json` + `registry-manifest.json` + `registry-sbom.json`（共 90，`git ls-files` 确认） | ✅ 全部被跟踪 |
| `packages/registry/.registry-cache.json` | 构建缓存（组件名 → sourceHash） | ✅ 被跟踪 |
| `packages/registry/bench.json` / `registry/deps.dot` / `deps.json` | 本地观测/图输出 | ❌ 已 gitignore |

`.gitattributes:25` 将 registry JSON 标记为 `linguist-generated`（移出后清理）；`:26` 是 `packages/ui/registry-manifest.json` 的 linguist 标记，**不在清理范围**。

### 2.2 产物生命周期全链路

```
packages/ui/src/** 源码 + ui/registry-manifest.json
        │  build-registry.ts（输入：ui 源码相对路径直读，不经 turbo 依赖）
        ▼
packages/registry/registry/{name}.json + index.json + registry-manifest.json + registry-sbom.json
        │
        ├─ validate-registry.ts（校验：schema/元数据对齐/integrity/循环依赖/文档覆盖）
        ├─ verify-build.ts（可复现性：全量 vs 增量两轮 build 深度 diff，仅本地手动）
        ├─ CI drift 门禁（ci.yml:75-85、publish.yml:66-83：git diff --exit-code，覆盖 registry 产物 + ui manifest + styles.css）
        ├─ 签名回填（registry-sign.yml / ci.yml sign-manifest job → [skip ci] 提交回 main）
        ├─ pre-commit 钩子（ui/src 变更 → 重建 + git add 四个路径：registry 产物、.registry-cache.json、ui manifest、styles.css）
        └─ CLI 默认双源拉取（raw.githubusercontent.com / cdn.jsdelivr.net/gh，均指向 main 分支路径）
```

### 2.3 关键事实

- **CLI 默认双源硬编码指向 git main 分支路径**（[constants.ts:106-109](../../packages/cli/src/lib/constants.ts#L106-L109)）：
  `https://raw.githubusercontent.com/lidaixingchen/brutxui-vue3/main/packages/registry/registry`
  `https://cdn.jsdelivr.net/gh/lidaixingchen/brutxui-vue3@main/packages/registry/registry`
  产物移出后这两条 URL 立即 404，**这是本方案的最大硬依赖**。
- **签名机制已就绪但从未生效**：`signManifestFromEnv`（[build-registry.ts:919-931](../../packages/registry/scripts/build-registry.ts#L919-L931)）在 `BRUTX_REGISTRY_PRIVATE_KEY` 与 `BRUTX_REGISTRY_KEY_ID` **同时存在**时自动签名（[build-registry.ts:922](../../packages/registry/scripts/build-registry.ts#L922)，任一缺失即保持未签名）；publish.yml 已注入私钥（[publish.yml:22-23](../../.github/workflows/publish.yml#L22-L23)）。但当前 main 上已提交的 manifest 为**未签名**状态（`gitCommit/signature/buildTimestamp` 均为 null）——签名回填机制实际从未产出过签名产物。方案落地即让签名在发布时真正生效（首次发布需端到端验证 secret 的 keyId 与 CLI 内置 `official-v1` 一致，见 T1）。
- **签名语义兼容**：`manifest.integrity` 的计算排除 `buildTimestamp/gitCommit/integrity` 自身（[build-registry.ts:246-257](../../packages/registry/scripts/build-registry.ts#L246-L257)），签名只覆盖 integrity → "发布时基于最新源码构建 + 签名"与历史语义兼容，且签名不受发布时 `gitCommit`/`buildTimestamp` 变化影响（幂等）。
- **CLI 验签链路完整**：[signature.ts](../../packages/cli/src/lib/signature.ts)（`verifyManifestSignature` :150-211、`verifyManifestIntegrityAndSignature` :274-297），内置官方公钥 `OFFICIAL_PUBLIC_KEYS`（[constants.ts:129-136](../../packages/cli/src/lib/constants.ts#L129-L136)，keyId `official-v1`）。默认模式下无签名向后兼容跳过验签、有签名时强校验；**严格模式（`--require-signature`）下无签名/未知 keyId 一律抛 `REGISTRY_SIGNATURE_INVALID`**（[signature.ts:305-306](../../packages/cli/src/lib/signature.ts#L305-L306)）——发布产物的 keyId 必须等于 CLI 内置 `official-v1`。
- **docs 零耦合（含中英文）**：apps/docs 不读任何 registry 产物（组件文档为手写 md，侧边栏来自 shared 的 `COMPONENT_METADATA`）；deploy-docs.yml 与 docs 构建不受影响。需同步的文字说明：中文 [cli.md:725-726](../../apps/docs/guide/cli.md#L725-L726) 与 **英文 [en/guide/cli.md:759-760](../../apps/docs/en/guide/cli.md#L759-L760)**（默认双源 URL）。
- **测试基本零耦合，但有两处断言依赖默认源**：CLI 集成测试用"CI 刚构建的工作区产物"（[ci.yml:240](../../.github/workflows/ci.yml#L240)），不依赖 git 入库状态；多数单测用假 host 自适应常量。**需改的两处**：`registry-command.test.ts:86` 断言默认源含 `raw.githubusercontent.com`（切换后必失败）；`registry.test.ts:280-294` 的 `@version` URL 构造依赖默认源匹配 raw 模式（与 T2 降级语义强相关）。
- **ui 包不依赖 registry 产物**：依赖方向相反（registry 产物是 ui 源码的派生物）；ui 构建链（prebuild:scan → prebuild:component-index → exports → vite build）只读自己的源码与 `packages/ui/registry-manifest.json`（该文件**不**在本方案移除范围）。
- **turbo 任务链无需结构改动**：`brutx-registry-vue#build` cache:false（[turbo.json:27](../../turbo.json#L27)）、`validate`/`test` dependsOn build（[:72](../../turbo.json#L72)/[:50](../../turbo.json#L50)）的现状保持；`build` 任务的 `outputs` 中 `registry/**`（[turbo.json:13](../../turbo.json#L13)）与 `test`/`validate` 的 `inputs` 中 `registry/**`（[:57](../../turbo.json#L57)/[:75](../../turbo.json#L75)）声明需按 T11 收紧（保留 inputs 的产物项 + 补齐缺失输入源，而非简单删除）。
- **集成测试本地路径**：[helpers.ts:27](../../packages/cli/tests/integration/helpers.ts#L27) 的 `localRegistry` 指向仓库内目录——CI 中先 build 再测试（照常通过）；本地直接跑集成测试需先构建，属可接受的开发期变化。

---

## 3. 核心设计决策：分发端点（GitHub Release 资产）

产物移出 git 后，需要新的分发通道供 CLI 拉取。**选定 GitHub Release 资产**：publish 时 `gh release upload --clobber` 上传 `registry/` 产物，CLI 默认源指向 `releases/latest/download`。决策依据：

1. 改动面最小——CLI 侧只换默认源常量，publish.yml 在现有 `gh release create`（[publish.yml:123-130](../../.github/workflows/publish.yml#L123-L130)）旁追加上传步骤（权限已具备）；
2. 无版本治理负担——`releases/latest/download/` 固定 URL 天然指向最新产物，与"发布时构建"节奏一致；
3. 签名 manifest 随资产一起上传，CLI 验签开箱即用。

**Release 资产的两个硬约束**（影响 T1/T2 落地形态）：

- **扁平命名，无目录层级**：上传后资产名是 basename（`button.json`、`index.json`…），可寻址 URL 只能是 `releases/latest/download/{name}.json`，**不存在子路径**。CLI 按 `${source}/{name}.json` 拼接（[registry.ts:401](../../packages/cli/src/lib/registry.ts#L401)），默认源直接指向 `releases/latest/download` 即天然适配。
- **不可被 jsDelivr 镜像**：该端点丢失 CDN 冗余（原双源退化为单源），多源 fallback 引擎（[registry-source.ts:115-200](../../packages/cli/src/lib/registry-source.ts#L115-L200)）退化为单源尝试，可靠性由 GitHub 可用性兜底。

**附带约束（预发布 tag）**：`releases/latest` 指向最新**非 draft/非 prerelease** 的 release。现有 `gh release create`（[publish.yml:128-130](../../.github/workflows/publish.yml#L128-L130)）无 `--prerelease`/`--draft` 防护——预发布 tag（如 `v1.2.3-rc.1`）也会抢占 latest。若发布实践会打预发布 tag，需在 T1 的 create 步骤按 tag 形态加条件防护；否则保持现状并在 §7 风险表登记。

---

## 4. 目标态架构

```
源码 push → CI（quality/test）→ registry 构建仅作为 validate 输入（registry 侧 drift 门禁已删，ui 侧保留）
                                    │
tag v* → publish.yml：turbo 门禁（含 registry 构建，私钥注入 → 自动签名）
         ├─ gh release create + gh release upload --clobber registry/ 产物（★ 前置到 npm publish 之前）
         ├─ npm 发布 ui / cli（不变）
         └─ …
                                    │
                                    ▼
              GitHub Release 资产（releases/latest/download/{name}.json，扁平命名）
                                    │
              CLI 默认源（constants.ts 指向 releases/latest/download）→ 拉取 + integrity 校验 + Ed25519 验签
```

> ★ 发布顺序约束：`gh release create + upload` 必须**先于** npm publish（brutx-ui-vue / brutx-vue）执行。原因：T2 合入后 CLI 包的默认源已指向 `releases/latest/download`，若 CLI 包先发布而 Release 资产尚未就绪，用户在新 CLI 上零配置拉取即 404，且 upload 失败会留下"npm 已发布、源不可用"的不可回滚状态。详见 T1。

---

## 5. 任务拆解

### 5.1 P0：分发端点上线与 CLI 默认源切换

- [ ] **T1 发布流程新增产物上传**（[.github/workflows/publish.yml](../../.github/workflows/publish.yml)）
  - **将 `gh release create`（:123-130）与新增的 upload 步骤整体前移至 npm publish（:85-121）之前**，并将 create 改为**幂等写法**（`gh release create "$TAG" … || gh release edit "$TAG"`）——tag 重推/重跑时 release 已存在，直接 create 会失败并阻断后续发布（`--clobber` 也失去生效机会；现状 create 在末尾、失败仅影响 release 创建，前置后语义变化须明示）。`concurrency: publish-global, cancel-in-progress: false` 保证串行。新增 `gh release upload <tag> packages/registry/registry/*.json --clobber`：
    - **扁平命名**：上传后资产名即 basename，可寻址 URL 为 `releases/latest/download/{name}.json`，**无子路径**；CLI 默认源直接指向该目录即可；
    - **upload 步骤需显式声明 `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`**（Actions runner 不自动注入 token 环境变量，须显式传递；job 级 env 只有私钥/TURBO）；
    - **`--clobber` 需 gh ≥ 2.3.0**（具体引入版本未独立官方查证，落地时 `gh version` 确认）：ubuntu-latest 预装版必然满足；fresh tag 时 `--clobber` 为 no-op，仅 tag 重推/重跑时有意义；
    - **90 个文件单命令上传可行**（每个文件一次 REST 请求，小文件秒级），**不打包**——CLI 按 `{source}/{name}.json` 逐文件拉取，打成 tar 会让单文件拉取全部失效（除非 T2 同步改 CLI 为整包下载解压，本方案不采纳）；
  - 上传前校验：产物齐全（`index.json` / `registry-manifest.json` / `registry-sbom.json` 存在）、上传文件数 = 90（`registry/*.json` glob 会匹配本地可能遗留的 `deps.json`，CI 干净环境不会产生，用数量断言兜底）、manifest 含 `signature` 且 **`keyId` = CLI 内置 `official-v1`**（首次发布时私钥 secret 的 keyId 从未端到端验证，若不符用户严格模式验签将失败）；
  - 确认私钥注入步骤（:22-23）在构建步骤（:53-54）之前生效——现状已是如此，保持。
- [ ] **T2 CLI 默认源切换**（[packages/cli/src/lib/constants.ts:106-109](../../packages/cli/src/lib/constants.ts#L106-L109)）
  - 改为 `https://github.com/lidaixingchen/brutxui-vue3/releases/latest/download`（**直接指向，无子路径**，配合 T1 扁平上传）；
  - jsDelivr 冗余源不可保留（Release 资产不可镜像），默认源退化为单元素数组；`--registry` 本地/自定义源能力不变；
  - **`@version` 版本化语法降级**：`resolveVersionedSource`（[registry.ts:659-670](../../packages/cli/src/lib/registry.ts#L659-L670)）仅匹配 `GITHUB_RAW_URL_PATTERN`（:24），Release 源下显式 `button@v1` 当前会抛 `REGISTRY_VERSION_UNSUPPORTED`（:661-667，raw 重写分支在 :668-669 保留）。降级语义：对默认源上的 `@version` **忽略版本、按 latest 拉取**（raw 源仍保留版本化能力），同步更新 `error-advice.ts:30-33` 文案与相关测试；`DEFAULT_REGISTRY_URL` 的内嵌使用点（add.ts:191/:375、registry.ts:221/:635）为常量引用，随常量自适应，无需逐点修改；
  - **同步更新 CLI 测试**：
    - [registry-command.test.ts:86](../../packages/cli/tests/registry-command.test.ts#L86)：断言默认源含 `raw.githubusercontent.com` → 改为断言 `releases/latest/download`；
    - [registry.test.ts:280-294](../../packages/cli/tests/registry.test.ts#L280-L294)：`@version` URL 构造依赖默认 raw 源 → 按降级语义调整；
    - 其余用 `[...DEFAULT_REGISTRY_SOURCES]` 展开的测试（info/list/registry-source）随常量自适应，无需改；集成测试只用 `localRegistry`，无需改。
- [ ] **T3 同步文档**
  - 中文 [apps/docs/guide/cli.md:725-726](../../apps/docs/guide/cli.md#L725-L726)（默认双源 URL 文字）与 **英文 [apps/docs/en/guide/cli.md:759-760](../../apps/docs/en/guide/cli.md#L759-L760)**（同源硬编码，须同步）；
  - [docs/RELEASE.md](../guides/RELEASE.md)：§"版本发布"门禁说明（:3-9）、§"重新编译注册表"（:8）、§"Registry manifest 自动签名"（:201-209，描述 T4/T5 将删除的 sign-manifest job 与 main 同步机制）、:16 产物语义微调；
  - **docs/COMPONENT_GUIDE.md:22**：描述 build-registry.ts 自动生成 `registry/*.json` 与 `index.json` 的说明文字（审查补漏）；
  - **README.md:92,95 与 docs/README-en.md:90,93**：shadcn CLI 安装方式引用的 GitHub Pages 产物 URL——实测当前已 404（deploy-docs.yml 亦无 registry 引用，属既有死链），产物移出后永无恢复，顺带核查处置（删除或加注失效说明）。

### 5.2 P0：拆除"产物入库"机制

- [ ] **T4 删除签名回填 workflow**：`.github/workflows/registry-sign.yml`（整体删除；独立 workflow，无 `workflow_call`/reusable 引用，安全；其"签名必须持久存在于 git"的注释前提已失效，前提是 T1/T2/T5 先落地）
- [ ] **T5 改造 ci.yml**：
  - 删除 **sign-manifest job**（:245-308，含 verify 与 `git add` 步骤）；
  - **drift 门禁（:75-85）按路径细分**：移除 `packages/registry/registry` 路径的 diff 检查，**保留 `packages/ui/registry-manifest.json` 与 `packages/ui/src/styles.css` 的检查**——这两个 ui 生成文件仍入库跟踪、仍由 prebuild 生成，若一并放开，后续 tag 发布会被（保留的 ui 侧门禁）卡住且失去漂移预警。注意现状门禁本就 `exclude` registry 内的 manifest/sbom（CI 构建必注入 gitCommit/签名，属有意设计），整个目录移除后 exclude 规则随之删除，无需单独处理。
- [ ] **T6 改造 publish.yml 的生成物一致性门禁（:66-83）**：同 T5 按路径细分——仅移除 `packages/registry/registry`，保留 ui 侧两个文件的 `git diff --exit-code`；上传前的完整性检查见 T1。
- [ ] **T7 改造 pre-commit 钩子**（[.husky/pre-commit:7-15](../../.husky/pre-commit#L7-L15)）：删除 registry 产物的重建与 `git add` 逻辑；**保留 ui 侧联动**——`ui/src` 变更时仍重建并仅 `git add packages/ui/registry-manifest.json packages/ui/src/styles.css`（不 add registry 产物）。钩子无其他 lint/test 逻辑，改造不破坏其他钩子。

### 5.3 P0：产物移出 git

- [ ] **T8 `.gitignore` 追加**：
  ```
  packages/registry/registry/
  packages/registry/.registry-cache.json
  ```
  （与现有 `packages/registry/bench.json`、`registry/deps.dot`、`deps.json` 条目格式一致，无冲突；`registry/` 整目录忽略后 :62-63 条目冗余但无害）
- [ ] **T9 删除跟踪**：`git rm -r --cached packages/registry/registry packages/registry/.registry-cache.json`（逐一删除，不批量 `git rm` 其他内容）
- [ ] **T10 清理 `.gitattributes`**：**仅移除 :25**（`packages/registry/registry/**/*.json` linguist 标记）；**保留 :26**（`packages/ui/registry-manifest.json` 的 linguist 标记，该文件仍入库）
- [ ] **T11 turbo.json 语义收紧**（[turbo.json](../../turbo.json)）：
  - `build` 任务 `outputs` 移除 `registry/**`（:13）：该包 cache:false（:27），outputs 本就不落缓存，语义上无害；
  - **`test`/`validate` 的 `inputs` 保留 `registry/**`（:57、:75）**——产物是它们的真实输入，删除会在"产物变但源码哈希不变"时缓存误命中。产物 gitignore 后属未跟踪文件：turbo 对**显式列入 inputs 的 gitignored 文件**会参与哈希（git-based 与 fallback hashing 均支持），但"上游生成新 gitignored 产物 → 下游引用"场景存在已知 bug 历史（vercel/turborepo#7821 等）——**落地时必须实测**：改动一个组件后确认 validate/test 缓存键变化；实测不符则回退为直接给 `validate`/`test` 设 `cache:false`；
  - **补齐缺失的输入源**：build-registry.ts 实际直读 `ui/registry-manifest.json`（[build-registry.ts:42](../../packages/registry/scripts/build-registry.ts#L42)）、`ui/src/locales/**`（:35）、`ui/src/lib/**`（:36）。核验结论：`brutx-registry-vue#build` 的 `../../packages/ui/src/**`（[turbo.json:29](../../turbo.json#L29)）**已覆盖** locales/lib，无需补；**真正完全缺失的是 `ui/registry-manifest.json`**（位于 ui 包根，不在任何任务 inputs 内）与 **validate 的 locales/lib**（[turbo.json:76-78](../../turbo.json#L76-L78) 只列 components/composables/directives）——`validate` 的 inputs 应补齐 `../../packages/ui/registry-manifest.json`、`../../packages/ui/src/locales/**`、`../../packages/ui/src/lib/**`；
  - **Turbo Remote Cache 放大说明**：publish.yml/ci.yml 已启用 Remote Cache（[publish.yml:16-19](../../.github/workflows/publish.yml#L16-L19)）。缓存键缺失输入源会在跨 commit/跨分支间复用陈旧 validate/test 结果，故上述补齐是正确性的要求，不是可选优化。

### 5.4 P1：本地工具链适配

- [ ] **T12 validate-registry.ts 本地直接运行**（不走 turbo 时）：`REGISTRY_DIR` 不存在即 exit（[validate-registry.ts:322-325](../../packages/registry/scripts/validate-registry.ts#L322-L325)）——保持该行为（提示先 build）；**补充说明**：模块顶层 `loadMergedRegistry()`（[build-registry.ts:69](../../packages/registry/scripts/build-registry.ts#L69)）在 validate 导入时即读 `packages/ui/registry-manifest.json` 并可 throw，**早于 REGISTRY_DIR 检查**——提示优化需同时覆盖"ui manifest 缺失"的 import 期路径，而非仅 REGISTRY_DIR 文案
- [ ] **T13 verify-build.ts**：产物不入库后其"备份/恢复 `.registry-cache.json`"逻辑不受影响，写回磁盘的产物由 T8 gitignore 覆盖，无需改动；**修正过时注释 :11 与 :39 两处**（"serialNumber 每次 build 随机生成" → 实际为内容哈希派生的确定性值，注释见 [build-registry.ts:806](../../packages/registry/scripts/build-registry.ts#L806)），并评估 :45 因 serialNumber 确定性而失效的排除字段配置；补充注释说明其运行前提
- [ ] **T14 开发文档**：
  - [CONTRIBUTING.md:132-148](../../CONTRIBUTING.md#L132-L148)：更新"提交 `packages/registry/registry/` 下生成的 JSON 文件"（:148）流程描述为"产物发布时生成，本地开发用 `pnpm --filter brutx-registry-vue build` 生成后可直接 `--registry` 本地使用"；
  - [AGENTS.md:7-11](../../AGENTS.md#L7-L11)：自动生成文件表（表体 :7-11）仅移除 :11 的 registry 产物行（:9-10 的 ui manifest/styles.css 与 :50-52 的命令说明**不在**改动范围）。

### 5.5 P2：后续演进（可选）

- [ ] **T15** 若接入 npm 生态需求：registry 包转 public + jsDelivr npm 镜像，CLI 新增 npm URL 解析；
- [ ] **T16** Release 资产分发遇到规模/带宽瓶颈时的演进方向：**不做"打包上传"**（与 CLI 按需拉取模型冲突，见 T1）；优先评估 npm 分发 + jsDelivr 镜像 CDN，或在 CLI 侧引入整包下载 + 本地缓存层后仍保留逐文件读取能力。

---

## 6. 签名链路新模型

| 环节 | 现状 | 目标态 |
|---|---|---|
| 签名生成 | registry-sign.yml / ci.yml sign-manifest job：CI 用私钥重建 → [skip ci] 提交回 main | publish.yml 构建步骤内自动完成（`signManifestFromEnv`，私钥已注入 :22-23） |
| 签名分发 | git main 分支文件 | GitHub Release 资产（随 manifest 一起上传） |
| CLI 验签 | 拉取 main 的 manifest，无签名时跳过 | 拉取 Release 资产 manifest，有签名时强校验（`verifyManifestIntegrityAndSignature`），`--require-signature` 严格模式开箱可用 |
| 幂等性 | ci.yml 特意 `unset GITHUB_SHA`/`COMMIT_SHA` 保证 gitCommit=null 幂等 | 发布场景下 gitCommit=GITHUB_SHA（tag 提交）可接受；签名对 `integrity` 签发、`integrity` 排除 gitCommit/buildTimestamp（[build-registry.ts:246-257](../../packages/registry/scripts/build-registry.ts#L246-L257)），**签名跨发布稳定**，无需 unset |

---

## 7. 风险与权衡

| 风险 | 影响 | 缓解 |
|---|---|---|
| CLI 默认源切换后，`@version` 版本化语法对 Release URL 失效 | 用户显式 `--registry` 带版本拉旧产物不可用 | T2 明确降级语义（忽略版本按 latest）并文档化；版本化能力保留给 raw 源；更新 error-advice 文案与测试 |
| **预发布 tag 抢占 `releases/latest`** | latest 固定 URL 指向预发布产物，latest 语义被破坏 | 若发布实践打预发布 tag（-rc/-beta），T1 的 create 步骤按 tag 形态加 `--prerelease` 防护（现状 create 无防护，见 §3） |
| Release 资产带宽/可用性不如 CDN，且不可被 jsDelivr 镜像 | 大规模使用下载慢 / 单源不可用即断供 | 监控用量；长期演进 npm 分发（jsDelivr 镜像） |
| **发布顺序缺陷：CLI 包先 publish、Release 资产后上传** | npm 已发布但默认源 404，不可回滚 | **T1 将 `gh release create + upload` 前置到 npm publish 之前**；upload 失败即 fail workflow 阻断后续 |
| **旧版 CLI 用户断供**：产物移出 main 后，npm 上已发布旧版 CLI 的默认源（raw URL）立即 404 | 存量用户 `add` 命令全部失效，只能升级 CLI | 发布说明明确声明升级要求；无服务端缓解手段（旧产物不在 main）——发布时构建方案的固有破坏性，明示而非规避 |
| **ui 侧生成文件防漂移保护连带消失** | ui/registry-manifest.json 与 styles.css 失去漂移预警，后续 tag 发布被门禁卡住 | T5/T6/T7 按路径细分：仅移除 registry 产物，保留 ui 侧检查（或有意放开并在文档明示） |
| 产物移出后本地 `validate`（未先 build）报 "Registry directory does not exist" | 开发者困惑 | T12 保留错误信息并补充"运行 pnpm build 后"的提示文案；并覆盖 ui manifest 缺失的 import 期路径 |
| 删除 registry 侧 drift 门禁后，发布产物与源码脱节（构建时被篡改/漏步） | 发布产物不完整 | T1 上传前完整性检查（文件齐全 + 签名存在）+ 发布门禁保留 `turbo run build test typecheck lint` |
| **turbo 缓存键输入源缺口**（缺失 ui manifest/locales/lib）在 Remote Cache 下跨 commit 复用陈旧 validate 结果 | validate/test 结果过期 | T11 保留 `registry/**` 在 inputs 并补齐缺失输入源，或对 validate/test 设 cache:false |
| `.registry-cache.json` 移出 git 后 CI 无跨构建增量缓存 | 每次发布全量构建 86 组件 | 可接受（全量构建秒级到数十秒级）；如超时再评估 CI 侧持久缓存 |
| registryVersion 不 bump 时，用户 TTL 内缓存不感知新内容 | 升级用户短暂拉旧产物 | 现状 raw 模式同样存在，非本期引入；integrity 兜底防篡改 |
| 历史 commit 中仍含旧产物 | 仓库体积不变 | 明确非目标，不重写历史 |

---

## 8. 迁移步骤（上线顺序）

1. **P0 并行**：T1（发布流程：release create + upload **前置** npm publish）+ T2（CLI 源切换）+ T3（文档）——先让新分发通道可用；
2. **P0**：T4-T7（拆除入库机制，registry 侧删除、ui 侧保留防漂移）——与 T1/T2 同一发布周期内合入；
3. **P0**：T8-T11（产物移出 git）——在拆除机制后的独立提交中执行 `git rm --cached`；
4. **P1**：T12-T14（本地工具链与开发文档）；
5. 发布验证：打 `v*` tag → 确认 Release 资产（`releases/latest/download/registry-manifest.json` 可达、含签名且 **`keyId`=official-v1**）→ `brutx-vue add` 冒烟（新默认源 + 验签，覆盖默认与 `--require-signature` 两种模式）→ 本地 pull 确认无产物冲突 → **验证 ui/registry-manifest.json 与 styles.css 的 ui 侧门禁仍生效**。

**回滚**：若分发端点出现不可用问题，CLI 默认源可临时切回 raw URL——但产物已移出 main，需先恢复 T8/T9 的跟踪（`git checkout <历史提交>` 恢复产物 + 还原 .gitignore）。建议 P0 阶段保持"产物移出"与"分发端点上线"在同一发布周期内完成，降低回滚窗口。

---

## 9. 附录：关键文件索引

| 文件 | 位置 | 改动 |
|---|---|---|
| `.github/workflows/publish.yml` | :66-83（门禁按路径细分）、:85-121（npm publish，前置）、:123-130（create，前置）、新增 upload | 修改 |
| `.github/workflows/ci.yml` | :75-85（门禁按路径细分）、:245-308（sign-manifest job 删除） | 修改 |
| `.github/workflows/registry-sign.yml` | 整体 | 删除 |
| `.husky/pre-commit` | :7-15（registry 重建移除、ui 侧保留） | 修改 |
| `packages/cli/src/lib/constants.ts` | :106-109（默认源） | 修改 |
| `packages/cli/src/lib/registry.ts` | :24（URL 结构解析）、:659-670（@version 降级） | 修改 |
| `packages/cli/src/lib/error-advice.ts` | :30-33（@version 文案） | 修改 |
| `packages/cli/tests/registry-command.test.ts` | :86（默认源断言） | 修改 |
| `packages/cli/tests/registry.test.ts` | :280-294（@version mock URL） | 修改 |
| `.gitignore` | 追加两条 | 修改 |
| `.gitattributes` | **仅 :25**（:26 保留） | 修改 |
| `turbo.json` | :13（build outputs）、:57、:75（validate/test inputs 保留 + 补齐缺失输入源） | 修改 |
| `packages/registry/registry/`、`.registry-cache.json` | 90+1 文件 | `git rm --cached` |
| `packages/registry/scripts/verify-build.ts` | :11（过时注释） | 修改 |
| `apps/docs/guide/cli.md` | :725-726 | 修改 |
| `apps/docs/en/guide/cli.md` | :759-760（与中文同源） | 修改 |
| `docs/RELEASE.md` | :3-9、:16、:201-209 | 修改 |
| `CONTRIBUTING.md` | :132-148 | 修改 |
| `AGENTS.md` | :7-11（仅移除 :11 的 registry 产物行） | 修改 |
