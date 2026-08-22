# CLI组件三方合并与代码升级引擎方案

> 方案类型：功能设计与升级引擎架构
> 状态：**active**
> 日期：2026-08-22
> 关联文档：[CLI项目上下文与路径解析引擎封装方案](CLI项目上下文与路径解析引擎封装方案.md)；[全工程虚拟文件系统统一与持久化深模块重构方案](全工程虚拟文件系统统一与持久化深模块重构方案.md)；[CLI声明式诊断巡检与自愈引擎方案](CLI声明式诊断巡检与自愈引擎方案.md)
> 修订记录：
> - 2026-08-22：初稿定稿。确立基于清单元数据（`.brutx/manifest.json`）与全局缓存/Registry 按需动态重构 Base 祖先机制、动态 Alias 重投影、目录级拓扑感知合并、换行符原始 EOL 原样保持、三合一原子事务提交（组件代码 + 清单 + 审计）、CI 非交互式阻断契约与 Doctor 冲突巡检规则。

---

## 一、 背景与第一性原理

### 1. 现状局限与开发者困境

在基于源码分发模式的现代前端组件库（如 BrutxUI、shadcn/ui）中，组件代码直接以源文件（`.vue`、`.ts`）形式安装到用户的项目中。这种模式赋予了开发者极高的定制自由度，但也带来了一个长期的代码演进痛点：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          当前 CLI 更新面临的“二选一”困境                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                   ┌──────────────────────────────────────┐                  │
│                   │ 用户本地组件定制 (埋点/自定义Slot/属性) │                  │
│                   └──────────────────┬───────────────────┘                  │
│                                      │                                      │
│                                      ▼                                      │
│                     执行 `brutx-vue update`                                 │
│                                      │                                      │
│             ┌────────────────────────┴────────────────────────┐             │
│             ▼                                                 ▼             │
│    【选择 A：--overwrite 覆盖】                       【选择 B：取消/放弃升级】      │
│  - 本地定制代码被全量冲掉                         - 错过官方安全漏洞修复与 Bugfix    │
│  - 需要人工从 Git 历史找回并重新拼装               - 无法享受新版无障碍与性能优化    │
│  - 升级心智负担极大，容易丢失业务逻辑             - 组件代码逐渐腐化为旧版本孤岛    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **写回动作暴力全量替换（Destructive Overwrite）**：
   目前 CLI 的 `diff-service` 虽能生成 Unified Diff 并在终端中提示 `modified`，但最终写回磁盘依然是整文件全量替换。
2. **缺乏共同祖先（Base Ancestor）的上下文**：
   单纯比对“本地当前代码”与“远端最新代码”属于 2-Way Diff。2-Way Diff 只能告诉你两份代码不一致，**无法判断某处差异是“用户主动做的业务修改”还是“官方上游做的版本演进”**，因此无法实现无冲突自动合入。

---

### 2. 三方合并（3-Way Merge）的第一性原理

三方合并（3-Way Merge）是版本控制系统（如 Git）解决并发分支演化的数学标准解。其核心在于引入三个参与方：

```text
                  ┌──────────────────────┐
                  │    Base (共同祖先)    │
                  │  (安装时的原始源码)  │
                  └──────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌──────────────────────┐      ┌──────────────────────┐
   │    Local / Mine      │      │   Remote / Theirs    │
   │   (本地定制后代码)   │      │   (远端上游最新代码)  │
   └──────────┬───────────┘      └──────────┬───────────┘
              │                             │
              └──────────────┬──────────────┘
                             ▼
                  ┌──────────────────────┐
                  │     3-Way Merge      │
                  │   三方合并算法引擎   │
                  └──────────┬───────────┘
                             │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌──────────────────────┐            ┌──────────────────────┐
│  无重叠修改：自动合入  │            │  同一区域冲突：标记输出  │
│  - 本地定制逻辑保留   │            │  - 生成标准冲突标记   │
│  - 官方上游更新合入   │            │  - 引导在 IDE 中解决  │
└──────────────────────┘            └──────────────────────┘
```

