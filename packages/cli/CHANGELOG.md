# brutx-vue

## 0.11.0

### Minor Changes

- UI 包与 CLI 包 v0.11.0 中版本发布：

  - **VFS 虚拟文件系统与深模块重构**：引入抽象文件系统与内存/物理适配器，CLI 与脚本全量消除裸 I/O 穿透；引入 ScaffoldEngine 原子事务与 AST 精准切片注入；封装 AuditLogStorage 深模块。
  - **设计令牌单一信源与多端生成**：下沉设计令牌至 `design-tokens.ts` 单一信源，自动生成 CSS 变量与多端样式；支持 Subtle 浅色衍生令牌与机械弹性动效；阴影与按压反馈改用盖影语义。
  - **全库组件无障碍 (a11y) 与交互加固**：全面强化焦点管理与键盘可访问性，修复 Form、DatePicker、Kanban、NumberInput、DashboardShell、Dialog、Message 等组件的状态残留、SSR 水合与事件边界。
  - **质量门禁与零 I/O 测试**：构建与扫描脚本收敛至单一事实源，建立全工程零 I/O 测试套件与双向一致性核对门禁。

## 0.10.1

### Patch Changes

- 修复审查发现的缺陷：主题组合式函数与编辑器内部状态收敛、carousel 交互调整、回退样式与令牌脚本加固，以及 CLI 令牌校验脚本修复

## 0.10.0

### Minor Changes

- 发布 UI 与 CLI 的 0.10.0 中版本更新。

  - **brutx-ui-vue**：补齐 composables 聚合入口的类型导出；DataTable 列过滤改为增量 patch 合并，避免并发更新互相覆盖；composables 内部状态全库只读化重构（对外行为经 setter 收敛）；按代码审查逐轮修复 useDialogEnhanced、useThrottle、useTheme、useUpload、useToast、useDataTable\*、useKanban、useCarousel\*、useClipboard、useColorHistory、useAudioEngine、useCanvasInteraction、useReducedMotion、useAnimation、useMessage、useMessageBox 等交互与生命周期缺陷。

  - **brutx-vue**：registry 完整性哈希算法升级为覆盖 path/type/content 的顺序无关哈希并自校验，可发现字段互换篡改（旧哈希不再匹配，registry 产物已重建）；registry 产物改为发布时构建，入库机制拆除；按代码审查修复 manifest 签名验证与缓存安全加固、CSS 注入 markers 统一判据、组件移除依赖图校验、diff 类型改官方类型等稳定性问题。

## 0.9.4

### Patch Changes

- 06e3c6c: fix(ui): 焦点环改用主题令牌并补充透明 outline 降级；统一 createDarkModeToggle 与 createThemeVariables 的暗色模式状态（引用计数共享 store + 跨标签页同步）；tree 节点选中边框改由变体显式控制，消除级联顺序依赖

## 0.9.3

### Patch Changes

- 修复 AI 代码审查（.ocr-reports/ui-core.md）发现的 43 个问题，并沉淀 CLI 稳定性修复：

  - **brutx-ui-vue**：类型声明改用官方 embla 类型并移除 .vue 通配 shim（由 vue-tsc 接管）；v-loading 定位还原去除死代码并补 Spinner 兜底；清理 API 收敛为 `destroyBrutxUI` 统一入口；Transfer/Tour 公共类型抽取到独立 types 模块；语言包类型收窄（months 只读、占位符标注）与 mergeLocale 深合并语义；测试基础设施健壮性（定时器恢复、ResizeObserver mock、axe 检测）；工具类型支持函数式组件与内置类型守卫；主题对比度达标 WCAG AA 与 createCustomTheme 运行时校验；版权年份动态化与非文案默认值移出语言包
  - **brutx-vue**：本地 registry 组件列表过滤元数据文件、命令白名单与错误码单一数据源、cn 模板自包含、缓存原子写入与损坏防御、审计与 update 命令错误隔离等修复

## 0.9.2

### Patch Changes

- 修复全局与子命令同名 --dry-run option 导致命令级 dry-run 失效的问题；vscode-snippets 解析失败时保留异常 cause 链便于诊断

## 0.9.1

### Patch Changes

- fix(ui): 补齐组件依赖元数据，修复 variants 样式、组件逻辑与 composables 边界问题（含代码审查回归与测试补充）

## 0.9.0

### Minor Changes

