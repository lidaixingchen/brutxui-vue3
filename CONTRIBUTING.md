# 贡献指南

感谢你抽出时间为 Brutx 做贡献。本项目专注于为 Vue 3 + Tailwind CSS 构建大胆、无障碍的新粗野主义组件系统。

---

## Commit 规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范，请确保您的 commit message 符合以下格式：

```text
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type 类型

| Type | 说明 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码风格（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建系统或外部依赖变更 |
| `ci` | CI 配置变更 |
| `chore` | 其他杂项 |
| `revert` | 回滚之前的 commit |
| `release` | 版本发布（不出现在 CHANGELOG 中） |

### Scope 范围

Scope 是可选的，用于标识变更影响的包：

| Scope | 说明 |
| --- | --- |
| `ui` | 影响 `packages/ui` |
| `cli` | 影响 `packages/cli` |
| `docs` | 影响文档 |
| `registry` | 影响注册表 |
| `shared` | 影响共享包 |
| `theme` | 影响主题 |

### 示例

```bash
# 新功能
feat(ui): 新增 ColorPicker 组件
feat(cli): 新增 doctor 命令

# Bug 修复
fix(cli): 修复 Windows 下路径分隔符问题
fix(ui): 修复 Button 在暗色模式下的样式

# 文档
docs: 更新主题实验室文档
docs(ui): 更新 Button 组件使用说明

# 重构
refactor(ui)!: 重命名 Button variant 属性

# Breaking Change
feat(ui)!: change Button API
```

### Breaking Changes

有两种方式标记 Breaking Change：

1. **在 type 后加 `!`**：`feat(ui)!: change Button API`
2. **在 commit body 中写 `BREAKING CHANGE:`**：

```
feat(ui): change Button API

BREAKING CHANGE: Button 的 variant 属性重命名为 type
```

---

## 开发环境设置

本项目是使用 **pnpm workspaces** 管理的 monorepo。

### 1. 前置条件

- **Node.js** >= 22.5.0（推荐，pnpm 11.x 依赖 `node:sqlite` 内置模块）
- **Node.js** >= 18.12.0（最低要求，仅支持 pnpm 9.x）
- **pnpm** >= 9.0.0（推荐 11.x）

> **注意：** pnpm 11 需要 Node.js 22.5+，pnpm 9 可在 Node.js 18.12+ 上运行。如果使用 pnpm 9，需要在 `.npmrc` 中移除 `allowBuilds` 配置。

### 2. 快速开始

```bash
# 克隆仓库
git clone https://github.com/lidaixingchen/brutxui-vue3.git
cd brutxui-vue3

# 安装工作区依赖
pnpm install

# 构建所有包（UI、CLI、注册表和文档）
pnpm build
```

---

## Monorepo 包结构

- `packages/ui`：核心 Vue 3 组件包。
- `packages/cli`：CLI 工具 (`brutx-vue`)，用于项目初始化和组件安装。
- `packages/registry`：组件分发注册表，包含编译后的 JSON 模式。
- `apps/docs`：VitePress 文档站点。

---

## 添加或修改组件

我们使用类似 shadcn/ui 的**注册表架构**。组件以 JSON 文件的形式动态分发。

添加新组件（例如 `button`）的步骤：

1. **实现组件**，放在 `packages/ui/src/components/` 下。
2. **定义组件元数据**，在 `packages/cli/src/lib/constants.ts` 的 `COMPONENTS` 对象中添加，并声明所需的 npm `dependencies`。
3. **登记到注册表映射表**，在 `packages/registry/scripts/component-files.ts` 的 `COMPONENT_FILES` 中追加条目，声明组件的 `files`（及 `composables`、`locales` 等依赖）。未登记的组件不会生成 JSON、不会进入 `index.json`，CLI 也无法安装。
4. **编译注册表 JSON**：
   运行以下脚本，从源码读取、重写导入路径、提取依赖并生成注册表 JSON：

   ```bash
   pnpm --filter brutx-registry-vue build
   ```

5. **校验注册表**：

   ```bash
   pnpm --filter brutx-registry-vue validate
   ```

   会执行三道一致性校验（源码目录 ↔ `COMPONENT_FILES`、`{name}.json` ↔ `index.json`、字段完整性）。

6. 提交 `packages/registry/registry/` 下生成的 JSON 文件。

---

## 本地测试 CLI

你可以在测试项目中本地测试 CLI：

1. 构建 CLI 包：

   ```bash
   pnpm --filter brutx-vue build
   ```

2. 在工作区内或外创建临时文件夹（例如 `temp-test-project`）。

3. 从测试文件夹运行编译后的 CLI：

   ```bash
   # 初始化 CLI
   node ../packages/cli/dist/index.js init --defaults

   # 使用本地注册表添加组件
   node ../packages/cli/dist/index.js add button combobox --registry ../packages/registry/registry
   ```

---

## 测试与代码检查

推送更改前，请确保所有检查通过：

- **类型检查**：`pnpm typecheck`
- **代码检查**：`pnpm lint`
- **单元/集成测试**：`pnpm test`

如果改动会影响发布产物、CLI 安装、注册表 JSON、文档构建或包内容，请在本地运行完整发布门禁：

```bash
pnpm release:check
```

发布 tag 检查会读取 `RELEASE_TAG` 或 GitHub Actions 的 `GITHUB_REF_NAME`，并要求 tag 与 UI 包版本一致，例如：

```bash
RELEASE_TAG=v0.6.6 pnpm release:check
```

### 视觉回归基线

视觉测试基线必须在与 CI 一致的 Ubuntu + Chromium + Inter 字体环境中生成。需要更新截图时，请手动触发 GitHub Actions 中的 `Update Visual Baselines` workflow，下载 `updated-visual-baselines` artifact，将其中 PNG 文件替换到 `packages/ui/visual/baselines/` 后再提交。不要直接提交本地 Windows 或 macOS 生成的视觉基线。