- **Base（$O$）**：组件上次安装或升级时所对应的原始基准源码（在内存中按当前 import alias 规范化）。
- **Local（$A$）**：开发者本地当前磁盘上的代码（包含业务扩展与格式化）。
- **Remote（$B$）**：远端注册表（Registry）中对应最新版本的源码（按相同 import alias 规范化）。

#### 状态决策矩阵

| Base ($O$) | Local ($A$) | Remote ($B$) | 合并动作（Merged） | 语义解释 |
|:---|:---|:---|:---|:---|
| $X$ | $X$ | $X$ | $X$ | 三方一致，无需变更 |
| $X$ | $Y$（用户修改） | $X$（远端未动） | $Y$ | 保留本地定制，自动保留 |
| $X$ | $X$（本地未动） | $Z$（远端升级） | $Z$ | 应用官方更新，无缝合入 |
| $X$ | $Y$（用户修改） | $Y$（远端相同修改）| $Y$ | **Clean Merge**（双方等价演进，无冲突合入） |
| $X$ | $Y$（用户修改） | $Z$（远端不同修改）| **Conflict** | 同一区域改动冲突，生成标准冲突标记 |
| $X$ | 删除了 | $X$（远端未动） | **Deleted** | 用户主动删除文件，保持删除状态 |
| $X$ | 删除了 | $Z$（远端升级） | **Conflict** | 本地删除 vs 远端修改，提示恢复或放弃 |
| $X$ | $Y$（用户修改） | 删除了 | **Conflict** | 本地修改 vs 远端弃用，保留本地并告警 |
| 缺失 | 存在 | 存在 | **2-Way Fallback** | 缺少祖先基线，降级为 2-Way Diff 交互提示 |

---

### 3. 清单元数据驱动的按需 Base 动态重构

三方合并的核心算力要求，是**仅在执行升级命令（`update`）的这一刻于内存中需要一份确切的 Base 源码**。

本方案采用**清单元数据（Metadata Only）+ 按需重构**的设计范式：

1. **项目零冗余存储（Zero Workspace Footprint）**：
   用户项目中仅维护极轻量的纯 JSON 元数据文件 `.brutx/manifest.json`，记录每个组件安装时的 `version`、`registrySource` 和 `contentHash`。项目代码树与 IDE 全局搜索保持纯净。
2. **多级透明解析**：
   升级时，引擎优先读取本地全局缓存（`~/.cache/brutx/`），未命中时按需向 Registry 请求对应版本的原始组件定义。
3. **动态 Alias 重投影（Alias Re-projection）**：
   获取到的 Base 原始源码在内存中依据用户项目当前的 `components.json` 实时执行别名规范化，确保 Base 与本地代码处于完全相同的别名语境。
4. **团队协作零心智负担**：
   协作者拉取仓库代码后，由于 `manifest.json` 已锁定版本元数据，在任何开发机上触发升级均能自动在内存中精准构建 Base 祖先，实现确定性的三方合并。

---

## 二、 核心架构与领域模型

### 1. 整体架构拓扑

```text
packages/cli/src/lib/merge/
├── index.ts                     # 统一导出门面
├── types.ts                     # 领域模型与接口定义
├── baseline-provider.ts         # Base 祖先按需动态重构器 (全局缓存 + Registry 回溯 + 别名重投影)
├── 3way-merge-engine.ts         # 纯数据 3-Way Merge 核心算法引擎
├── directory-merge-planner.ts   # 目录级拓扑感知调度器 (新增/删除/修改/重命名四象限)
└── whitespace-normalizer.ts     # 换行符 (CRLF/LF) 保持与格式化容差工具
```

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            三方合并升级系统架构                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. BaselineProvider (Base 祖先按需重构)                                    │
│     ├─ 读取 `.brutx/manifest.json` 获取 version 与 registrySource           │
│     ├─ 优先查本地全局缓存 (~/.cache/brutx) -> 未命中查 Registry 历史定义    │
│     └─ 依据当前 ProjectContext.aliases 动态重投影 -> 产出纯净 Base 文本      │
│                                                                             │
│  2. DirectoryMergePlanner (目录拓扑调度)                                     │
│     ├─ 文件增删状态判定 (新增 / 安全删除 / 冲突保留 / 漂移处理)             │
│     └─ 同名文件比对 (进入 ThreeWayMergeEngine)                              │
│                                                                             │
│  3. ThreeWayMergeEngine (三方合并引擎 - 纯内存计算)                         │
│     ├─ 换行符与格式化容差过滤 (LCS 最长公共子序列算法)                      │
│     ├─ 识别 Clean Merge、Local 保留与 Upstream 应用                        │
│     └─ 产生冲突时输出标准 Git 冲突标记 (<<<<<<< LOCAL ... >>>>>>> REMOTE)   │
│                                                                             │
│  4. FileTransaction (三合一原子事务保障)                                    │
│     ├─ 内存计算完整 ComponentMergePlan                                       │
│     ├─ 原子批量写入磁盘：[组件源码] + [manifest.json 更新] + [审计日志]    │
│     └─ 任意环节异常 100% 自动回滚，杜绝半写入与状态撕裂                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. 领域接口契约（`types.ts`）

