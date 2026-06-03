# brutx-vue

> 将 Neo-Brutalist 风格的 Vue 3 UI 组件添加到你的项目中。
>
> [English](./README-en.md)

## 安装

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

### `brutx-vue init`

在你的项目中初始化 BrutxUI。该命令会执行以下操作：

1. 检测项目类型（Vite + Vue、Nuxt 等）
2. 检测 Tailwind CSS 版本（v3 / v4）
3. 自动发现 Tailwind 配置、CSS 入口文件及 `tsconfig.json` 中的路径别名
4. 交互式引导完成配置
5. 生成 `components.json` 配置文件
6. 创建 `cn()` 工具函数（`clsx` + `tailwind-merge`）
7. 将 Neo-Brutalist CSS 设计令牌和工具类注入全局 CSS
8. 安装基础依赖（`clsx`、`tailwind-merge`、`class-variance-authority`、`lucide-vue-next`、`reka-ui`）

```bash
brutx-vue init [options]
```

| 选项                  | 说明                 |
| --------------------- | -------------------- |
| `-y, --yes`           | 跳过确认提示         |
| `-d, --defaults`      | 使用默认配置         |
| `-c, --cwd <cwd>`     | 指定工作目录         |
| `-f, --force`         | 强制覆盖已有配置     |
| `-s, --silent`        | 静默输出             |

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

| 选项                            | 说明                       |
| ------------------------------- | -------------------------- |
| `-y, --yes`                     | 跳过确认提示               |
| `-a, --all`                     | 添加全部可用组件           |
| `-o, --overwrite`               | 覆盖已有文件               |
| `-p, --path <path>`             | 自定义组件安装路径         |
| `-c, --cwd <cwd>`               | 指定工作目录               |
| `-s, --silent`                  | 静默输出                   |
| `--dry-run`                     | 模拟运行，不写入文件       |
| `-r, --registry <registry>`     | 自定义注册表路径或 URL     |

#### 版本锁定

使用 `@` 语法将组件锁定到指定版本：

```bash
brutx-vue add button@1.2.0
```

这会映射到注册表中对应的 GitHub 分支。

## 配置文件

运行 `init` 后，项目根目录会生成 `components.json`：

```json
{
  "$schema": "https://brutx-vue.com/schema.json",
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/assets/main.css"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## 项目检测

CLI 会自动检测以下信息：

| 信号                                                       | 检测结果              |
| ---------------------------------------------------------- | --------------------- |
| `nuxt.config.*`                                            | Nuxt 项目             |
| `vite.config.*` + `vue`                                    | Vite + Vue（`src/` 目录） |
| 其他 Vue 项目                                              | Vite + Vue            |
| Lockfile（`pnpm-lock.yaml`、`yarn.lock`、`bun.lockb`、`package-lock.json`） | 包管理器              |

## 安全

- 所有文件操作均通过 `isSafePath()` 校验，防止路径穿越攻击
- 注册表本地读取时检查工作目录边界
- 组件文件路径在写入前经过规范化和验证

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

MIT
