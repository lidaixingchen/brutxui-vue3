# brutx-vue

> 将 Neo-Brutalist 风格的 Vue 3 UI 组件添加到你的项目中。
>
> [English](/packages/cli/README-en.md)

## 安装

运行 `brutx-vue` 需要 **Node.js 22.0+**。用户项目可使用 npm、yarn、pnpm 或 bun；本仓库开发和发布的维护环境要求另见根 README。

```bash
# 使用 pnpm
pnpm add -D brutx-vue

# 使用 npm
npm install -D brutx-vue

# 使用 yarn
yarn add -D brutx-vue

# 使用 bun
bun add -D brutx-vue
```

或无需安装直接运行：

```bash
npx brutx-vue@latest init
```

## 命令

| 命令 | 说明 |
| --- | --- |
| `brutx-vue init` | 在项目中初始化 BrutxUI 配置 |
| `brutx-vue add` | 将组件添加到项目中 |
| `brutx-vue update` | 将已安装组件更新到注册表最新版本 |
| `brutx-vue list` | 列出已安装的组件 |
| `brutx-vue info` | 查看组件详细信息 |
| `brutx-vue remove` | 移除已安装的组件 |
| `brutx-vue create` | 创建预配置好的新 Vue 3 项目 |
| `brutx-vue doctor` | 检查项目健康状态并诊断配置问题 |
| `brutx-vue diff` | 对比本地组件与注册表最新版本差异 |

### `brutx-vue init`

在你的项目中初始化 BrutxUI。该命令会执行以下操作：

1. 检测项目类型（Vite + Vue、Nuxt 等）
2. 检测 Tailwind CSS 版本（v3 / v4）
3. 自动发现 Tailwind 配置、CSS 入口文件及 `tsconfig.json` 中的路径别名
4. 交互式引导完成配置
5. 生成 `components.json` 配置文件
6. 创建 `cn()` 工具函数（`clsx` + `tailwind-merge`）
7. 将 Neo-Brutalist CSS 设计令牌和工具类注入全局 CSS
8. 安装基础依赖（`clsx`、`tailwind-merge`、`class-variance-authority`、`@lucide/vue`、`reka-ui`）
9. 自动检测 monorepo 工作区，支持将依赖安装到工作区根目录

```bash
brutx-vue init [options]
```

| 选项 | 说明 |
| --- | --- |
| `-y, --yes` | 跳过确认提示 |
| `-d, --defaults` | 使用默认配置 |
| `-c, --cwd <cwd>` | 指定工作目录 |
| `-f, --force` | 强制覆盖已有配置 |
| `-s, --silent` | 静默输出 |
| `--vscode` | 生成 VS Code snippets |
| `--workspace-root <path>` | 指定工作区根目录（默认自动检测） |

### `brutx-vue add [components...]`

将组件添加到你的项目中。该命令会执行以下操作：

1. 验证项目已初始化（`components.json` 存在）
2. 递归解析组件依赖（拓扑排序）
3. 写入组件源码文件并替换导入别名
4. 安装所需的 npm 依赖

```bash
# 添加指定组件
brutx-vue add button card input

# 添加全部组件
brutx-vue add --all

# 交互式选择
brutx-vue add
```

| 选项 | 说明 |
| --- | --- |
| `-y, --yes` | 跳过确认提示 |
| `-a, --all` | 添加全部可用组件 |
| `-o, --overwrite` | 覆盖已有文件 |
| `-p, --path <path>` | 自定义组件安装路径 |
| `-c, --cwd <cwd>` | 指定工作目录 |
| `-s, --silent` | 静默输出 |
| `--dry-run` | 模拟运行，不写入文件 |
| `-r, --registry <registry>` | 自定义注册表路径或 URL |
| `--no-cache` | 跳过注册表缓存 |
| `--vscode` | 更新 VS Code snippets |

#### 版本锁定

使用 `@` 语法将组件锁定到指定版本：

```bash
brutx-vue add button@1.2.0
```

