---
title: CLI
description: 了解 brutx-vue 命令行工具的使用方法、工作流与配置规范
---

# CLI

`brutx-vue` 是 BrutxUI 官方命令行工具，帮助你在项目中快速创建项目、初始化配置、管理组件生命周期，并提供企业级健康体检与自愈能力。

## 概览

CLI 支持通过包管理器直接免安装运行：

```bash
npx brutx-vue@latest <command>
```

你也可以选择将其作为开发依赖安装到本地项目中：

```bash
pnpm add -D brutx-vue
# 或
npm install -D brutx-vue
```

---

## 项目起步

### brutx-vue create

从零创建一个预配置好 BrutxUI 的全新 Vue 3 项目：

```bash
npx brutx-vue@latest create <project-name>
```

create 命令会自动拉取模板、搭建项目目录骨架、安装必要依赖并自动执行 `init` 初始化。

#### 示例

创建默认 Vite + Vue 3 + TypeScript 项目：

```bash
npx brutx-vue@latest create my-app
```

使用 Nuxt 模板并指定使用 bun 包管理器：

```bash
npx brutx-vue@latest create my-nuxt-app --template nuxt --package-manager bun
```

#### 选项

| 标志 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `-t, --template <template>` | 项目模板（`default`、`nuxt`） | `default` |
| `--package-manager <pm>` | 包管理器（`pnpm`、`npm`、`yarn`、`bun`） | `pnpm` |
| `-c, --cwd <path>` | 设置目标工作目录 | 当前目录 |
| `-y, --yes` | 跳过交互提示，使用默认配置 | `false` |

---

### brutx-vue init

在现有的 Vue 3 项目中初始化 BrutxUI 配置：

```bash
npx brutx-vue@latest init
```

init 命令将自动完成以下初始化步骤：

1. 检测项目框架（Vite + Vue、Nuxt 等）与 Tailwind CSS 版本（v4 / v3）
2. 自动探测全局 CSS 入口文件及 `tsconfig.json` 别名配置
3. 安装核心基础依赖（`reka-ui`、`class-variance-authority`、`clsx`、`tailwind-merge`、`@lucide/vue`）
4. 在 `src/lib/utils.ts` 中生成 `cn()` 工具函数
5. 在全局样式中注入 Neo-Brutalist 设计令牌与工具类标记块
6. 生成 `components.json` 配置文件并创建组件目录结构
7. 自动识别 Monorepo 工作区（pnpm / lerna / turbo），支持根目录依赖沉降

#### 选项

| 标志 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `-y, --yes` | 跳过交互提示并使用检测到的默认值 | `false` |
| `-d, --defaults` | 使用官方默认推荐配置 | `false` |
| `-c, --cwd <path>` | 设置工作目录 | 当前目录 |
| `-f, --force` | 强制覆盖已有的 `components.json` 与样式注入 | `false` |
| `-s, --silent` | 静默输出模式 | `false` |
| `--vscode` | 自动生成 VS Code 智能代码片段（Snippets） | `false` |
| `--workspace-root <path>` | 显式指定 Monorepo 工作区根目录路径 | 自动检测 |

---

## 组件生命周期管理

### brutx-vue add

向项目中添加组件。命令会自动分析并按拓扑排序递归下载组件的所有依赖文件（包括子组件、composable 与 locale）：

```bash
npx brutx-vue@latest add [components...]
```

若未指定组件名称，CLI 将启动交互式多选列表供你勾选。

#### 示例

添加单个或多个组件：

```bash
# 添加单个组件
npx brutx-vue@latest add button

# 一次性添加多个组件
npx brutx-vue@latest add button card dialog input
```

添加所有可用组件：

```bash
npx brutx-vue@latest add --all
```

#### 选项

