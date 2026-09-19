# BrutxUI 文档中心

> 本文档是 BrutxUI 工程内部 `docs/` 目录的全局知识地图与高阶导航索引。
> 文档生命周期与编写规范详见 [文档治理指南（DOC_GOVERNANCE.md）](guides/DOC_GOVERNANCE.md)。
> `README-en.md` 为项目英文简介（与根 README 对应），不是目录索引。

---

## 一、 现行系统架构说明（Architecture）

位于 [`docs/architecture/`](architecture/)，为工程现行宏观设计与原理说明，随架构演进持续维护：

| 架构文档 | 核心领域 | 定位说明 |
| :--- | :--- | :--- |
| [项目架构总览.md](architecture/项目架构总览.md) | **系统拓扑** | 整体包职责划分、拓扑依赖图、研发与发布主流程及阅读导航 |
| [分发与公开API契约.md](architecture/分发与公开API契约.md) | **接口契约** | npm 双轨与 CLI 源码交付对比、api-contract.ts 投影、内部 helper 隔离与更新保护 |
| [生成与构建机制.md](architecture/生成与构建机制.md) | **构建管线** | 设计令牌编译单一信源、Turbo 构建拓扑依赖与 Git 暂存快照一致性保证 |

---

## 二、 核心规范与操作手册（Guides）

位于 [`docs/guides/`](guides/)，为工程常青文档，随技术演进持续维护：

| 规范文档 | 核心领域 | 定位说明 |
| :--- | :--- | :--- |
| [DOC_GOVERNANCE.md](guides/DOC_GOVERNANCE.md) | **治理规范** | 文档目录分级拓扑、生命周期状态机、YAML Frontmatter 契约与 CI 自动化门禁 |
| [VISUAL_SYSTEM.md](guides/VISUAL_SYSTEM.md) | **设计系统** | Neo-Brutalism 视觉哲学、硬边框、纯色几何、Subtle 色系与物理动效 |
| [TAILWIND_V4_MECHANISMS.md](guides/TAILWIND_V4_MECHANISMS.md) | **样式机制** | Tailwind CSS v4 `@theme` 编译、单一信源派生、CSS 依赖图解耦与运行时注入 |
| [CVA.md](guides/CVA.md) | **变体体系** | Class Variance Authority 严苛规范、CompoundVariants、类型推导与防重叠 |
| [COMPONENT_GUIDE.md](guides/COMPONENT_GUIDE.md) | **组件规范** | 组件生命周期、Reka UI 无头原语封装、变体隔离与无障碍 A11y 合规 |
| [COMPONENT_DOC_TEMPLATE.md](guides/COMPONENT_DOC_TEMPLATE.md) | **组件文档** | 组件中英文使用文档章节结构与必填门禁标准 |
| [API_MIGRATION.md](guides/API_MIGRATION.md) | **公开 API** | npm 入口、选择器辅助函数、源码安装和按钮特效迁移 |
| [COMMANDS.md](guides/COMMANDS.md) | **指令手册** | 全工程高低频指令分层、版本发布流水线、性能压测与底层契约检查逃生通道 |
| [RELEASE.md](guides/RELEASE.md) | **发布流程** | Changeset 发版流程、npm 发布门禁与 CHANGELOG 自动化生成规范 |
| [RELEASE_ARCHITECTURE.md](guides/RELEASE_ARCHITECTURE.md) | **发布架构** | Monorepo 跨包版本锁定、拓扑排序构建、Registry 预编译与发布时一致性 |
| [COMMIT_CONVENTION.md](guides/COMMIT_CONVENTION.md) | **提交规范** | 约定式提交（Conventional Commits）风格与 Shell 脚本规范 |

---

## 三、 现行活跃方案（Active Plans）

位于 [`docs/plans/`](plans/)，仅收纳当前正在评审（`draft`）或推进实施（`active`）的方案。落地后即移入归档区：

<!-- AUTO_ACTIVE_PLANS_START -->
### CLI 工具链（CLI）
*（暂无进行中的活跃方案）*

### UI 组件体系（UI）
- [单元测试质量提升与覆盖率治理方案](plans/ui/单元测试质量提升与覆盖率治理方案.md)（状态：`active`）  

### 样式与设计系统（Styles）
*（暂无进行中的活跃方案）*

### 全局核心架构（Core）
*（暂无进行中的活跃方案）*
<!-- AUTO_ACTIVE_PLANS_END -->

---

## 四、 历史沉淀归档库（Archive）

位于 [`docs/archive/`](archive/)，收纳已 100% 落地完结（`done`）或已被新世代取代（`archived`）的历史方案。与活跃区保持 1:1 领域镜像对称：

<!-- AUTO_ARCHIVE_PLANS_START -->
### 2026 年度落地方案（[`docs/archive/2026/`](archive/2026/)）

- **[CLI 领域（16 篇）](archive/2026/cli/)**：CLI组件安装与变更编排引擎重构、CLI代码修改与配置注入深模块重构、CLI注册表深模块客户端演进重构、CLI诊断自愈纯声明式方案与差异预览重构、CLI项目上下文深模块凝聚与辅助函数收敛等。
- **[UI 组件领域（13 篇）](archive/2026/ui/)**：组件库规范偏离与无障碍深度治理、组件状态与音频资源深化、命令式宿主控制器与弹层调度栈重构、NumberInput视觉优化、滑块与滚动条工控实体质感重塑等。
- **[样式与设计系统（6 篇）](archive/2026/styles/)**：跨包令牌编译器下沉与构建拓扑解耦、状态生命周期色彩与组件双轨治理、Tailwind颜色双轨与工具函数单一信源治理、主题系统三套合一与色彩对比度治理、阴影组装化重构等。
- **[核心架构与基建（28 篇）](archive/2026/core/)**：跨平台路径输入与解析一致性修复、文档体系与文档网站协同改造、CI工作流性能优化与去冗余、架构交付契约首批修复、架构交付契约第三批修复等。
<!-- AUTO_ARCHIVE_PLANS_END -->

---

## 五、 报告中心（Reports）

位于 [`docs/reports/`](reports/)，分为三大类持续沉淀：

- **[周期性扫描快照（scans/）](reports/scans/)**：以日期为前缀的定期自动化扫描与缺陷排查快照（如 `2026-07-*-ui界面bug扫描报告.md`、`根仓库扫描报告.md`、`辅助包bug扫描报告.md`）。
- **[体系化审计与审查（audits/）](reports/audits/)**：技术债审查、性能审计、样式与架构优化机会审查、约定与代码裁决审查、未纳入债清单及 [第三批架构交付契约验收报告](reports/audits/第三批架构交付契约验收报告.md) 等深度审计结论。
- **[技术调研与选型（research/）](reports/research/)**：AST 选型工程资料与实践调研报告。

---

## 六、 文档治理工具与门禁

为杜绝人工记账带来的数据脑裂，工程配备了遵循 Unix 哲学的全自动文档门禁工具体系：

```bash
# 1. 统一全量文档门禁（推荐，成功极简确认，失败精准报错）
pnpm check:docs

# 2. 自动修复链接并复测
pnpm check:docs:fix

# 3. 刷新知识地图索引
pnpm doc:archive --refresh

# 4. 终端打印各领域方案全景矩阵看板
node scripts/docs/scan-doc-status.mjs --table
```
