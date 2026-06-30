---
title: 贡献指南
description: 如何参与 BrutxUI 开发与贡献。
---

# 贡献指南

感谢你对 BrutxUI 的关注！以下是参与贡献的方式。

---

## 开发环境

### 前置要求

- Node.js 22.5+
- pnpm 11+
- Git

### 克隆与安装

```bash
git clone https://github.com/brutxui/brutxui-vue3.git
cd brutxui-vue3
pnpm install
```

### 常用命令

```bash
pnpm build          # 构建 UI 包
pnpm lint           # 代码检查
pnpm typecheck      # 类型检查
pnpm test           # 运行测试
pnpm test:watch     # 监视模式运行测试
pnpm release:check  # 发布前完整门禁
```

---

## 提交规范

### 分支命名

- `feat/xxx` — 新功能
- `fix/xxx` — 修复问题
- `docs/xxx` — 文档更新
- `refactor/xxx` — 重构

### 提交信息格式

```text
<type>(<scope>): <简短描述>

<详细描述（可选）>
```

**类型（type）**：

| 类型       | 说明                   | 示例场景                       |
| ---------- | ---------------------- | ------------------------------ |
| `feat`     | 新功能                 | 新增组件、新增 props           |
| `fix`      | 修复 bug               | 修复测试失败、修复样式问题     |
| `refactor` | 重构（不改变功能）     | 代码结构调整、重命名           |
| `docs`     | 文档变更               | 更新 README、组件文档          |
| `style`    | 格式调整（不影响逻辑） | 代码格式化、空格调整           |
| `test`     | 测试相关               | 新增测试、修复测试             |
| `chore`    | 构建/工具/依赖         | 升级依赖、配置变更             |
| `perf`     | 性能优化               | 减少渲染开销、优化计算         |
| `ci`       | CI/CD 配置             | GitHub Actions 变更            |
| `build`    | 构建系统变更           | Vite 配置、打包优化            |
| `revert`   | 回滚提交               | 回滚某个功能                   |

**范围（scope）**：`ui` | `cli` | `docs` | `registry` | `shared` | `deps`（可选）

**示例**：

```text
fix(ui): 修复 Button 组件 hover 状态样式
docs: 更新 README 安装说明
chore(deps): 升级 Vue 到 3.5.13
```

::: tip 注意
描述请使用中文，简洁明了，不超过 50 字符。
:::

---

## 添加新组件

### 1. 创建组件文件

```text
packages/ui/src/components/
├── my-component/
│   ├── MyComponent.vue
│   ├── my-component-variants.ts
│   └── index.ts
```

### 2. 注册到注册表

在 `packages/registry/scripts/component-files.ts` 中添加组件映射。

### 3. 编写文档

在 `apps/docs/components/` 中创建文档，遵循 [组件文档模板](/docs/COMPONENT_DOC_TEMPLATE.md)。

### 4. 编写测试

在组件目录中添加 `*.test.ts` 文件。

### 5. 提交 PR

确保通过所有检查：

```bash
pnpm release:check
```

---

## Pull Request 流程

1. Fork 本仓库
2. 创建你的特性分支（`git checkout -b feat/amazing-feature`）
3. 提交更改（`git commit -m 'feat: add amazing feature'`）
4. 推送到分支（`git push origin feat/amazing-feature`）
5. 创建 Pull Request

### PR 检查清单

- [ ] 代码通过 `pnpm lint`
- [ ] 代码通过 `pnpm typecheck`
- [ ] 新功能包含测试
- [ ] 文档已更新（如适用）
- [ ] 提交信息符合规范

---

## 报告问题

在 [GitHub Issues](https://github.com/brutxui/brutxui-vue3/issues) 提交问题，请包含：

- 清晰的标题和描述
- 复现步骤
- 期望行为与实际行为
- 环境信息
- 最小复现链接（推荐）

---

## 行为准则

- 尊重每一位参与者
- 接受建设性批评
- 专注于对社区最有利的事情
- 对他人表示同理心