| 标志 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `-a, --all` | 添加注册表中的所有可用组件 | `false` |
| `-y, --yes` | 跳过确认提示 | `false` |
| `-o, --overwrite` | 强制覆盖已存在的组件文件 | `false` |
| `-m, --merge` | 当组件已存在时，使用 3-way merge 智能合并本地修改 | `false` |
| `-p, --path <path>` | 指定组件自定义添加路径（防路径穿越校验） | 别名解析路径 |
| `-c, --cwd <path>` | 设置工作目录 | 当前目录 |
| `-s, --silent` | 静默输出 | `false` |
| `--dry-run` | 演练模拟添加，仅打印写入计划，不触碰磁盘 | `false` |
| `-r, --registry <url>` | 指定临时注册表路径或 URL | 官方源 |
| `--no-cache` | 跳过本地注册表缓存，强制从远端拉取 | `false` |
| `--offline` | 离线模式：只读缓存，禁止发起网络请求 | `false` |
| `--vscode` | 更新 VS Code 代码片段库 | `false` |
| `--filter <package>` | **Monorepo**：指定组件安装的目标工作区子包 | — |
| `--shared` | **Monorepo**：指定安装到拓扑中的共享 UI 基础包 | `false` |

#### 版本锁定与 `@version` 语法

CLI 支持使用 `@` 语法锁定拉取特定版本的组件：

```bash
npx brutx-vue@latest add button@1.2.0
```

- **与自定义 Registry 配合**：`@version` 支持 GitHub raw URL 结构的注册表（形如 `https://raw.githubusercontent.com/{owner}/{repo}/{ref}/...`），CLI 会将 `{ref}` 段动态替换为请求版本，便于从个人 fork 或指定 tag 拉取。
- **默认源行为**：官方默认源为 Release 资产构建产物，默认始终拉取最新构建（latest）。
- **版本冲突提示**：当本地已安装组件版本与请求版本不符时，CLI 会输出告警提示（不阻断操作）。

---

### brutx-vue list

列出当前项目中所有已安装的组件、所含文件数量及其运行时依赖：

```bash
npx brutx-vue@latest list
```

#### 检查更新

传入 `--check-updates` 时，CLI 会联网核对远端注册表的组件指纹，标记出有可用更新的组件：

```bash
npx brutx-vue@latest list --check-updates
```

#### 选项

| 标志 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `-c, --cwd <path>` | 设置工作目录 | 当前目录 |
| `--check-updates` | 对比远端注册表检查可用更新 | `false` |
| `--json` | 输出结构化 JSON 格式数据 | `false` |
| `-r, --registry <url>` | 指定检查更新时所用的注册表路径或 URL | 配置源 |
| `--no-cache` | 检查更新时跳过缓存，直连注册表 | `false` |
| `--offline` | 仅使用本地缓存核验更新 | `false` |
| `-s, --silent` | 静默输出 | `false` |

---

### brutx-vue info

查看指定组件的元数据详情（依赖树、注册表文件清单、分类、示例及本地安装状态）：

```bash
npx brutx-vue@latest info <component>
```

#### 选项

| 标志 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `-c, --cwd <path>` | 设置工作目录 | 当前目录 |
| `--json` | 以 JSON 格式输出组件详细信息 | `false` |
| `-r, --registry <url>` | 指定查询的注册表路径或 URL | 配置源 |
| `--offline` | 离线模式查询（基于缓存） | `false` |
| `-s, --silent` | 静默输出 | `false` |

---

### brutx-vue diff

对比本地已安装组件与远端注册表最新版本之间的代码差异：

```bash
npx brutx-vue@latest diff [components...]
```

#### 示例

对比单个组件或多个组件：

```bash
npx brutx-vue@latest diff button
npx brutx-vue@latest diff button card dialog
```

对比所有已安装组件并输出差异概览：

```bash
npx brutx-vue@latest diff --all
```

#### 选项

| 标志 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `--all` | 对比所有已安装的组件 | `false` |
| `-c, --cwd <path>` | 设置工作目录 | 当前目录 |
| `-r, --registry <url>` | 指定对比的目标注册表路径或 URL | 配置源 |
| `--json` | 输出包含完整补丁（patch）的 JSON 报告 | `false` |
| `--no-cache` | 跳过缓存拉取最新远端代码 | `false` |
| `--offline` | 只读缓存进行对比 | `false` |
| `-s, --silent` | 静默输出 | `false` |

---

### brutx-vue update

基于三方合并（3-Way Merge）智能合并远程更新，在升级组件的同时最大程度保留你在本地所做的定制代码：