- 7e5efd6: CLI 基础设施全链路闭环（INFRASTRUCTURE_CLOSURE_PLAN）：

  - **Ed25519 签名信任链闭环**：内置官方 Root 公钥（`OFFICIAL_PUBLIC_KEYS`），零配置即可验签官方 Registry；`components.json` 支持 `requireSignature` / `trustedPublicKeys` 项目级配置；`--require-signature` flag 现真正激活严格模式。
  - **manifest 内容完整性校验**：验签前先复算 manifest 自身 integrity 并与 `integrity` 字段比对（与 build 侧共用 `computeRegistryManifestIntegrity` 单一实现源），封堵"篡改内容但保留原签名"的空子；签名/完整性失败不再折叠成泛化 `REGISTRY_FETCH_FAILED`。
  - **默认多源 + 离线韧性**：默认 Registry 源改为 GitHub Raw + jsDelivr CDN 双源（`DEFAULT_REGISTRY_SOURCES`），零配置即可 CDN fallback；离线模式依次尝试各源缓存并输出 `[OFFLINE CACHE HIT]` 提示。
  - **源管理子命令**：新增 `brutx registry list / add / remove` 命令式管理 `components.json` 的 `registries`。
  - **缓存可观测性**：`brutx doctor` 报告缓存条目数、占用体积与离线可用状态。
  - **构建侧自动签发**：`build-registry.ts` 检测 `BRUTX_REGISTRY_PRIVATE_KEY` / `BRUTX_REGISTRY_KEY_ID` 时对 registry-manifest 自动签名（CI 注入），Fork/本地保持未签名向后兼容。

## 0.8.1

### Patch Changes

- 修复 changelog 归档机制多项 bug，修复 CI typecheck 失败问题，更新依赖以解决安全漏洞，重构 CI/CD 流水线与构建缓存配置，完善组件与项目文档。

## 0.8.0

### Minor Changes

- ## brutx-ui-vue (0.9.4 → 0.9.5)

  ### ⚠️ Breaking Changes

  > 注：本次按 patch 发布，但包含 2 项面向用户的公共 API 变更。用户升级时需关注导入路径调整。

  - **ui/exports:** `brutx-ui-vue/calendar` 不再导出 `DatePicker`/`useDatePicker`，`brutx-ui-vue/carousel` 不再导出 `useCarousel`。请改用 `brutx-ui-vue/date-picker`、`brutx-ui-vue/useDatePicker`、`brutx-ui-vue/useCarousel` 子路径。
  - **ui/re-export:** 移除主入口 `index.ts` 中全部 reka-ui 值 re-export（Dialog/DialogTrigger/DialogPortal/DialogClose、AlertDialog 系列、Sheet 系列、Popover/PopoverTrigger/PopoverAnchor、Tooltip/TooltipTrigger、SelectGroup/SelectValue、DropdownMenu 系列、TabsRoot）。`import { Dialog, Popover, Tooltip, ... } from 'brutx-ui-vue'` 的代码需改为直接从 `reka-ui` 导入（reka-ui 仍作为 peerDependencies 保留）。

  ### 🐛 Bug Fixes

  - **ui/toast:** 修复 useToast 与 Toast.vue 双定时器冲突
  - **ui:** 修复 FormWizard/Dialog/TreeView 三处状态与 i18n 问题
  - **ui/dialog:** handleClose 并发守卫与 initSize rAF 取消
  - **ui/cascader:** 预选值未找到时不再错误高亮首页
  - **ui/data-table:** 重置 warnedColumns 并提取魔法数字为默认常量
  - **ui/lib:** date.ts 安全 WW token 解析与 render-imperative timer 跟踪
  - **ui/theme:** useTheme fallback 引用计数清理

  ## brutx-vue (0.7.4 → 0.8.0)

  ### ✨ Features

  - **cli/manifest:** Ed25519 签名校验基础设施 + 公钥轮换 + REGISTRY_SIGNATURE_INVALID
  - **cli/registry:** 多 registry 源与离线韧性（离线模式 + auth + reachability）
  - **cli/cache:** 缓存层升级（条件请求 + 并发去重 + LRU 上限 + registry 版本绑定）
  - **cli/doctor:** 消费 manifest 实现 integrity 漂移与孤儿检测
  - **cli/doctor:** 新增 `--sbom` 与签名默认 warn 严格模式
  - **cli/update:** 版本约束体系（version-pinned 默认锁定 + `--across-versions` 解锁）
  - **cli/deps:** 组件版本治理体系化（resolveDeps 去重 + 去硬编码 URL + manifest 版本契约）
  - **cli/audit:** CLI 操作审计日志与全局 dry-run（`BRUTX_DRY_RUN=1` 或 `--dry-run`）

  ### 🐛 Bug Fixes

  - **cli:** 修复打包后 doctor 命令找不到 package.json 的问题
  - **cli:** fetchWithSources 离线全失败时保留首个 CliError 作为 cause
