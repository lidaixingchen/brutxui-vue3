# Brutx CLI 参考

Brutx CLI（`brutx`）是一个按需工具，用于项目初始化、样式配置和组件安装。

---

## 用法

通过 `npx` 执行命令：

```bash
npx brutx@latest [command] [options]
```

---

## 命令

### 1. `init`

在本地项目中初始化 Brutx 配置和样式系统。

```bash
npx brutx@latest init [options]
```

#### 功能说明
- 检测项目结构（Vite、Nuxt 等）和包管理器（npm、pnpm、yarn、bun）。
- 在根目录创建 `components.json`。
- 生成工具文件 `lib/utils.ts`，包含标准的类名合并辅助函数（`cn`）。
- 创建 `components/ui/` 目录。
- 将 Neo-Brutalist 样式和工具类（如 `.shadow-brutal`、`.border-3`）追加到全局 CSS 中。
- 安装基础依赖（`clsx`、`tailwind-merge`、`class-variance-authority`、`lucide-vue-next`）。

#### 选项
- `-y, --yes`：跳过所有确认提示，使用检测到的配置。
- `-d, --defaults`：使用默认 Tailwind 设置进行初始化。
- `-f, --force`：强制覆盖已有的配置文件。
- `-c, --cwd <cwd>`：覆盖目标工作目录（默认为 `process.cwd()`）。
- `-s, --silent`：抑制所有输出和加载动画日志。

---

### 2. `add`

将组件及其所有依赖添加到项目中。

```bash
npx brutx@latest add [components...] [options]
```

#### 功能说明
- 递归解析并下载所有子组件（`registryDependencies`）。
- 将匹配注册表默认值的导入路径替换为工作区的自定义别名（例如 `@/lib/utils` 替换为 `~/utils/cn`）。
- 写入组件文件并递归确保目标文件夹安全创建。
- 检测并安装所需的 npm 依赖。

#### 选项
- `-y, --yes`：如果未传入组件参数，跳过确认选择器。
- `-a, --all`：添加所有可用的 Brutx 组件。
- `-o, --overwrite`：如果本地组件文件已存在，则覆盖。
- `-p, --path <path>`：覆盖组件安装路径。
- `-c, --cwd <cwd>`：覆盖工作目录。
- `-s, --silent`：静默所有日志。
- `--dry-run`：模拟文件生成和依赖安装，不将文件写入磁盘（适用于试运行和测试配置）。
- `-r, --registry <registry>`：指定自定义注册表 URL 或本地文件路径，用于离线设置和测试。

---

## 配置文件（`components.json`）

CLI 在 `components.json` 中读写项目设置：

```json
{
  "$schema": "https://lidaixingchen.github.io/brutxui-vue3/schema.json",
  "style": "brutalism",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### 字段说明
- **`style`**：设计风格令牌（默认为 `"brutalism"`）。
- **`tailwind.config`**：Tailwind 配置文件的路径。
- **`tailwind.css`**：项目全局 CSS 文件的路径。
- **`aliases.components`**：指向组件目录的导入别名。
- **`aliases.utils`**：指向工具目录的导入别名。