```bash
npx brutx-vue@latest update [components...]
```

#### 示例与常用场景

更新指定组件：

```bash
npx brutx-vue@latest update button card
```

更新所有存在版本漂移的过期组件：

```bash
npx brutx-vue@latest update --all
```

演练预览更新结果而不写入磁盘：

```bash
npx brutx-vue@latest update --dry-run
```

#### 冲突处理策略选项

当本地修改与远端更新发生代码冲突时，可通过策略参数控制合并行为：

| 标志 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `-a, --all` | 更新所有过期的已安装组件 | `false` |
| `-y, --yes` | 跳过更新确认提示 | `false` |
| `-c, --cwd <path>` | 设置工作目录 | 当前目录 |
| `--dry-run` | 演练模拟更新，不修改实际文件 | `false` |
| `--across-versions` | 允许跨越版本锁定（pinned）强制升级组件 | `false` |
| `--ours` | **冲突策略**：发生冲突时优先保留本地代码修改 | `false` |
| `--theirs` | **冲突策略**：发生冲突时优先采纳远端更新代码 | `false` |
| `-f, --force` | **覆盖模式**：跳过三方合并，强制全量覆盖本地文件 | `false` |
| `--ci` | **CI 门禁**：在持续集成中运行，出现未决冲突时直接 exit 1 阻断 | `false` |
| `-r, --registry <url>` | 指定更新注册表 URL | 配置源 |
| `--no-cache` | 跳过缓存强制下载最新内容 | `false` |
| `--offline` | 离线模式更新 | `false` |
| `-s, --silent` | 静默输出 | `false` |

---

### brutx-vue remove

从项目中安全移除组件，自动清理关联目录并检测孤儿依赖：

```bash
npx brutx-vue@latest remove <components...>
```

remove 命令不仅删除组件源码目录，还会递归反查项目的依赖拓扑，检测是否有不再被任何组件引用的共享 composables、locales 或工具函数，并引导确认是否同步清理。

#### 选项

| 标志 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `-y, --yes` | 跳过二次确认提示 | `false` |
| `-c, --cwd <path>` | 设置工作目录 | 当前目录 |
| `--dry-run` | 演练模拟删除，仅列出将要被清理的文件清单 | `false` |
| `-s, --silent` | 静默输出 | `false` |

---

## 运维治理与健康体检

### brutx-vue doctor

项目全方位健康诊断与自动修复引擎。能够排查配置文件合法性、Tailwind 样式令牌、目录结构、依赖完备性及组件防篡改完整性：

```bash
npx brutx-vue@latest doctor [options]
```

#### 检查分类涵盖
- **env**：运行环境与包管理器检测
- **config**：`components.json` 架构、版本号与路径别名有效性
- **tailwind**：Tailwind CSS 版本、全局 CSS 入口及 `--brutal-*` 令牌注入状态
- **structure**：组件目录结构、`cn()` 工具函数存在性
- **integrity**：已安装组件内容哈希比对、文件完整性与审计日志健康度
- **custom**：用户自定义或第三方诊断插件规则

#### 高级诊断与 CI 门禁选项

| 标志 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `--fix` | 自动执行已知问题的自愈修复 | `false` |
| `--fix-only <fixId>` | 仅应用指定的修复项（见下文 Fix ID 表） | — |
| `--dry-run` | 配合 `--fix` 使用：输出修复计划预览（Plan Preview + Unified Diff），不落盘 | `false` |
| `--ci` | CI 模式：在持续集成环境中默认切换为 `github` 报告器 | `false` |
| `--reporter <type>` | 报告渲染器格式（`pretty`、`github`、`json`、`sarif`、`junit`） | `pretty` |
| `--fail-on <level>` | 细粒度阻断等级：在指定级别时以退出码 1 退出（`error`、`warn`、`drift`） | `error` |
| `--output-file <path>` | 将诊断报告写入指定文件路径（常用于保存 SARIF / JUnit 报告） | — |
| `--category <category>` | 仅运行指定分类的检查（`env`、`config`、`tailwind`、`structure`、`integrity`） | 全部 |
| `--rule <ruleId>` | 仅运行指定规则 ID 的诊断项 | 全部 |
| `--json` | 输出 JSON 格式诊断结果（等价于 `--reporter json`） | `false` |
| `--offline` | 跳过远程 Registry 源的网络可达性探测 | `false` |
| `--sbom` | 生成项目 CycloneDX 1.5 SBOM 物料清单后退出（详见[安全指南](/guide/security)） | `false` |
| `--sbom-output <path>` | 指定生成的 SBOM 文件输出路径 | `./brutx-sbom.json` |
| `-c, --cwd <path>` | 设置工作目录 | 当前目录 |
| `-y, --yes` | 自动确认修复操作 | `false` |
| `-s, --silent` | 静默输出 | `false` |