这会映射到注册表中对应的 GitHub 分支。

### `brutx-vue update [components...]`

将已安装组件更新到注册表最新版本。自动检测本地修改并提供选择性更新。

```bash
# 更新指定组件
brutx-vue update button card

# 更新全部过期组件
brutx-vue update --all

# 模拟运行
brutx-vue update --dry-run
```

| 选项 | 说明 |
| --- | --- |
| `-a, --all` | 更新全部过期组件 |
| `-y, --yes` | 跳过确认提示 |
| `-c, --cwd <cwd>` | 指定工作目录 |
| `-s, --silent` | 静默输出 |
| `--dry-run` | 仅显示可更新组件，不写入文件 |
| `-r, --registry <registry>` | 自定义注册表路径或 URL |
| `--no-cache` | 跳过注册表缓存 |

### `brutx-vue list`

列出项目中已安装的所有组件，包括文件数量和依赖信息。

```bash
brutx-vue list
brutx-vue list --json
```

| 选项 | 说明 |
| --- | --- |
| `-c, --cwd <cwd>` | 指定工作目录 |
| `--json` | 以 JSON 格式输出 |
| `-s, --silent` | 静默输出 |

### `brutx-vue info <component>`

查看指定组件的详细信息，包括注册表文件、依赖、本地安装状态等。

```bash
brutx-vue info button
brutx-vue info button --json
```

| 选项 | 说明 |
| --- | --- |
| `-c, --cwd <cwd>` | 指定工作目录 |
| `--json` | 以 JSON 格式输出 |
| `-r, --registry <registry>` | 自定义注册表路径或 URL |
| `-s, --silent` | 静默输出 |

### `brutx-vue remove <components...>`

移除已安装的组件。删除组件目录并自动清理不再被其他组件引用的孤立文件（composables、locales、lib 等）。

```bash
# 移除单个组件
brutx-vue remove button

# 移除多个组件
brutx-vue remove button card input

# 模拟运行
brutx-vue remove button --dry-run
```

| 选项 | 说明 |
| --- | --- |
| `-y, --yes` | 跳过确认提示 |
| `-c, --cwd <cwd>` | 指定工作目录 |
| `--dry-run` | 仅显示将删除的文件，不实际删除 |
| `-s, --silent` | 静默输出 |

### `brutx-vue create <project-name>`

快速创建一个预配置好的 Vue 3 + BrutxUI 项目。自动完成脚手架搭建、依赖安装和 BrutxUI 初始化。

```bash
# 使用默认模板（Vite + Vue 3 + TypeScript）
brutx-vue create my-app

# 使用 Nuxt 模板
brutx-vue create my-app --template nuxt

# 指定包管理器
brutx-vue create my-app --package-manager npm
```

| 选项 | 说明 |
| --- | --- |
| `-t, --template <template>` | 项目模板：`default`（Vite + Vue 3）或 `nuxt`（Nuxt 3） |
| `--package-manager <pm>` | 包管理器：`pnpm`、`npm`、`yarn`、`bun`（默认 `pnpm`） |
| `-c, --cwd <cwd>` | 指定项目创建目录 |
| `-y, --yes` | 跳过确认提示 |

### `brutx-vue doctor`

检查项目健康状态并诊断配置问题。验证 `components.json`、CSS 令牌、别名目录、依赖安装、`cn()` 函数等。支持自动修复。

```bash
# 检查项目状态
brutx-vue doctor

# 自动修复可修复的问题
brutx-vue doctor --fix

# 仅执行指定修复
brutx-vue doctor --fix-only AddConfigVersion

# JSON 格式输出
brutx-vue doctor --json
```

| 选项 | 说明 |
| --- | --- |
| `--cwd <cwd>` | 指定工作目录 |
| `--fix` | 自动修复所有可修复问题 |
| `--fix-only <fixId>` | 仅执行指定的修复项 |
| `--json` | 以 JSON 格式输出报告 |
| `-y, --yes` | 跳过确认提示 |
| `-s, --silent` | 静默输出 |

