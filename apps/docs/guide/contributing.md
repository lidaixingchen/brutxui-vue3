---
title: 贡献指南
description: 如何参与 BrutxUI 开发与贡献代码
---

# 贡献指南

感谢你对 BrutxUI 的关注！以下是参与开发与提交贡献的指引。

---

## 开发环境

### 前置要求

- Node.js 22.5+
- pnpm 11+（仓库包管理器限定为 pnpm，严禁使用 npm 或 yarn）
- Git

### 克隆与安装

```bash
git clone https://github.com/lidaixingchen/brutxui-vue3.git
cd brutxui-vue3
pnpm install
```

### 场景匹配的最小化自检

开发阶段**严禁无脑运行全量 `pnpm test` 或 `lint`**。请依据触碰领域运行针对性检查：

| 变动领域 | 推荐自检命令 | 说明 |
| --- | --- | --- |
| 业务逻辑 / 组件 / 函数 | `pnpm --filter <pkg> test <相对路径>`<br>`pnpm exec eslint <file> --fix` | 运行局部单元测试与代码风格修复 |
| 类型接口 / 跨包导出 | `pnpm --filter <pkg> typecheck` | 验证 TS 严格类型与接口兼容 |
| 样式 / 令牌 / 导出 / 依赖 | `pnpm check:contracts` | 静态契约并发 6 合 1 门禁（~2s，全绿放行） |
| 文档 / 规范 / 技能 / 链接 | `pnpm check:docs` | 文档健康度并发门禁（~0.4s，加 `--fix` 自动纠偏链接） |

---

## 脚手架（生成组件与页面）

在**根目录**下运行脚手架指令，严禁手动从零拼装基础骨架文件：

```bash
pnpm generate:component    # 交互式生成新组件骨架（包含组件、variants 变体与测试文件）
pnpm generate:composable   # 生成 Composition API 组合式函数骨架
pnpm generate:page         # 生成文档演示页面
```

---

## 代码红线与架构约定

提交代码前请确保严格遵守以下约定：

1. **变体隔离**：组件的变体逻辑必须提取到同目录下的 `*-variants.ts`，组件通过 `import` 引入，严禁在 `.vue` 内联定义。
2. **类名合并**：必须使用 `computed()` 包裹 `cn(...)` 计算类名，严禁在 `<template>` 内联直接调用 `cn()`。
3. **原语复用**：以 `reka-ui` 无头原语为基础，优先复用库内已有组件（如 `Button` 代替 `<button>`，`Input` 代替 `<input>`），严禁用原生 HTML 元素替代。
4. **状态只读**：Composable 内部状态可变，但向外导出的返回值边界必须用 `readonly()` 或 `DeepReadonly()` 保护。
5. **设计令牌单一信源**：主题设计令牌只能在 `packages/shared/src/design-tokens.ts` 中修改，禁止手动编辑 `styles.css` 中的 `@theme` 生成块，亦严禁创建 `tailwind.config.js`。修改后运行 `pnpm generate:tokens` 即可同步。

---

## 提交规范（Conventional Commits）

### 提交信息格式

```text
<type>(<scope>): <简短描述>

<详细描述（可选）>
```

**类型（type）**：

| 类型 | 说明 | 示例场景 |
| :--- | :--- | :--- |
| `feat` | 新功能 | 新增组件、新增核心属性 |
| `fix` | 缺陷修复 | 修复交互 bug、修复样式计算错误 |
| `refactor` | 重构 | 内部结构调整，不改变外部功能 |
| `docs` | 文档变更 | 文档补充、示例更新、修正拼写 |
| `style` | 格式调整 | 代码格式化、缩进调整（由 ESLint 保证） |
| `test` | 测试补充 | 新增或补全单元测试、a11y 测试 |
| `chore` | 构建/工具 | 升级依赖、门禁脚本调整 |
| `perf` | 性能优化 | 减少无谓渲染、优化响应式计算 |
| `ci` | CI/CD | GitHub Actions 工作流调整 |

**范围（scope）**：`ui` | `cli` | `docs` | `registry` | `shared` | `deps`

---

## Pull Request 自检流程

提交 PR 前，请在本地运行对应领域的质量门禁，确保检查全绿：

- **业务代码修改**：运行对应包局部测试 `pnpm --filter <pkg> test <path>`，且无 Lint 违规；
- **类型或契约调整**：运行 `pnpm --filter <pkg> typecheck` 与 `pnpm check:contracts`；
- **文档与示例变动**：运行 `pnpm check:docs`；
- **提交信息格式**：符合 Conventional Commits 规范。

---

## 了解系统架构

在参与核心架构改造或新增关键能力前，推荐深入阅读仓库内的常青架构文档：
- [项目架构总览](https://github.com/lidaixingchen/brutxui-vue3/blob/main/docs/architecture/%E9%A1%B9%E7%9B%AE%E6%9E%B6%E6%9E%84%E6%80%BB%E8%A7%88.md)：了解各包边界与依赖拓扑
- [分发与公开 API 契约](https://github.com/lidaixingchen/brutxui-vue3/blob/main/docs/architecture/%E5%88%86%E5%8F%91%E4%B8%8E%E5%85%AC%E5%BC%8FAPI%E5%A5%91%E7%BA%A6.md)：双轨分发模型与内部 helper 边界
- [生成与构建机制](https://github.com/lidaixingchen/brutxui-vue3/blob/main/docs/architecture/%E7%94%9F%E6%88%90%E4%B8%8E%E6%9E%84%E5%BB%BA%E6%9C%BA%E5%88%B6.md)：设计令牌编译与暂存区一致性快照

---

## 报告问题

若发现 Bug 或有新特性建议，欢迎在 [GitHub Issues](https://github.com/lidaixingchen/brutxui-vue3/issues) 提交反馈，请附带清晰的复现步骤或最小可重现环境（StackBlitz / CodeSandbox）。
