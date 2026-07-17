# brutx-vue

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
