# Documentation Governance Guide — BrutxUI

> 本指南是 BrutxUI 工程内部 `docs/` 目录的最高治理规范。所有方案计划、技术报告、规范指南的新增、归档与维护均须严格依循本规范。

---

## 一、 目录拓扑与生命周期分层

`docs/` 采用 **“生命周期分流 + 领域镜像分仓”** 的两级拓扑结构，彻底隔绝长短生命周期文档混杂与目录过度扁平化：

```text
docs/
├── index.md                              # 全局知识地图与导航索引（常青）
├── README-en.md                          # 根 README 英文镜像（常青）
├── guides/                               # 规范与操作手册（常青，英文全大写命名）
│   ├── DOC_GOVERNANCE.md                 # 文档治理指南（本文）
│   ├── VISUAL_SYSTEM.md                  # 视觉设计系统
│   ├── COMPONENT_GUIDE.md                # 组件开发指南
│   └── ...
├── plans/                                # 活跃推进中的方案计划（仅收纳 draft / active）
│   ├── cli/                              # CLI 工具链与命令引擎方案
│   ├── ui/                               # UI 组件设计与交互方案
│   ├── styles/                           # 设计令牌、Tailwind 与主题方案
│   └── core/                             # 顶层架构路线与工程基建方案
├── reports/                              # 审计与调研报告中心（按性质分三类）
│   ├── scans/                            # 周期性扫描快照（日期前置：YYYY-MM-DD-*）
│   ├── audits/                           # 体系化审计与机会审查（结论型）
│   └── research/                         # 选型与技术调研资料
└── archive/                              # 历史沉淀归档库（按年度封存，与 plans 领域 1:1 镜像）
    └── YYYY/                             # 年份目录（如 2026/）
        ├── cli/                          # 当年完结/取代的 CLI 方案
        ├── ui/                           # 当年完结/取代的 UI 方案
        ├── styles/                       # 当年完结/取代的 样式/令牌 方案
        └── core/                         # 当年完结/取代的 核心架构 方案
```

### 生命周期四象限

| 目录 | 内容定义 | 生命周期特征 | 维护策略 |
| :--- | :--- | :--- | :--- |
| `guides/` | 规范 / 约定 / 操作手册 | **常青**（Long-lived） | 随工程演进而就地持续更新，永久有效 |
| `plans/` | 方案计划 / RFC / 详细设计 | **进行中**（In-progress） | 提出（draft） $\to$ 实施（active），落地后必须移入 `archive/` |
| `reports/` | 扫描快照 / 技术审计 / 选型调研 | **快照型 / 结论型** | 时间点静态记录，供历史溯源，不随代码变更加载 |
| `archive/` | 已全部落地（done）或已被取代的方案 | **已完结**（Historical） | 只读封存，不再作为操作指引；与 plans 保持领域镜像 |

---

## 二、 方案生命周期状态机与判据

所有位于 `plans/` 与 `archive/` 下的方案文档，生命周期状态遵循严格的状态机流转：

```text
draft ──评审通过──▶ active ──落地完成──▶ done ──执行归档──▶ archived (移入 archive/YYYY/<domain>/)
                     │                        │
                     └──被新版本取代───────────┘   （如 v3 定稿后 v1/v2 归档）
```

### 状态定义与一句话判据

- **`draft`**：草案，方案正在编写或评审中，尚未正式定稿执行。
- **`active`**：现行指引，已定稿正在编码实施，或虽有阶段产物但**读者仍须照其指导完成后续任务**。
- **`done`**：已全部落地完成，代码与测试均已合入，**读者读完不用做**。进入待归档缓冲区或直接归档。
- **`archived`**：历史封存，已被移入 `docs/archive/YYYY/<domain>/`，仅供追溯演进背景。

> [!IMPORTANT]
> **黄金判据**：
> - **读者还要照着做 = `active`**（必须留在 `docs/plans/<domain>/`）；
> - **读完不用做 = `done`**（必须移入 `docs/archive/YYYY/<domain>/`）。
> - 同一主题在 `plans/` 中只允许存在一份 `active`。新版本方案接管时，旧版本方案必须立即移入 `archive/`。

---

## 三、 YAML Frontmatter 规范（单一事实源）

方案文档头部必须包含标准 YAML Frontmatter（三道短横线 `---` 包裹），这是全工程方案状态追踪与 CI 自动化校验的**唯一事实来源（Single Source of Truth）**，严禁在正文外另外手工登记表格。

```yaml
---
方案类型: 重构 / 流程改造 / 功能设计 / 视觉重塑 / 底层架构
状态: draft | active | done
日期: YYYY-MM-DD
关联文档:
  - ../../guides/VISUAL_SYSTEM.md
  - ../../reports/audits/技术债审查报告.md
修订记录:
  - YYYY-MM-DD: 本次改动摘要
---
```

### 字段说明
- **`方案类型`**（必填）：简明扼要概括本方案属性。
- **`状态`**（必填）：严格取 `draft`、`active`、`done` 之一。
- **`日期`**（必填）：方案立项或定稿日期，格式 `YYYY-MM-DD`。
- **`关联文档`**（选填）：关联的规范手册或审查报告相对路径。
- **`修订记录`**（选填）：历次重大评审修正或结项记录。

---

## 四、 命名与落位规范

1. **方案文档（plans 与 archive）**：
   - 一律采用**中文文件名**：`<中文主题>方案.md`；功能设计类可用 `<中文主题>设计.md`。
   - 英文专有名词可保留原文（如 `Tailwind模块化依赖图扫描与样式解耦方案.md`）。
   - 多世代方案使用 `-v{n}` 后缀（如 `架构优化方案-v3.md`）。
   - 必须存放在对应的领域子目录（`cli`、`ui`、`styles`、`core`）中，严禁平铺在 `plans/` 或 `archive/YYYY/` 根目录。
2. **报告文档（reports）**：
   - **快照型（scans）**：日期前置 `<YYYY-MM-DD>-<中文主题>报告.md`（如 `2026-07-11-ui界面bug扫描报告.md`），存放在 `reports/scans/`。
   - **结论型（audits）**：不带日期 `<中文主题>报告.md`（如 `技术债审查报告.md`），存放在 `reports/audits/`。
   - **技术调研（research）**：选型资料与实践调研，存放在 `reports/research/`。
3. **规范文档（guides）**：
   - 必须使用**英文全大写**加下划线命名（如 `VISUAL_SYSTEM.md`、`DOC_GOVERNANCE.md`）。
4. **链接可移植性规范**：
   - 仓库内文档互链**一律采用相对路径**；
   - 严禁包含 `file:///` 本机绝对路径；
   - 任何移动或重命名操作，必须经由 `check-doc-links.mjs` 校验并保持 0 死链。

---

## 五、 自动化校验与治理工具

为防止文档状态腐烂和人工记账脑裂，工程配备了全自动的文档门禁工具体系。设计遵循“成功结果极简摘要、失败精准定位排查”的 Unix 哲学：

### 1. 统一文档健康门禁（推荐）
```bash
pnpm check:docs                # 全量文档健康门禁（成功极简确认，失败精准报错）
pnpm check:docs --fix          # 自动修复链接等可自愈项目后复测
pnpm check:docs --verbose      # 展开各项详细底层输出
```

### 2. 专项排查与看板命令（按需）
```bash
node scripts/docs/scan-doc-status.mjs --table   # 终端输出全库方案领域与状态分布看板
pnpm check:doc-links                            # 仅校验相对链接与绝对路径
pnpm check:doc-status                           # 仅校验方案 Frontmatter 契约
```
