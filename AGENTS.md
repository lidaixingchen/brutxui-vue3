# AGENTS.md — BrutxUI Vue 3

面向 Vue 3 + Tailwind CSS 的 Neo-Brutalism UI 组件库。

## 单体仓库职责

| 包名 | 路径 | 核心定位 |
| --- | --- | --- |
| `brutx-ui-vue` | `packages/ui/` | 核心 Vue 3 组件库与公开 npm 包 |
| `brutx-vue` | `packages/cli/` | 用于 `init`、`add`、`update` 的官方 CLI 工具 |
| `brutx-registry-vue` | `packages/registry/` | 注册表编译管道与静态 AST 分析引擎 |
| `brutx-shared-vue` | `packages/shared/` | 跨包共享基础库（设计令牌、VFS、AST 转换与元数据） |
| `docs` | `apps/docs/` | VitePress 双语官方文档站点 |

系统完整职责划分与依赖拓扑见 [项目架构总览](docs/architecture/项目架构总览.md)。

## 自动生成文件保护原则

工程内的样式令牌、组件索引清单与 exports 映射由生成器自动同步，**严禁手动直接编辑自动生成的文件**。手写数据源与生成产物的对应关系见 [生成与构建机制](docs/architecture/生成与构建机制.md)。

修改设计令牌后，在根目录运行 `pnpm generate:tokens` 一键同步所有子包。

## 场景匹配的自检约定

- **包管理器限定**：开发阶段仅允许使用 `pnpm`，严禁使用 `npm` 或 `yarn`。
- **按领域选择最小化自检**：严禁在开发阶段无脑运行全局重型检查。依据触碰领域执行对应检查：

| 变动领域 | 推荐自检命令 | 说明 |
| --- | --- | --- |
| 业务逻辑 / 组件 / 函数 | `pnpm --filter <pkg> test <相对路径>`<br>`pnpm exec eslint <file> --fix` | 运行局部单元测试与代码风格修复 |
| 类型接口 / 跨包导出 | `pnpm --filter <pkg> typecheck` | 验证 TS 严格类型兼容性 |
| 样式 / 令牌 / 导出 / 依赖 | `pnpm check:contracts` | 静态契约并发 6 合 1 门禁（全绿放行） |
| 文档 / 规范 / 技能 / 链接 | `pnpm check:docs` | 文档健康度并发门禁（可加 `--fix` 纠偏相对链接） |

完整指令字典与底层排障工具见 [完整指令参考手册](docs/guides/COMMANDS.md)。

## 按任务阅读入口

在执行特定任务前，请先阅读对应的权威指南与架构说明：

| 任务类型 | 必读材料 | 补充参考 |
| --- | --- | --- |
| **新增或修改组件、交互或 Composable** | [组件开发指南](docs/guides/COMPONENT_GUIDE.md) | 新增时遵循脚手架与同步流程；涉及样式追加 [视觉系统指南](docs/guides/VISUAL_SYSTEM.md) 与 [CVA 变体声明规范](docs/guides/CVA.md) |
| **修改公开导出、依赖或注册表** | [分发与公开 API 契约](docs/architecture/分发与公开API契约.md) | 涉及生成追加 [生成与构建机制](docs/architecture/生成与构建机制.md) |
| **修改设计令牌或编译产物** | [生成与构建机制](docs/architecture/生成与构建机制.md) | [Tailwind v4 机制说明](docs/guides/TAILWIND_V4_MECHANISMS.md) |
| **修改构建脚本、缓存或 CI 工作流** | [生成与构建机制](docs/architecture/生成与构建机制.md) | 涉及发布流水线或 Actions 依赖追加 [发布架构与原理](docs/guides/RELEASE_ARCHITECTURE.md) |
| **提交变更或创建、更新 PR** | [提交信息规范](docs/guides/COMMIT_CONVENTION.md) | PR 同时遵循 [PR 模板](.github/PULL_REQUEST_TEMPLATE.md) |
| **执行版本发布** | [发布流程](docs/guides/RELEASE.md) | 排查发布系统追加 [发布架构与原理](docs/guides/RELEASE_ARCHITECTURE.md) |
| **新增、修改或归档文档** | [文档治理指南](docs/guides/DOC_GOVERNANCE.md) | 编写组件文档追加 [组件文档模板](docs/guides/COMPONENT_DOC_TEMPLATE.md) |
| **新增或维护项目 AI 技能** | [AI 技能维护指南](skills/README.md) | 按外部使用者的集成需求维护 `skills/brutxui/` |
| **处理 AI 审查报告** | [组件开发指南](docs/guides/COMPONENT_GUIDE.md) §6 | 对照基线核验设计意图，勿拿测试当挡箭牌 |

## 核心开发与代码风格规范

- **终态无痕原则**：代码注释仅解释当前复杂的业务逻辑与边界条件；严禁记录沟通修改历史、diff 说明或防御性解释。
- **0.x 演进策略**：开发早期以目标 API 与架构为准，涉及调整时直接进行破坏式变更；影响与迁移说明遵循 [提交信息规范](docs/guides/COMMIT_CONVENTION.md)。
- **优先复用**：实现前先查找项目已有的组件、Composable、函数、类型、常量与工具；职责和契约匹配时优先复用，需要扩展时在所属模块完善，仅在现有能力无法合理承载需求时新增实现。
- **变体隔离**：变体逻辑提取到同目录 `*-variants.ts`，由组件 `import` 引入，不得在 `.vue` 内联定义。
- **类名合并**：用 `computed()` 包裹 `cn(...)` 计算类名，严禁在 `<template>` 内联直接调用 `cn()`。
- **原语复用**：以 `reka-ui` 无头原语为基础，优先复用库内已有组件（如 `Button` 代替 `<button>`，`Input` 代替 `<input>`），严禁用 native 元素替代。
- **国际化文本**：文本 props 默认值设为 `undefined`，通过 `useLocale().t()` 提供默认值，优先级 `props > t() > zh-CN 默认文本`。
- **Composable 状态只读**：内部状态可变，向外返回的状态使用 `readonly()` 运行时包装并标注相应只读类型；公开可配置状态的豁免及具体类型规则见 [组件开发指南](docs/guides/COMPONENT_GUIDE.md) §5。
- **测试约定**：测试文件与源文件同名放置，一律遵循 kebab-case（如 `button.test.ts`、`button.a11y.test.ts`、`accordion-keyboard.test.ts`）。
- **方案完工归档**：凡落地完结 `docs/plans/` 下的方案，提交前必须运行 `pnpm doc:archive <方案路径>` 完成物理迁移与知识地图自愈，严禁遗留未归档方案。

## AGENTS.md 维护约定

- 编写或修改本文件时，对项目约定、发布流程、命令用途、包职责或用户偏好不确定，先询问用户，不要自行补全。
- 只记录已确认的事实和约定；从历史提交、tag 或现有文件推断的内容，先确认再写入。
- 不要把一次性操作经验写成本项目长期规则，除非用户明确确认。
