# 领域词汇表 (Domain Glossary) — BrutxUI Vue 3

本文件记录 BrutxUI Vue 3 核心架构与底层基础设施的通用领域术语（Ubiquitous Language）。

---

## 核心架构与基础设施 (Infrastructure & Architecture)

### 命令式宿主控制器 (Imperative Host Controller)
- **定义**：负责在 Vue 主应用根节点之外动态创建、挂载、调度和安全销毁 UI 弹层的全生命周期深模块（Deep Module）。
- **职责**：
  - 统一管理宿主 DOM 容器（`<div>`）的生命周期与自动垃圾回收（GC）。
  - 自动捕获与继承 Vue `appContext`（支持局部组件树上下文与全局 App 上下文回退）。
  - 驱动基于定时器与 `<Transition>` 钩子的优雅离场动画与内存清理。
  - 屏蔽 SSR 环境差异与能力缺失。

### 弹层栈管理器 (Active Overlay Stack Manager)
- **定义**：位于命令式宿主控制器内部的后进先出（LIFO）活动弹层调度器。
- **职责**：
  - 维护当前页面活跃弹层实例列表。
  - 基于设计令牌（Design Tokens）基础层级自动分配递增的 `z-index`。
  - 将全局键盘事件（如 `ESC` 键关闭）与遮罩点击事件精确路由分发给栈顶（Topmost）弹层。
  - 在弹层销毁时自动退栈并协调焦点归还。

### 弹层实例句柄 (Overlay Instance Handle)
- **定义**：调用命令式挂载接口时同步返回的控制实体。
- **结构**：
  - `close()`：触发弹层优雅关闭动画。
  - `destroy()`：立即强制销毁 DOM 节点与清理定时器（幂等）。
  - `promise`：承载用户最终交互决策结果的 Promise 对象（非拒绝状态机，通过 `{ action: 'confirm' | 'cancel' | 'destroy', value?: any }` 表达终态）。

---

## 领域实体与组件 (Domain Entities & Components)

### 对话框 (Dialog)
- **定义**：用于承载复杂自定义内容、支持自由拖拽（Draggable）与缩放（Resizable）的高级交互浮层。
- **归属**：`packages/ui/src/components/dialog/`，属于 `overlay` 类别。

### 消息弹框 (MessageBox)
- **定义**：用于执行确定性操作确认、系统重要告警提示（Alert）或轻量文本输入（Prompt）的标准结构化反馈浮层。
- **特性**：具备明确的语义状态（info / success / warning / error）、内建输入校验器（`inputPattern`）以及标准确认/取消动作。
- **归属**：`packages/ui/src/components/message-box/`，属于 `feedback` 类别，与 Dialog 完全正交解耦。

---

## CLI 基础设施与路径解析引擎 (CLI Infrastructure & Path Engine)

### 项目上下文实体 (Project Context)
- **定义**：代表一次 CLI 运行会话所处目标项目的核心聚合实体与深模块（Deep Module）。
- **职责**：
  - 统一加载并强类型化管理项目配置（`components.json`）、tsconfig 别名树、Nuxt/Vite 项目类型与包管理器。
  - 对外暴露高阶领域路径解析（`resolveTargetPath`、`resolveUtilsFilePath`、`resolveStyleFilePath`）与源码转换能力（`resolveImportAlias`）。
  - 内置路径越界守卫（`assertSafePath`）与写后防御（`verifyWrittenPath`），彻底杜绝目录遍历与符号链接攻击。
  - 提供事务工厂（`createTransaction`），自动绑定当前工作目录与文件系统适配器。

### 跨包统一虚拟文件系统 Seam (Universal File System Adapter Seam)
- **定义**：解耦整个 Monorepo（CLI、Registry 编译器、UI 构建/脚手架脚本）与底层物理 IO 的跨包统一虚拟文件系统抽象层。
- **归属**：`packages/shared/src/fs/`（通过 `brutx-shared-vue/fs` 或共享包导出）。
- **职责**：
  - 定义与 POSIX/fs 异步核心子集 1:1 对齐的操作契约（`readFile`、`writeFile`、`readJson`、`writeJson`、`pathExists`、`ensureDir`、`remove`、`copy`、`rename`、`stat`、`readdir`、`realpath`、`mkdtemp`）。
  - `DiskFileSystemAdapter`：基于 Node 22+ 原生 `node:fs/promises` 零第三方依赖实现，服务于生产磁盘执行环境。
  - `MemoryFileSystemAdapter`：纯内存 Map 目录树虚拟实现，具备符号链接 `lstat/rm` 语义、`Uint8Array` 缓冲区深拷贝隔离与原子子树迁移，服务于全链路零 IO 单元测试与演练沙箱。

### 缓存与审计日志持久化深模块 (Cache & Audit Storage Deep Modules)
- **定义**：负责 CLI 注册表网络元数据缓存与操作合规审计事件落盘的独立持久化深模块。
- **职责**：
  - `CacheStorage`（`packages/cli/src/lib/storage/cache-storage.ts`）：基于文件哈希分片存储，具备 `rename` 同卷原子写入、损坏 JSON 自愈清除、LRU/TTL 自动驱逐与 `.tmp` 残留清理机制。
  - `AuditLogStorage`（`packages/cli/src/lib/storage/audit-storage.ts`）：负责 CLI 关键变更行为（安装、更新、移除、自愈）的确定性结构化审计事件持久化，支持按时间范围/类型多维度检索与 JSON 导出。

### 设计令牌纯计算编译器 (Token Style Compiler)
- **定义**：将单一信源 `packages/shared/src/design-tokens.ts` 纯函数式静态计算编译为 Tailwind CSS v4 `@theme` 声明块、`:root/.dark` 预设样式与 CLI 注入块的无 IO 编译引擎。
- **归属**：`packages/ui/scripts/compiler/token-style-compiler.ts`。
- **职责**：
  - 承载所有的 CSS 格式化与令牌拼装逻辑，提供纯数据输入与字符串输出接口，彻底将磁盘读写与令牌转换算法解耦。

### 脚手架生成事务引擎 (Scaffold Transaction Engine)
- **定义**：驱动 `pnpm generate:component` / `pnpm generate:composable` / `pnpm generate:page` 安全生成模板与索引注入的事务引擎。
- **归属**：`packages/ui/scripts/scaffold/scaffold-engine.ts`。
- **职责**：
  - 严格依托 `FileSystemAdapter` 执行计划、探测与写入；
  - 覆盖写入（`overwrite: true`）前自动暂存被覆盖文件原始内容快照；
  - 遇到异常时执行无损自动回滚（删除新建文件、精准还原被覆盖文件、恢复 `index.ts` 导出索引）。

