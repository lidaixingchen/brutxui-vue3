# brutx-ui-vue

## 0.10.1

### Patch Changes

- 基于代码审查（open-code-review）逐轮修复多个组件的缺陷与可访问性问题：

  - **可访问性**：alert 关闭按钮阻止冒泡并自动关联 `aria-describedby`、移除冗余 `aria-live`；avatar 状态圆点改 sr-only 播报、默认 alt 语义化；auth-card 防重复提交与错误即时清除；badge 关闭图标显式 `aria-hidden`；breadcrumb 省略号 sr-only 仅在无自定义插槽时渲染、当前页去除 link 语义；before-after 焦点态改 outline 保留偏移投影；input 聚焦反馈改 `focus-within`、只读禁用后缀交互、`aria-invalid` 按变体推导。
  - **样式与类契约**：button 仅 `effect="glitch"` 按钮输出 glitch 类（消除普通按钮 DOM 污染）、关闭按钮透明度过渡改用 `transition-opacity`；accordion、breadcrumb、avatar 变体与结构收敛。
  - **i18n 一致性**：brutalist-hero 空字符串回退默认文案、CLI 终端演示抽为 `terminal` 插槽。
  - **组件契约**：backtop 非法选择器容错、MutationObserver 动态 target 支持销毁重建后重新绑定；before-after 值越界 clamp 归一；avatar `delayMs`/`asChild` 透传；input 新增 `autocomplete` prop 支持密码管理器识别。
  - **测试与文档**：各组件补充边界用例并同步中英文档。

## 0.10.0

### Minor Changes

- 发布 UI 与 CLI 的 0.10.0 中版本更新。

  - **brutx-ui-vue**：补齐 composables 聚合入口的类型导出；DataTable 列过滤改为增量 patch 合并，避免并发更新互相覆盖；composables 内部状态全库只读化重构（对外行为经 setter 收敛）；按代码审查逐轮修复 useDialogEnhanced、useThrottle、useTheme、useUpload、useToast、useDataTable\*、useKanban、useCarousel\*、useClipboard、useColorHistory、useAudioEngine、useCanvasInteraction、useReducedMotion、useAnimation、useMessage、useMessageBox 等交互与生命周期缺陷。

  - **brutx-vue**：registry 完整性哈希算法升级为覆盖 path/type/content 的顺序无关哈希并自校验，可发现字段互换篡改（旧哈希不再匹配，registry 产物已重建）；registry 产物改为发布时构建，入库机制拆除；按代码审查修复 manifest 签名验证与缓存安全加固、CSS 注入 markers 统一判据、组件移除依赖图校验、diff 类型改官方类型等稳定性问题。

## 0.9.12

### Patch Changes

- 06e3c6c: fix(ui): 焦点环改用主题令牌并补充透明 outline 降级；统一 createDarkModeToggle 与 createThemeVariables 的暗色模式状态（引用计数共享 store + 跨标签页同步）；tree 节点选中边框改由变体显式控制，消除级联顺序依赖

## 0.9.11

### Patch Changes

- 修复 AI 代码审查（.ocr-reports/ui-core.md）发现的 43 个问题，并沉淀 CLI 稳定性修复：

  - **brutx-ui-vue**：类型声明改用官方 embla 类型并移除 .vue 通配 shim（由 vue-tsc 接管）；v-loading 定位还原去除死代码并补 Spinner 兜底；清理 API 收敛为 `destroyBrutxUI` 统一入口；Transfer/Tour 公共类型抽取到独立 types 模块；语言包类型收窄（months 只读、占位符标注）与 mergeLocale 深合并语义；测试基础设施健壮性（定时器恢复、ResizeObserver mock、axe 检测）；工具类型支持函数式组件与内置类型守卫；主题对比度达标 WCAG AA 与 createCustomTheme 运行时校验；版权年份动态化与非文案默认值移出语言包
  - **brutx-vue**：本地 registry 组件列表过滤元数据文件、命令白名单与错误码单一数据源、cn 模板自包含、缓存原子写入与损坏防御、审计与 update 命令错误隔离等修复

## 0.9.10

### Patch Changes

- 修复代码审查与回归测试发现的组件缺陷：tree 键盘导航/搜索展开/节点回写、upload 卸载中止上传与拖拽高亮复位、tour steps 缩短时钳制 currentStep、watermark 防篡改重建归位节点、tags-input 删除按钮默认文案接入 i18n 并提供默认 aria-label、transfer 选中项变 disabled 后清除残留选中态、input/hardcore-input/textarea 组合结束兜底 emit 并通过标记去重、select 组件级归一化 options、slider currentValue 对齐归一化值、tabs 选中项移除时同步激活值、menu 子菜单选中项自动收起、infinite-scroll 重新观察哨兵、stepper/form-wizard 动态步骤钳制等

## 0.9.9

### Patch Changes

- 修复自动化审查报告（问题 76-100）与代码审查发现的缺陷：Button glitch 文本与禁用拦截、Card3D 指针坐标、DatePicker 系列 readonly/边界/重复事件/确认按钮、DataTable 过滤与固定列 sticky、ColorPicker 清空同步/受控 open、Menu 激活项子菜单自动展开、Counter 动画时长与朗读播报等

## 0.9.8

### Patch Changes

- fix(ui): 补齐组件依赖元数据，修复 variants 样式、组件逻辑与 composables 边界问题（含代码审查回归与测试补充）

## 0.9.7

### Patch Changes

- 同步版本号以匹配 CLI 基础设施闭环发布（无组件功能变更）。

## 0.9.6

### Patch Changes

- 修复 changelog 归档机制多项 bug，修复 CI typecheck 失败问题，更新依赖以解决安全漏洞，重构 CI/CD 流水线与构建缓存配置，完善组件与项目文档。

## 0.9.5

### Patch Changes

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
