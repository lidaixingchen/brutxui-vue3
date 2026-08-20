# docs/ 文档目录

> 本文档是 `docs/` 目录的索引，也是文档治理规则的落点；维护 `docs/` 时依本文档执行。
> `README-en.md` 为项目英文简介（与根 README 对应），**不是**目录索引。

## 目录总览

| 目录 | 内容 | 生命周期 |
| --- | --- | --- |
| [guides/](guides) | 规范与操作手册（英文全大写命名，如 UPPERCASE_SNAKE_CASE.md） | 常青，持续维护 |
| [plans/](plans) | 方案计划（中文命名，frontmatter 标注状态） | 提出 → 落地 → 过期 |
| [reports/](reports) | 审计与扫描报告（快照型日期前置） | 时间点快照，持续累积 |
| [archive/](archive) | 归档：被取代 / 完结的旧版方案（按年分区） | 不再维护 |
| [README-en.md](README-en.md) | 项目英文简介 | 常青 |

## 文档治理规则

### 生命周期与分类

`docs/` 文档按生命周期分三类，互不混杂：

| 目录 | 内容 | 生命周期 |
| --- | --- | --- |
| `guides/` | 规范 / 操作手册 | 常青，持续维护 |
| `plans/` | 方案计划 | 提出 → 落地 → 过期（done 后视情况归档） |
| `reports/` | 审计 / 扫描报告 | 时间点快照，持续累积 |

被取代或完结的方案移入 `archive/YYYY/`（按年分区，不再维护）。

### frontmatter 规范（plans/ 与 archive/ 的方案文档）

所有方案文档在标题下、正文前统一文档头：

```markdown
> 方案类型：重构 / 流程改造 / 功能设计 / 优化 …
> 状态：**draft** | active | done | archived
> 日期：YYYY-MM-DD
> 关联文档：[xxx](../guides/xxx.md)、[yyy](../reports/yyy.md)   ← 可选
> 修订记录：YYYY-MM-DD 本次改动摘要            ← 有修改才写
```

### 状态机

```text
draft ──评审通过──▶ active ──落地完成──▶ done ──作者决定归档──▶ archived
                    │                        │
                    └──被新版本取代───────────┘   （如 v3 落地后 v1/v2 → archived）
```

- `draft`：未定稿，正在评审
- `active`：已定稿，正在实施，或实施完成且**仍是读者应遵从的权威指引**（读者照它干活）
- `done`：已全部落地，保留在 plans/ 供追溯，**不再作为操作指引**，作者决定归档时机
- `archived`：已被取代或完结归档，位于 `archive/YYYY/`，不再维护
- **一句话判据**：读者还要照着做 = active；读完不用做 = done
- **同一主题只保留一份 active/done**：新版本接管后，旧版本立即移入 archive。plans/ 内同主题带 `-v{n}` 区分世代，archive/ 保留原名。

### 命名规范

- 方案 / 报告 / 归档文档一律**中文文件名**：`<中文主题>方案.md` / `<中文主题>报告.md`；功能设计类用 `<中文主题>设计.md`。英文专有名词保留原文（如 `composables状态只读化方案.md`、`registry产物发布时构建方案.md`）。
- **报告分两类**：
  - **快照型**（周期扫描）：日期前置 `<YYYY-MM-DD>-<中文主题>报告.md`，目录内按日期自然排序（如 `2026-07-11-ui界面bug扫描报告.md`）
  - **结论型**（一次性审计）：不带日期 `<中文主题>报告.md`（如 `技术债审查报告.md`、`性能审计报告.md`）
- **guides/ 豁免**：规范与操作手册保持英文全大写命名与英文标题（如 `VISUAL_SYSTEM.md`、`TAILWIND_V4_MECHANISMS.md`），不使用中文文件名。
- **约定名**：目录索引固定 `index.md`；`README-en.md` 为项目英文简介。
- **标题一律中文**（guides/ 除外）。
- **链接一律相对路径**，禁止 `file:///` 绝对链接。

## 方案状态表