```typescript
export type MergeFileStatus =
    | 'unchanged'       // 三方完全一致，无需操作
    | 'merged'          // 成功自动合并（无冲突）
    | 'conflict'        // 产生冲突并写入了标准冲突标记
    | 'added'           // 远端新增文件，写入本地
    | 'deleted'         // 远端删除且本地未修改，安全删除
    | 'delete-skipped'  // 远端删除但本地有修改，予以保留并告警
    | 'restore-prompt'  // 远端存在更新但本地被用户删除，提示是否恢复
    | 'fallback-diff';  // 缺少 Base，降级为 2-Way Diff

export type MergeAction = 'write' | 'delete' | 'skip';

export interface SingleFileMergeResult {
    filePath: string;           // 相对项目根目录的 POSIX 路径
    status: MergeFileStatus;
    action: MergeAction;        // 计划采取的物理文件动作
    content?: string;           // 合并后的最终文件文本（包含冲突标记或合入内容，action 为 delete 时为 undefined）
    hasConflicts: boolean;
    conflictCount?: number;     // 冲突区块数量
    baseHash?: string;
    localHash?: string;
    remoteHash?: string;
    detectedEol?: '\n' | '\r\n';// 本地文件的原始换行符
}

export interface ComponentMergePlan {
    componentName: string;
    files: SingleFileMergeResult[];
    hasConflicts: boolean;
    totalFiles: number;
    mergedFiles: number;
    conflictedFiles: number;
    addedFiles: number;
    deletedFiles: number;
    isFallback: boolean;        // 是否降级为 2-Way 处理
}

export interface MergeExecutionOptions {
    dryRun?: boolean;
    conflictStrategy?: 'markers' | 'ours' | 'theirs';
    forceOverwrite?: boolean;
    isCi?: boolean;             // 是否处于 CI / 非交互式终端环境
}
```

---

### 3. `BaselineProvider`：零项目污染的 Base 动态重构机制

`BaselineProvider` 负责在升级发生时，按需在内存中提供精准的基线源码，其工作流程如下：

```text
                  ┌───────────────────────────────┐
                  │ 读取本地 .brutx/manifest.json │
                  └──────────────┬────────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
            【记录了组件 version】      【未记录版本或无 manifest】
                   │                           │
                   ▼                           ▼
        查询全局缓存 (CacheStorage)         降级为 2-Way Diff 流程
                   │                           │
          ┌────────┴────────┐                  │
          ▼                 ▼                  │
      【缓存命中】      【缓存未命中】         │
          │                 │                  │
          │                 ▼                  │
          │         向 Registry 请求历史定义   │
          │                 │                  │
          └────────┬────────┘                  │
                   ▼                           │
       获取对应版本的原始组件文件定义         │
                   │                           │
                   ▼                           │
      根据当前项目 components.json             │
      动态执行 resolveImportAlias              │
                   │                           │
                   ▼                           ▼
        产出内存 Base 文本 (完成重构)    首次覆盖后更新 manifest.json
```