#### 可自动修复项（Fix ID 对照表）

使用 `--fix-only <fixId>` 时可传入以下标准 Fix ID：

| Fix ID | 问题场景 | 自动修复操作 |
| :--- | :--- | :--- |
| `add-schema` | `components.json` 缺少 `$schema` | 写入官方 Schema 校验 URL |
| `add-config-version` | 配置文件版本过期或缺失 | 升级为当前最新配置版本 `$version` |
| `set-style` | `style` 字段缺失 | 自动设置为 `brutalism` |
| `inject-css-tokens` | 全局 CSS 缺失 BrutxUI 令牌标记块 | 自动向目标 CSS 注入设计令牌 |
| `create-components-dir` | 组件存放目录不存在 | 自动创建目标目录 |
| `create-utils-file` | `src/lib/utils.ts` 工具文件缺失 | 创建包含 `cn()` 的工具文件 |
| `add-cn-function` | 工具文件中未定义 `cn()` 函数 | 向 utils 文件追加 `cn()` 导出 |
| `restore-integrity` | 已安装组件被外部异常修改/损坏 | 从注册表基线重新拉取恢复完整性 |
| `remove-orphans` | 存在已无任何组件引用的孤儿共享文件 | 自动清理冗余的孤儿文件 |

#### 修复计划演练预览（`--fix --dry-run`）
在执行修复之前，可以通过演练模式查看将被修改的文件与差异补丁：

```bash
npx brutx-vue@latest doctor --fix --dry-run
```

---

### brutx-vue cache

管理 CLI 本地组件与注册表元数据缓存：

```bash
npx brutx-vue@latest cache clear [--max-age <days>]
```

#### 示例

清理本地全部缓存：

```bash
npx brutx-vue@latest cache clear
```

保留最近 7 天的活跃缓存，仅清理超过 7 天的过期条目：

```bash
npx brutx-vue@latest cache clear --max-age 7
```

---

### brutx-vue registry

管理 `components.json` 中声明的多注册表源（`registries` 列表）。CLI 具备自动 Fallback 机制：主源超时或不可达时，自动无缝切换到备用镜像源。

#### 列出当前生效的所有源及连通性状态

```bash
npx brutx-vue@latest registry list
```

#### 添加新的镜像源或私有源

```bash
npx brutx-vue@latest registry add https://mirror.example.com/registry
```

#### 移除指定源（移除全部自定义源后自动恢复官方源）

```bash
npx brutx-vue@latest registry remove https://mirror.example.com/registry
```

---

## 配置文件：`components.json`

运行 `init` 后，项目根目录下将生成 `components.json`。这是 CLI 工作流的核心配置契约：

```json
{
  "$schema": "https://lidaixingchen.github.io/brutxui-vue3/schema.json",
  "$version": 1,
  "style": "brutalism",
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "tokensFile": "src/styles/tokens.css"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "composables": "@/composables",
    "locales": "@/locales",
    "directives": "@/directives"
  },
  "workspace": {
    "mode": "standalone",
    "targetPackage": "ui",
    "sharedUtilsPackage": "shared",
    "installDependenciesTo": "targetPackage"
  },
  "registries": [
    "https://github.com/lidaixingchen/brutxui-vue3/releases/latest/download"
  ],
  "requireSignature": false,
  "rules": {
    "tailwind.tokens": "error",
    "integrity.drift": "warn"
  },
  "plugins": []
}
```