| 方案 | 状态 | 说明 |
| --- | --- | --- |
| [架构优化方案-v3](plans/架构优化方案-v3.md) | **active** | 现行架构方向，三大方向推进中（v1/v2 已归档） |
| [辅助包改进方案-v2](plans/辅助包改进方案-v2.md) | done | P0/P1 已全部落地（v1 已归档） |
| [组件深化与拓展方案](plans/组件深化与拓展方案.md) | **active** | v2.0，Statistic 与键盘导航未落地 |
| [阴影组装化重构方案](plans/阴影组装化重构方案.md) | **active** | 阴影工具类回归 `@theme` 标准组装 + 焦点体系回退 ring（取代《阴影过渡与焦点体系统一方案》） |
| [按压反馈盖影设计](plans/按压反馈盖影设计.md) | done | 按压反馈改盖影语义（位移=阴影偏移），含 --brutal-pressed-offset 移除，已落地 |
| [组件设计规范与视觉效果优化方案](plans/组件设计规范与视觉效果优化方案.md) | **active** | R8 排版体系、Subtle 浅色语义令牌、交互尺寸对齐与机械弹性动效 |
| [主题系统三套合一与色彩对比度治理方案](plans/主题系统三套合一与色彩对比度治理方案.md) | done | 主题链路收敛至 shared、删除 JS 冗余主题层、预设 CSS 生成化、全主题对比度达标 WCAG AA |
| [死代码与动效预设清理方案](plans/死代码与动效预设清理方案.md) | done | 清理公共死导出与关联类型、移除 13 个死动效与 6 个辅助类、废除 useAnimation 组合式函数 |
| [组件选中态统一与交互无障碍补齐方案](plans/组件选中态统一与交互无障碍补齐方案.md) | done | 选中态三态正交统一、Menu Roving Focus 键盘导航、Transfer 粗野主义对齐、Canvas 晚挂载自愈 |
| [共享常量收割与构建校验防漂移方案](plans/共享常量收割与构建校验防漂移方案.md) | **active** | UI 共享常量全面收割、构建脚本单一来源收敛、Fallback 真实值校验升级、文档元数据纠偏 |
| [CLI样式自动生成与单一信源治理方案](plans/CLI样式自动生成与单一信源治理方案.md) | done | 将 CLI brutalist.css 纳入 generate-styles-tokens 自动化生成管道，实现全库设计令牌单一事实来源闭环 |
| [组件视觉效果深化与质感进阶方案](plans/组件视觉效果深化与质感进阶方案.md) | **active** | 材质纹理系统、多重立体与内嵌凹槽阴影、机械微动效与音效联动、工控装配与 HUD 版式四大维度深化 |
| [命令式弹层宿主深化与MessageBox解耦方案](plans/命令式弹层宿主深化与MessageBox解耦方案.md) | **active** | 命令式 UI 全生命周期宿主深模块构建、LIFO 活动栈与 ESC 路由、MessageBox 独立解耦 |
| [CLI项目上下文与路径解析引擎封装方案](plans/CLI项目上下文与路径解析引擎封装方案.md) | done | ProjectContext 深模块聚合实体、FileSystemAdapter 双适配器 Seam（Disk/Memory）、路径解析引擎全量收拢与零 IO 测试 |
| [CLI声明式诊断巡检与自愈引擎方案](plans/CLI声明式诊断巡检与自愈引擎方案.md) | done | 声明式 DiagnosticEngine 规则引擎、五大领域规则集解耦、单事务拓扑原子自愈与 CycloneDX 1.5 SBOM 独立服务 |
| [注册表编译与AST静态转换管线模块化方案](plans/注册表编译与AST静态转换管线模块化方案.md) | done | RegistryCompiler 深模块编译流水线、SourceProvider 内存/磁盘双适配器 Seam、AST 语义安全重写与发射器解耦 |
| [全工程虚拟文件系统统一与持久化深模块重构方案](plans/全工程虚拟文件系统统一与持久化深模块重构方案.md) | done | 跨包 VFS 基础设施（`brutx-shared-vue/fs`）、CLI 缓存/审计持久化深模块、清除双轨适配器、设计令牌纯计算编译器与脚手架事务引擎 |
| [Tailwind颜色双轨与工具函数单一信源治理方案](plans/Tailwind颜色双轨与工具函数单一信源治理方案.md) | done | 颜色令牌单一信源派生 BRUTAL_COLOR_NAMES、UI 与 CLI 工具函数模板同源生成、FOCUS_RING_CLASSES 导出闭环与四端 CI 门禁 |
| [编译扫描排除清单与覆盖规则下沉方案](plans/编译扫描排除清单与覆盖规则下沉方案.md) | done | 将 DEFAULT_LIB_EXCLUDE、DEFAULT_MANIFEST_OVERRIDES 与 applyManifestOverrides 下沉至 shared，消除 registry 跨包非法引用与硬编码 |
| [元数据脚手架树模型与层级体系治理方案](plans/元数据脚手架树模型与层级体系治理方案.md) | **done** | 脚手架与元数据自动同步闭环、统一 TreeNode 领域模型、Z-Index 五级阶梯尺度与设计令牌治理 |
| [状态生命周期色彩与组件双轨治理方案](plans/状态生命周期色彩与组件双轨治理方案.md) | **active** | useMessage 接入 createFallbackManager、useDialogGeometry 规范重构、WCAG 对比度算法下沉 shared、Tabs 双轨状态对称性治理 |