- **动态 Alias 重投影（Alias Re-projection）**：
  若开发者在组件安装后修改了 `components.json` 中的 `aliases`（如将 `@/components` 调整为 `~/components`），`BaselineProvider` 会基于**当前最新的 Alias 映射规则**对历史 Base 源码进行内存转换，保证 Base 与 Local 处于相同的别名语境，彻底消除因配置变更带来的伪冲突。

---

## 三、 算法与合并流水线设计

### 1. 目录级拓扑感知合并算法

组件通常由多个文件构成（如 `Button.vue`、`button-variants.ts`、`index.ts` 等），`DirectoryMergePlanner` 负责对组件目录树执行全量拓扑判定：

```text
┌─────────────────┬─────────────────┬──────────────────┬─────────────────┬────────────────────────────────────┐
│ Base 文件状态   │ Local 文件状态  │ Remote 文件状态  │ 执行 Action     │ 拓扑处理决策                       │
├─────────────────┼─────────────────┼──────────────────┼─────────────────┼────────────────────────────────────┤
│ 存在            │ 存在            │ 存在             │ write / skip    │ 进入单文件 3-Way Merge 流程        │
│ 不存在          │ 不存在          │ 存在             │ write           │ 判定为「官方新增文件」，直接写入   │
│ 存在            │ 存在（未修改）  │ 不存在           │ delete          │ 判定为「官方弃用文件」，安全删除   │
│ 存在            │ 存在（已修改）  │ 不存在           │ skip            │ 判定为「冲突弃用」，保留本地并告警 │
│ 存在            │ 不存在（用户删）│ 存在（有更新）   │ skip / prompt   │ 判定为「删除冲突」，提示是否恢复   │
│ 存在            │ 不存在（用户删）│ 存在（未更新）   │ skip            │ 用户主动删除，保持删除状态         │
│ 不存在          │ 存在（用户自建）│ 存在（官方同名） │ write (merge)   │ 本地自建 vs 官方新增，触发合并/冲突│
└─────────────────┴─────────────────┴──────────────────┴─────────────────┴────────────────────────────────────┘
```

---

### 2. 单文件 3-Way Merge 与格式化容差处理

#### 严格保护本地原始换行符（EOL Preservation）

在 Windows 环境下文件可能采用 `\r\n` (CRLF)，而在 macOS/Linux 下采用 `\n` (LF)。
1. **比对阶段**：引擎首先嗅探 Local 文件的行尾序列（`detectedEol: '\r\n' | '\n'`），并在纯数据比对时统一将三方内容归一化为 `\n` 进行 LCS 算法求解。
2. **生成与写回阶段**：合并结果（包括标准冲突标记）在最终格式化时，**严格根据 Local 文件的原始 `detectedEol` 进行还原**。杜绝因换行符强制转为 LF 导致 Windows 开发者 Git diff 全红的问题。

#### 消除空白与引号干扰

- 比对行哈希与匹配公共代码块时，引擎过滤纯前导/尾随空格及单双引号差异，防止因用户本地 Prettier 格式化（如 2 空格变 4 空格、双引号变单引号）导致整文件全量冲突。
- 当采纳 Remote 更新行时，若 Local 存在明显的缩进基准（如 4 空格），引擎执行缩进适配（Indentation Adaptation），避免生成混杂缩进代码。

#### 标准 Git 冲突标记输出格式

当 Local 与 Remote 在同一代码区域存在非空实质性改动时，生成标准冲突标记：

```vue
<<<<<<< LOCAL
<button :class="cn(buttonVariants({ variant, size }), 'analytics-tracking-class', props.class)">
=======
<button :class="cn(buttonVariants({ variant, size }), 'focus-visible:ring-2', props.class)">
>>>>>>> REMOTE
```

- `LOCAL`：保留用户当前的本地定制逻辑（如埋点 class）。
- `REMOTE`：包含上游官方的最新修复或特性（如 `focus-visible:ring-2`）。
- 该格式可直接被 VS Code、Cursor、WebStorm 等主流 IDE 的三方合并器识别并图形化高亮，支持一键“Accept Current / Accept Incoming / Accept Both”。

---

## 四、 CLI 命令与交互契约

### 1. `brutx-vue update` 命令流程演进

`update` 命令默认全面接入 3-Way Merge：