### 完整配置项说明

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `$schema` | `string` | JSON Schema 规范链接，在 VS Code / WebStorm 中提供强类型补全 |
| `$version` | `number` | 配置文件结构版本（CLI 读取时自动无损迁移） |
| `style` | `string` | 预设视觉风格，当前固定为 `brutalism` |
| `tailwind.config` | `string` | Tailwind 配置文件路径（Tailwind v4 项目中保持为空字符串） |
| `tailwind.css` | `string` | 全局 CSS 入口文件路径 |
| `tailwind.tokensFile` | `string` | *(可选)* 独立设计令牌样式文件路径 |
| `aliases.components` | `string` | UI 组件导入别名（默认 `@/components`） |
| `aliases.utils` | `string` | 工具函数导入别名（默认 `@/lib/utils`） |
| `aliases.composables`| `string` | 组合式函数导入别名（默认 `@/composables`） |
| `aliases.locales` | `string` | *(可选)* 多语言字典导入别名 |
| `aliases.directives` | `string` | *(可选)* Vue 自定义指令导入别名 |
| `workspace` | `object` | *(可选)* Monorepo 工作区多包架构策略配置 |
| `workspace.mode` | `string` | 工作区模式：`standalone` / `shared-package` / `app-local` / `hybrid` |
| `workspace.installDependenciesTo` | `string` | 依赖写入策略：`targetPackage` / `caller` / `both` |
| `registries` | `string[]` | *(可选)* 多 Registry 镜像源列表，按序自动降级重试 |
| `requireSignature` | `boolean` | *(可选)* 严格签名模式：为 `true` 时强制 Manifest 数字验签 |
| `trustedPublicKeys` | `array` | *(可选)* 项目级追加信任的 Ed25519 SPKI 公钥列表 |
| `rules` | `object` | *(可选)* 调优或禁用特定的诊断规则级别（`"off"` / `"warn"` / `"error"`） |
| `plugins` | `string[]` | *(可选)* 自定义诊断规则插件列表（支持本地相对路径或 npm 包名） |

---

## 全局选项与环境变量

### 全局命令行参数
以下全局选项必须置于子命令之前：

```bash
npx brutx-vue@latest [global-options] <command> [command-options]
```

- `--dry-run`：全局演练模式，模拟执行所有写操作而不修改磁盘
- `--require-signature`：严格签名模式，Manifest 签名验证不通过直接抛错退出
- `--verbose-level <1|2|3>`：详细日志等级（`1`=步骤，`2`=网络/缓存细节，`3`=堆栈追踪）
- `-v` / `-vv` / `-vvv`：等价于 `--verbose-level 1 / 2 / 3`
- `--verbose`：显示详细错误堆栈（等价于 `-v`）

### 环境变量矩阵

所有全局行为均支持通过环境变量在 CI、Docker 或脚本中无侵入配置：

| 环境变量 | 允许取值 | 对应 CLI 参数 | 说明 |
| :--- | :--- | :--- | :--- |
| `BRUTX_OFFLINE` | `1` | `--offline` | 激活离线模式，只读本地缓存，完全断网执行 |
| `BRUTX_NO_CACHE` | `1` | `--no-cache` | 跳过本地缓存，强制向远端 Registry 发起请求 |
| `BRUTX_DRY_RUN` | `1` | `--dry-run` | 激活全局演练模式，禁止任何磁盘落盘操作 |
| `BRUTX_VERBOSE` | `1` / `2` / `3` | `-v` / `-vv` / `-vvv` | 设定日志输出详细等级 |
| `BRUTX_REQUIRE_SIGNATURE`| `1` | `--require-signature` | 开启严格验签门禁，验签失败直接终止命令 |
| `BRUTX_REGISTRY_PUBLIC_KEYS` | JSON 字符串 | — | 注入额外的 Ed25519 信任公钥数组 |
| `BRUTX_CACHE_DIR` | 路径字符串 | — | 自定义本地组件缓存根路径（默认 `.brutx/cache`） |
| `BRUTX_CACHE_MAX` | 正整数 | — | 本地缓存最大条目数上限（默认 `200`，基于 LRU 淘汰） |
| `BRUTX_CACHE_MAX_BYTES` | 字节整数 | — | 本地缓存总磁盘空间占用上限 |

---