## 归档方案（archive/2026/）

已完结或被取代、不再维护：

- [架构优化方案-v1](archive/2026/架构优化方案-v1.md)（被 v3 取代）
- [架构优化方案-v2](archive/2026/架构优化方案-v2.md)（被 v3 取代）
- [辅助包改进方案-v1](archive/2026/辅助包改进方案-v1.md)（被 v2 取代）
- [组件拓展方案](archive/2026/组件拓展方案.md)（被组件深化与拓展方案 v2.0 取代）
- [阴影过渡与焦点体系统一方案](archive/2026/阴影过渡与焦点体系统一方案.md)（被阴影组装化重构方案取代）
- [CLI基础设施闭环方案](archive/2026/CLI基础设施闭环方案.md)（已闭环完结）
- [registry产物发布时构建方案](archive/2026/registry产物发布时构建方案.md)（已落地完结）
- [composables状态只读化方案](archive/2026/composables状态只读化方案.md)（M1-M7 已全量落地）
- [changelog自动化设计](archive/2026/changelog自动化设计.md)（自动化脚本已落地）
- [文档目录改造方案](archive/2026/文档目录改造方案.md)（docs 目录改造已完成）

## 报告索引

| 报告 | 类型 | 日期 |
| --- | --- | --- |
| [技术债审查报告](reports/技术债审查报告.md) | 结论型 | 2026-06-30 |
| [性能审计报告](reports/性能审计报告.md) | 结论型 | 2026-07-17 |
| [2026-07-11-ui界面bug扫描报告](reports/2026-07-11-ui界面bug扫描报告.md) | 快照型 | 2026-07-11 |
| [2026-07-18-ui界面bug扫描报告](reports/2026-07-18-ui界面bug扫描报告.md) | 快照型 | 2026-07-18 |
| [2026-07-12-根仓库扫描报告](reports/2026-07-12-根仓库扫描报告.md) | 快照型 | 2026-07-12 |
| [2026-07-18-根仓库扫描报告](reports/2026-07-18-根仓库扫描报告.md) | 快照型 | 2026-07-18 |
| [2026-07-12-辅助包bug扫描报告](reports/2026-07-12-辅助包bug扫描报告.md) | 快照型 | 2026-07-12 |
| [2026-07-18-辅助包bug扫描报告](reports/2026-07-18-辅助包bug扫描报告.md) | 快照型 | 2026-07-18 |

## 新增文档流程

1. **判断类型**：规范 → `guides/`；方案 → `plans/`；报告 → `reports/`（详见「文档治理规则 · 生命周期」）。
2. **命名**：按「文档治理规则 · 命名规范」。
3. **补 frontmatter**：plans/ 与 archive/ 的方案文档按「文档治理规则 · frontmatter 规范」补文档头，状态取 `draft | active | done`。
4. **校验链接**：新增 / 移动 / 重命名后跑「链接校验工具」。
5. **旧方案被取代**：立即移入 `archive/YYYY/`，文件名保留版本号。

## 链接校验工具

新增、移动或重命名文档后，用 [check-doc-links.mjs](../scripts/docs/check-doc-links.mjs) 维护链接健康：

```bash
node scripts/docs/check-doc-links.mjs check        # 校验：0 死链、0 处 file:///
node scripts/docs/check-doc-links.mjs fix --dry    # 预览链接改写（文档移动后重算深度，不落盘）
node scripts/docs/check-doc-links.mjs fix          # 执行改写
```

- **校验口径**：文档间 `.md` 互链 0 死链 + 0 处 `file:///` 为硬指标；指向源码的相对链接失效属历史快照告警（不阻塞）。
- **文档移动 / 重命名后**：先 `fix --dry` 预览改写，确认无误后 `fix` 执行。