```bash
# 默认行为：自动三方合并，保留本地定制，遇冲突写入标准标记
npx brutx-vue update

# 冲突解决策略参数：
npx brutx-vue update --ours      # 遇冲突时默认全部采纳本地修改
npx brutx-vue update --theirs    # 遇冲突时默认全部采纳远端修改
npx brutx-vue update --force     # 强制全量覆盖（跳过合并，退回暴力覆盖行为）
```

#### 终端交互与摘要输出

```text
📦 Brutx-Vue CLI - 3-Way Merge Summary:

  ✔ Button (3 files merged cleanly)
      - Button.vue: Merged (kept 2 local customizations, applied 1 upstream fix)
      - button-variants.ts: Unchanged
      - index.ts: Unchanged

  ⚠ Card (1 conflict detected)
      - Card.vue: 1 conflict marked (<<<<<<< LOCAL ... >>>>>>> REMOTE)
      - index.ts: Merged

----------------------------------------------------------------------
ℹ Resolution Guide:
  Open conflicting files in your IDE (VS Code / Cursor) to accept/combine changes.
  Run `npx brutx-vue doctor` to verify when conflicts are resolved.
```

---

### 2. 交互式 TTY vs 非交互 CI 场景契约

在流水线（CI / Git Hook）或非交互式环境（`process.stdout.isTTY === false` 或传入 `--ci`）中执行更新时：
- **无冲突**：正常完成合并，退出码为 `0`。
- **产生未解冲突**：若未显式指定 `--ours` 或 `--theirs`，CLI 写入冲突标记后**必须以非 0 退出码（Exit Code 1）退出**并向 `stderr` 打印冲突文件清单，坚决阻断包含冲突标记的代码直接进入打包或部署流程。
- **本地 TTY 终端**：写入冲突标记并以 `0` 退出，高亮提示 IDE 冲突解决引导。

---

### 3. `brutx-vue add` 命令拓展

- **默认行为**：若组件已存在，保持跳过（`Skip`）。
- **`--overwrite`**：保持暴力全量覆盖语义（不执行合并，直接覆写）。
- **`--merge`**：对已存在组件启用 3-Way Merge 流水线。

---

### 4. `brutx-vue doctor` 冲突巡检规则扩展

在声明式诊断引擎中新增 `integrity/no-conflict-markers` 规则：

```typescript
export const checkConflictMarkersRule: DiagnosticRule = {
    id: 'integrity/no-conflict-markers',
    category: 'integrity',
    severity: 'error',
    fixable: false, // 冲突必须由开发者人工决策选择，禁止盲目自动自愈
    description: 'Check if installed components contain unresolved 3-way merge conflict markers',
    check: async (context: ProjectContext) => {
        // 遍历 components 目录所有文件，检测是否存在未闭合的 `<<<<<<< LOCAL` / `>>>>>>> REMOTE`
        // 若存在，输出精准的文件相对路径与所在行号区间
    }
};
```

---

## 五、 安全保障与三合一原子事务

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       三合一原子提交事务 (FileTransaction)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ComponentMergePlan (内存计算完毕)                                          │
│         │                                                                   │
│         ▼                                                                   │
│   FileTransaction.begin()                                                   │
│   ├─ 1. transaction.write(...)      -> 组件实际源码文件 (src/components/...) │
│   ├─ 2. transaction.writeJson(...)  -> 更新 .brutx/manifest.json 元数据     │
│   └─ 3. transaction.append(...)     -> 写入 .brutx/audit.jsonl 升级审计日志 │
│         │                                                                   │
│         ▼                                                                   │
│   FileTransaction.commit()                                                  │
│   ├─ 全部成功 -> 磁盘原子生效                                               │
│   └─ 任意 IO 失败 -> 100% 自动回滚，恢复磁盘与清单原状                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **纯内存计算与零磁盘污染（Zero-Disk Corruption）**：
   三方合并算法与目录拓扑调度全程在内存中执行，仅产出 `ComponentMergePlan` 数据结构，计算过程不对磁盘产生任何临时文件或副作用。