## CI/CD 持续集成流水线

推荐在 GitHub Actions / GitLab CI 中将 `brutx-vue doctor` 纳入自动化质量门禁。

### GitHub Actions 工作流示例

在仓库中创建 `.github/workflows/brutx-check.yml`：

```yaml
name: BrutxUI Integrity & Quality Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  diagnose:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install pnpm
        uses: pnpm/action-setup@v4

      - name: Run Brutx Doctor Gate
        run: |
          # 当检测到配置错误、缺失依赖或组件代码漂移（drift）时阻断 PR
          npx brutx-vue@latest doctor --ci --fail-on drift --reporter github

      - name: Generate Security SBOM
        if: always()
        run: |
          npx brutx-vue@latest doctor --sbom --sbom-output ./brutx-sbom.json

      - name: Upload SBOM Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: brutx-sbom
          path: ./brutx-sbom.json
```

---

## 供应链安全与合规保障

BrutxUI 源码级分发体系内建了企业级防篡改与合规能力：

- **内容规范化哈希复算**：拉取组件时对 Manifest 内容复算 SHA-256，防御 CDN 篡改与中间人劫持；
- **Ed25519 数字签名校验**：内置官方根公钥，静默完成防伪验签；企业私有源支持多密钥平滑轮换；
- **CycloneDX 1.5 SBOM 物料清单**：通过 `doctor --sbom` 一键导出符合国际合规标准的软件物料清单，可无缝对接 Snyk、Trivy、Dependency-Track 等安全审计平台；
- **本地审计日志**：写操作自动记录在 `.brutx/audit.log` 中备查。

> [!TIP]
> **深入探索供应链安全与合规**  
> 详细的密码学签名验签原理、企业私有 Registry 密钥管理规范、CycloneDX 1.5 格式说明及合规落地指南，请参阅专门的 **[供应链安全与合规指南](/guide/security)**。

---

## 常见错误码与排障手册

当 CLI 遇到异常退出时，会抛出统一格式的错误码。以下是常见错误码的原因与官方修复建议：

| 错误代码 | 错误原因 | 建议对策 |
| :--- | :--- | :--- |
| `CONFIG_NOT_FOUND` | 未找到 `components.json` 配置文件 | 先在项目根目录运行 `brutx-vue init` 进行初始化 |
| `CONFIG_INVALID` | `components.json` 格式错误或缺失必须字段 | 运行 `brutx-vue doctor --fix` 进行配置自愈修复 |
| `COMPONENT_NOT_FOUND` | 请求添加的组件不存在于注册表中 | 检查组件名称拼写，或运行 `brutx-vue list` 查看可用列表 |
| `REGISTRY_FETCH_FAILED` | 无法连接到 Registry 注册表 | 检查本地网络环境，或使用 `--registry` 指定可访问的镜像源 |
| `REGISTRY_OFFLINE_UNAVAILABLE` | 离线模式下请求的组件未在本地缓存中 | 切换为在线模式运行一次以预热缓存，或关闭 `--offline` |
| `REGISTRY_SIGNATURE_INVALID` | Manifest 的数字签名未能通过受信任公钥验证 | 存在潜在篡改或公钥不匹配，检查 `BRUTX_REGISTRY_PUBLIC_KEYS` |
| `REGISTRY_INTEGRITY_FAILED` | 内容规范化 SHA-256 哈希比对失败 | 使用 `--no-cache` 重新拉取，或核对私有源构建产物 |
| `REGISTRY_VERSION_UNSUPPORTED`| `@version` 语法用于不支持分支映射的非 Raw 源 | 移除 `@version` 或使用 `--registry` 切换为 GitHub raw 源 |
| `PATH_UNSAFE` | 目标写入路径存在非法路径穿越（Directory Traversal） | 检查 `components.json` 中的别名路径配置，严禁指向工作区之外 |
| `WRITE_FAILED` | 文件系统写入失败 | 检查目标目录的文件写入权限，或关闭占用文件的编辑器进程 |
| `DOCTOR_FAILED` | `doctor` 诊断未达到 `--fail-on` 设定的合格标准 | 根据终端中的报告提示，运行 `doctor --fix` 或手动修复问题 |
