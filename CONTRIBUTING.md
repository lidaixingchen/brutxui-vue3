# 贡献指南

感谢你抽出时间为 Brutx 做贡献。本项目专注于为 Vue 3 + Tailwind CSS 构建大胆、无障碍的新粗野主义组件系统。

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
3. **编译注册表 JSON**：
   运行以下脚本，自动解析、解析依赖并将 Vue 代码打包为注册表 JSON 文件：

   ```bash
   pnpm --filter brutx-registry-vue build
   ```

4. 提交 `packages/registry/registry/` 下生成的 JSON 文件。

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