### `brutx-vue diff [components...]`

对比本地已安装组件与注册表最新版本的差异，生成 unified diff 报告。

```bash
# 对比指定组件
brutx-vue diff button

# 对比全部已安装组件
brutx-vue diff --all

# JSON 格式输出
brutx-vue diff --json
```

| 选项 | 说明 |
| --- | --- |
| `--all` | 对比全部已安装组件 |
| `--cwd <cwd>` | 指定工作目录 |
| `-r, --registry <registry>` | 自定义注册表路径 |
| `--json` | 以 JSON 格式输出 |
| `--no-cache` | 跳过注册表缓存 |
| `-s, --silent` | 静默输出 |

## 全局选项

以下选项适用于所有命令，需放在子命令之前：

```bash
brutx-vue [global-options] <command> [command-options]
```

| 选项 | 说明 | 默认值 |
| --- | --- | --- |
| `--verbose` | 显示详细错误输出（等价于 `-v`） | `false` |
| `--dry-run` | 全局 dry-run：模拟所有写操作但不落盘 | `false` |
| `--verbose-level <level>` | verbose 等级（`1`=步骤、`2`=缓存/网络细节、`3`=堆栈） | `0` |
| `-v` | 等价于 `--verbose-level 1` | — |
| `-vv` | 等价于 `--verbose-level 2` | — |
| `-vvv` | 等价于 `--verbose-level 3` | — |

### 全局 dry-run

`--dry-run` 全局 flag 激活所有命令的 dry-run 语义，也可通过 `BRUTX_DRY_RUN=1` 环境变量激活：

```bash
# 以下两条等价
BRUTX_DRY_RUN=1 brutx-vue add button
brutx-vue --dry-run add button
```

### verbose 等级

通过 `-v`/`-vv`/`-vvv` 或 `BRUTX_VERBOSE=<n>` 控制输出详细程度：

| 等级 | 标签 | 含意 |
| --- | --- | --- |
| `1` | `[STEP]` | 步骤级 |
| `2` | `[DETAIL]` | 缓存/网络细节 |
| `3` | `[TRACE]` | 堆栈/调试细节 |

## 审计日志

`add`/`remove`/`update`/`diff` 命令执行后会在 `.brutx/audit.log` 追加一条 JSONL 记录，包含时间戳、命令、组件、源、成功状态等信息。`doctor` 会读取最近 5 条失败记录作为诊断线索。

## 配置文件

运行 `init` 后，项目根目录会生成 `components.json`：

```json
{
  "$schema": "https://brutx-vue.com/schema.json",
  "$version": 1,
  "style": "brutalism",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/assets/main.css"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "composables": "@/composables"
  }
}
```

- `$version` — 配置文件版本号，用于 `doctor` 命令检测是否需要迁移
- `aliases.composables` — 组合式函数的导入别名路径

## 项目检测

CLI 会自动检测以下信息：

| 信号 | 检测结果 |
| --- | --- |
| `nuxt.config.*` | Nuxt 项目 |
| `vite.config.*` + `vue` | Vite + Vue（`src/` 目录） |
| 其他 Vue 项目 | Vite + Vue |
| Lockfile（`pnpm-lock.yaml`、`yarn.lock`、`bun.lockb`、`package-lock.json`） | 包管理器 |

## 安全

- 所有文件操作均通过 `isSafePath()` 校验，防止路径穿越攻击
- 注册表本地读取时检查工作目录边界
- 组件文件路径在写入前经过规范化和验证
- `verifyWrittenPath()` 在写入时验证文件实际路径，防御 TOCTOU（Time-of-Check-to-Time-of-Use）攻击
- 配置文件版本迁移机制，`doctor --fix` 可自动升级旧版本配置

## 开发

```bash
# 构建
pnpm build

# 监听模式
pnpm dev

# 运行测试
pnpm test

# 本地运行 CLI
pnpm start
```

## 许可证

基于 [MIT 许可证](../../LICENSE) 开源。