2. **三合一原子提交契约（Unified Atomic Commit）**：
   组件源码写盘、`manifest.json` 版本与哈希更新、以及审计日志写入**严格绑定在同一个 `FileTransaction` 中原子提交**。杜绝出现“源码已合入但清单未更新”或“清单已更新但源码写盘失败”的状态撕裂。
3. **全工程 VFS Seam 规范遵从**：
   `BaselineProvider`、`DirectoryMergePlanner` 全面基于 `ProjectContext.fs`（`FileSystemAdapter`）进行依赖注入，所有路径在内部统一转换为 POSIX 格式，支持 100% 纯内存沙箱测试。

---

## 六、 实施路径与里程碑（Milestones）

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          分阶段落地里程碑 (Milestones)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Milestone 1: 纯数据 3-Way Merge 核心算法与容差引擎                         │
│  - 引入/封装 ThreeWayMergeEngine 纯数据模块 (基于 LCS 算法)                 │
│  - 实现换行符 (CRLF/LF) 嗅探与原始 EOL 保持逻辑                             │
│  - 实现 WhitespaceNormalizer 空白容差与缩进适配器                           │
│  - 编写算法层单元测试（全自动合入、等价演进、单/多行冲突、换行符保持）       │
│                                                                             │
│  Milestone 2: BaselineProvider 清单元数据 Base 动态重构器                   │
│  - 实现基于 manifest.json 的版本与 RegistrySource 提取                      │
│  - 对接 CacheStorage 全局缓存与 Registry 历史端点回溯                       │
│  - 实现基于当前 ProjectContext.aliases 的 Base 动态重投影                   │
│  - 实现 Base 缺失时的 2-Way Diff 优雅降级通道                               │
│                                                                             │
│  Milestone 3: DirectoryMergePlanner 目录级拓扑感知调度                      │
│  - 实现组件多文件的新增、删除、修改、冲突保留四象限判定矩阵                 │
│  - 生成标准 ComponentMergePlan 数据结构                                     │
│                                                                             │
│  Milestone 4: CLI 命令交互与三合一原子事务集成                              │
│  - 改造 update.ts 默认启用 3-Way Merge，支持 --ours / --theirs / --force    │
│  - 改造 add.ts 增加 --merge 扩展选项                                        │
│  - 接入 FileTransaction 实现源码 + 清单 + 审计三位一体原子提交              │
│  - 实现 CI / 非交互环境冲突阻断退出码 (Exit Code 1)                         │
│                                                                             │
│  Milestone 5: Doctor 巡检规则与全链路集成测试                               │
│  - 在 DiagnosticEngine 中新增 integrity/no-conflict-markers 规则           │
│  - 编写 MemoryFS 零 IO 内存集成测试，覆盖升级全生命周期与冲突场景           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 七、 落地修订与架构自检清单

| 模块 / 维度 | 审查关键点 | 落地设计标准 | 状态 |
| :--- | :--- | :--- | :---: |
| **状态机矩阵** | 等价演进与删除状态 | 补全 $A=B \neq O$ 的 Clean Merge 与删除冲突判定 | ✅ 已确立 |
| **Base 祖先提供** | 存储与项目隔离 | 采用 `manifest.json` 元数据 + 全局缓存按需重构，项目零冗余 | ✅ 已确立 |
| **别名自适应** | Alias 配置变更 | 升级时在内存中对 Base 实时执行当前 Alias 重投影，消除伪冲突 | ✅ 已确立 |
| **跨平台换行** | EOL 保护 | 嗅探 Local 文件换行符，写回时严格保持原样（CRLF/LF） | ✅ 已确立 |
| **事务原子性** | 数据一致性 | 组件源码、Base 清单、审计日志必须在单 `FileTransaction` 内原子提交 | ✅ 已确立 |
| **CI / 终端契约**| 自动化阻断 | CI 非交互环境下产生未解冲突以 Exit Code 1 阻断构建与部署 | ✅ 已确立 |
| **Doctor 巡检** | 冲突标记检测 | `integrity/no-conflict-markers` 显式标注 `fixable: false` | ✅ 已确立 |
| **VFS Seam** | 架构依赖注入 | 强制注入 `FileSystemAdapter`，内部路径统一 POSIX 规范 | ✅ 已确立 |

