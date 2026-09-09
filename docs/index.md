# BrutxUI 文档中心

> 本文档是 BrutxUI 工程内部 `docs/` 目录的全局知识地图与高阶导航索引。
> 文档生命周期与编写规范详见 [文档治理指南（DOC_GOVERNANCE.md）](guides/DOC_GOVERNANCE.md)。
> `README-en.md` 为项目英文简介（与根 README 对应），不是目录索引。

---

## 一、 核心规范与操作手册（Guides）

位于 [`docs/guides/`](guides/)，为工程常青文档，随技术演进持续维护：

| 规范文档 | 核心领域 | 定位说明 |
| :--- | :--- | :--- |
| [DOC_GOVERNANCE.md](guides/DOC_GOVERNANCE.md) | **治理规范** | 文档目录分级拓扑、生命周期状态机、YAML Frontmatter 契约与 CI 自动化门禁 |
| [VISUAL_SYSTEM.md](guides/VISUAL_SYSTEM.md) | **设计系统** | Neo-Brutalism 视觉哲学、硬边框、纯色几何、Subtle 色系与物理动效 |
| [TAILWIND_V4_MECHANISMS.md](guides/TAILWIND_V4_MECHANISMS.md) | **样式机制** | Tailwind CSS v4 `@theme` 编译、单一信源派生、CSS 依赖图解耦与运行时注入 |
| [CVA.md](guides/CVA.md) | **变体体系** | Class Variance Authority 严苛规范、CompoundVariants、类型推导与防重叠 |
| [COMPONENT_GUIDE.md](guides/COMPONENT_GUIDE.md) | **组件规范** | 组件生命周期、Reka UI 无头原语封装、变体隔离与无障碍 A11y 合规 |
| [COMPONENT_DOC_TEMPLATE.md](guides/COMPONENT_DOC_TEMPLATE.md) | **组件文档** | 组件中英文使用文档章节结构与必填门禁标准 |
| [COMMANDS.md](guides/COMMANDS.md) | **指令手册** | 全工程高低频指令分层、版本发布流水线、性能压测与底层契约检查逃生通道 |
| [RELEASE.md](guides/RELEASE.md) | **发布流程** | Changeset 发版流程、npm 发布门禁与 CHANGELOG 自动化生成规范 |
| [RELEASE_ARCHITECTURE.md](guides/RELEASE_ARCHITECTURE.md) | **发布架构** | Monorepo 跨包版本锁定、拓扑排序构建、Registry 预编译与发布时一致性 |
| [COMMIT_CONVENTION.md](guides/COMMIT_CONVENTION.md) | **提交规范** | 约定式提交（Conventional Commits）风格与 Shell 脚本规范 |

---

## 二、 现行活跃方案（Active Plans）

位于 [`docs/plans/`](plans/)，仅收纳当前正在评审（`draft`）或推进实施（`active`）的方案。落地后即移入归档区：

### 全局核心架构（Core）
- [系统演进与存量任务收敛方案](plans/core/系统演进与存量任务收敛方案.md)（状态：`active`）  
  *全面收敛并统一推进 CLI init 交互式引导、复合区块 CVA 变体抽离、Statistic 数值统计组件以及三大架构工程化自动化方向（主入口动态生成 / 类型回归测试门禁 / 文档 Props 表格自动生成）。*
- [文档链接检查与自愈引擎改进方案](plans/core/文档链接检查与自愈引擎改进方案.md)（状态：`active`）  
  *推进文档链接巡检工具的第一性原理重构，接入 VFS 抽象与原位切片替换机制，实现纯动态 Basename 拓扑自愈、Windows 11 大小写穿透校验与生命周期分层降噪。*

---

## 三、 历史沉淀归档库（Archive）

位于 [`docs/archive/`](archive/)，收纳已 100% 落地完结（`done`）或已被新世代取代（`archived`）的历史方案。与活跃区保持 1:1 领域镜像对称：

### 2026 年度落地方案（[`docs/archive/2026/`](archive/2026/)）

- **[CLI 领域（11 篇）](archive/2026/cli/)**：Tailwind 依赖图扫描与样式解耦、3-Way Merge 冲突合并引擎、声明式巡检与自愈、Jiti 沙箱插件与多态 Reporter、网络韧性与竞速退避、VFS 项目上下文、样式自动生成、语法树 AST 升级、注册表深模块客户端、发布时构建等。
- **[UI 组件领域（10 篇）](archive/2026/ui/)**：组件设计规范与视觉效果优化、组件深化与拓展、NumberInput 视觉优化、工控窗口与 Switch 机械键帽重塑、滑块与滚动条实体质感、按压反馈盖影、视觉质感进阶、组件选中态统一、命令式弹层与 MessageBox 解耦等。
- **[样式与设计系统（5 篇）](archive/2026/styles/)**：阴影组装化重构（`--shadow-brutal-*` 标准 5 层）、Tailwind 颜色双轨收敛、主题系统三套合一、状态生命周期色彩、阴影过渡与焦点体系等。
- **[核心架构与基建（17 篇）](archive/2026/core/)**：架构优化方案-v3、AST 解析统一与源码工具链治理、全工程 VFS 抽象、注册表编译管线、排除清单下沉、共享常量防漂移、树模型与 Z-Index、死代码清理、代码质量改进、约定体系修复、辅助包 v1/v2、架构优化 v1/v2、只读状态化等。

---

## 四、 报告中心（Reports）

位于 [`docs/reports/`](reports/)，分为三大类持续沉淀：

- **[周期性扫描快照（scans/）](reports/scans/)**：以日期为前缀的定期自动化扫描与缺陷排查快照（如 `2026-07-*-ui界面bug扫描报告.md`、`根仓库扫描报告.md`、`辅助包bug扫描报告.md`）。
- **[体系化审计与审查（audits/）](reports/audits/)**：技术债审查、性能审计、样式与架构优化机会审查、约定与代码裁决审查、未纳入债清单等深度审计结论。
- **[技术调研与选型（research/）](reports/research/)**：AST 选型工程资料与实践调研报告。

---

## 五、 文档治理工具与门禁

为杜绝人工记账带来的数据脑裂，工程配备了遵循 Unix 哲学的全自动文档门禁工具体系：

```bash
# 1. 统一全量文档门禁（推荐，成功极简确认，失败精准报错）
pnpm check:docs

# 2. 自动修复链接并复测
pnpm check:docs:fix

# 3. 终端打印各领域方案全景矩阵看板
node scripts/docs/scan-doc-status.mjs --table
```
