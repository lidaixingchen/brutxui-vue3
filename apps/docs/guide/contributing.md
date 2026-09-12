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
- pnpm 10+（仓库包管理器限定为 pnpm，严禁使用 npm 或 yarn）
- Git

### 克隆与安装

```bash
git clone https://github.com/lidaixingchen/brutxui-vue3.git
cd brutxui-vue3
pnpm install
```

### 常用高频指令

```bash
pnpm build          # Turbo 并行构建所有包
pnpm lint           # 全局代码检查与格式修复
pnpm typecheck      # 全局严格类型检查
pnpm test           # 运行所有子包单元测试
pnpm test:ssr       # 服务端渲染（SSR）兼容性测试
```

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

提交 PR 前，请在本地运行针对性的质量门禁，确保所有检查绿灯通过：

```bash
# 1. 静态契约并发 6 合 1 门禁（样式/令牌/导出/依赖一致性校验）
pnpm check:contracts

# 2. 文档健康度门禁（死链/格式/规范检查）
pnpm check:docs

# 3. 严格类型检查
pnpm typecheck

# 4. 单元测试
pnpm test
```

### PR 检查清单

- [ ] 代码通过 `pnpm check:contracts`
- [ ] 文档通过 `pnpm check:docs`
- [ ] 全局类型检查通过 `pnpm typecheck`
- [ ] 相关测试通过 `pnpm test`
- [ ] 提交信息遵循 Conventional Commits 规范

---

## 报告问题

若发现 Bug 或有新特性建议，欢迎在 [GitHub Issues](https://github.com/lidaixingchen/brutxui-vue3/issues) 提交反馈，请附带清晰的复现步骤或最小可重现环境（StackBlitz / CodeSandbox）。
