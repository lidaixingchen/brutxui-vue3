---
title: CLI
description: 了解 brutx-vue 命令行工具的使用方法
---

# CLI

`brutx-vue` CLI 帮助你在项目中初始化 BrutxUI，并通过单条命令添加组件。

## 概览

```bash
npx brutx-vue@latest <command>
```

CLI 会自动处理依赖安装、文件创建和配置更新。

## brutx-vue init

在你的项目中初始化 BrutxUI。它会设置基础配置：

```bash
npx brutx-vue@latest init
```

init 命令将：

1. 检测你的项目框架（Vite、Nuxt 等）
2. 安装所需依赖（`reka-ui`、`class-variance-authority`、`clsx`、`tailwind-merge`、`@lucide/vue`）
3. 在 `src/lib/utils.ts` 创建 `cn()` 工具函数
4. 将 `--brutal-*` CSS 自定义属性注入到你的样式表中
5. 将 BrutxUI 样式（包括 Tailwind 工具类层）添加到你的 CSS 中
6. 设置组件目录结构

### 选项

| 标志                        | 描述                 | 默认值     |
| ------------------------- | ------------------ | ------- |
| `--yes` / `-y`            | 跳过提示并使用默认值         | `false` |
| `--defaults` / `-d`       | 使用默认配置             | `false` |
| `--cwd <path>`            | 设置工作目录             | 当前目录    |
| `--force` / `-f`          | 强制覆盖已有配置           | `false` |
| `--silent` / `-s`         | 静默输出               | `false` |
| `--vscode`                | 生成 VS Code 代码片段    | `false` |
| `--workspace-root <path>` | 指定 monorepo 工作区根目录 | —       |

init 支持 monorepo 工作区检测（pnpm-workspace.yaml / lerna.json / turbo.json）。

## brutx-vue add

向项目中添加单个组件：

```bash
npx brutx-vue@latest add <component...>
```

### 示例

添加单个组件：

```bash
npx brutx-vue@latest add button
```

添加多个组件：

```bash
npx brutx-vue@latest add button card dialog input
```

添加所有可用组件：

```bash
npx brutx-vue@latest add --all
```

### 选项

| 标志                             | 描述              | 默认值     |
| ------------------------------ | --------------- | ------- |
| `--all`                        | 添加所有可用组件        | `false` |
| `--yes` / `-y`                 | 跳过确认提示          | `false` |
| `--cwd <path>`                 | 设置工作目录          | 当前目录    |
| `--overwrite`                  | 覆盖已有的组件文件       | `false` |
| `--path <path>` / `-p`         | 指定组件添加路径        | —       |
| `--silent` / `-s`              | 静默输出            | `false` |
| `--dry-run`                    | 模拟添加，不写入文件      | `false` |
| `--registry <registry>` / `-r` | 指定注册表路径或 URL    | —       |
| `--no-cache`                   | 跳过注册表缓存         | `false` |
| `--vscode`                     | 更新 VS Code 代码片段 | `false` |

### 版本锁定

```bash
npx brutx-vue@latest add button@1.2.0
```

使用 `@` 语法将组件锁定到指定版本。`@` 后的字符串作为 git ref（分支、tag、commit）注入到注册表源 URL 中，因此会拉取对应版本的全部组件文件。

#### 与 `--registry` 的交互

`@version` 仅对 GitHub raw URL 结构的注册表生效（形如 `https://raw.githubusercontent.com/{owner}/{repo}/{ref}/...`）。CLI 会将当前 `--registry` URL 中的 `{ref}` 段替换为 `@version`，其余路径保持不变，因此可与自定义 fork 配合使用：

```bash
# 从个人 fork 的 v1.2.0 tag 拉取 button
npx brutx-vue@latest add button@1.2.0 \
  --registry https://raw.githubusercontent.com/<you>/<fork>/main/registry
```

若 `--registry` 不是 GitHub raw URL 结构（如本地路径、自建 HTTP registry），使用 `@version` 会抛 `REGISTRY_VERSION_UNSUPPORTED` 错误。此时请移除 `@version` 或将 `--registry` 切换为 GitHub raw URL。

#### 版本混用提示

当已安装组件的版本与本次请求的版本不一致时，CLI 会输出 warn（不阻塞）：

```text
⚠ Version mismatch: "button" is already installed at version 1.0.0, but you requested 1.2.0.
```

#### update 命令的版本约束

`update` 默认**跳过**版本锁定的组件（避免擅自改变用户显式锁定的 ref）。如需跨版本更新，需显式传入 `--across-versions`：

```bash
# 默认跳过 button@1.0.0
npx brutx-vue@latest update

# 显式跨版本更新
npx brutx-vue@latest update --across-versions
```

## brutx-vue doctor

检查项目配置健康度，诊断常见问题：

```bash
npx brutx-vue@latest doctor
```

doctor 命令将检查：

1. `components.json` 是否存在且格式合法
2. 配置中的路径是否指向真实文件
3. Tailwind CSS 版本兼容性
4. 必要依赖是否已安装（`reka-ui`、`class-variance-authority`、`clsx`、`tailwind-merge`）
5. `cn()` 工具函数是否存在
6. CSS 文件中是否包含 BrutxUI 设计 token
7. 已安装组件的文件完整性
8. `$version` 配置版本检查

### 示例

基本诊断：

```bash
npx brutx-vue@latest doctor
```

自动修复可修复的问题：

```bash
npx brutx-vue@latest doctor --fix --yes
```

输出 JSON 格式报告：

```bash
npx brutx-vue@latest doctor --json
```

### 选项

| 标志                   | 描述           | 默认值     |
| -------------------- | ------------ | ------- |
| `--cwd <path>`       | 设置工作目录       | 当前目录    |
| `--fix`              | 自动修复可修复的问题   | `false` |
| `--fix-only <fixId>` | 仅执行指定的修复项    | —       |
| `--json`             | 输出 JSON 格式报告 | `false` |
| `--yes` / `-y`       | 跳过确认提示       | `false` |
| `--silent` / `-s`    | 静默输出         | `false` |
| `--sbom`             | 生成 CycloneDX 1.5 SBOM 并退出（不运行 doctor 检查） | `false` |
| `--sbom-output <path>` | SBOM 输出路径 | `./brutx-sbom.json` |

### 输出示例

```text
🩺 Brutx-Vue Doctor

  ✅ components.json exists — components.json found.
  ✅ $schema field present — $schema field is present.
  ✅ style field present — style is "brutalism".
  ✅ tailwind.css contains BrutxUI tokens — CSS file contains BrutxUI tokens.
  ✅ aliases.components → @/components — Directory exists.
  ✅ aliases.utils → @/lib/utils — File exists.
  ✅ tailwindcss installed — ^4.3.0 installed.
  ✅ reka-ui installed — ^2.9.9 installed.
  ✅ cn() function exists — cn() function found.

  Summary: 9 passed, 0 warnings, 0 errors
```

### 可自动修复的问题

| 问题                   | 修复操作            |
| -------------------- | --------------- |
| `$schema` 缺失         | 写入 schema URL   |
| `$version` 过期        | 更新为当前版本         |
| `style` 缺失           | 设置为 `brutalism` |
| CSS 缺少 BrutxUI token | 注入 CSS 样式       |
| 组件目录不存在              | 创建目录            |
| utils 文件不存在          | 创建 utils 文件     |
| `cn()` 函数不存在         | 添加 cn() 函数      |

## brutx-vue diff

对比本地已安装组件与注册表最新版本的差异：

```bash
npx brutx-vue@latest diff [components...]
```

### 示例

对比单个组件：

```bash
npx brutx-vue@latest diff button
```

对比多个组件：

```bash
npx brutx-vue@latest diff button card dialog
```

对比所有已安装组件：

```bash
npx brutx-vue@latest diff --all
```

输出 JSON 格式：

```bash
npx brutx-vue@latest diff --all --json
```

### 选项

| 标志                         | 描述         | 默认值     |
| -------------------------- | ---------- | ------- |
| `--all`                    | 对比所有已安装组件  | `false` |
| `--cwd <path>`             | 设置工作目录     | 当前目录    |
| `--registry <path>` / `-r` | 指定本地注册表路径  | —       |
| `--json`                   | 输出 JSON 格式 | `false` |
| `--silent` / `-s`          | 静默输出       | `false` |
| `--no-cache`               | 跳过注册表缓存    | `false` |

### 输出示例

对比单个组件：

```text
📊 Component Diff: button

  Status: 🔄 MODIFIED (1 file changed)

  src/components/ui/button/Button.vue
    --- registry/src/components/ui/button/Button.vue
    +++ local/src/components/ui/button/Button.vue
    -  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    +  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
    +  loading?: boolean;

  Summary: 1 file modified, 0 files unchanged
```

对比所有组件：

```text
📊 Component Diff Report

  🔄 MODIFIED (2)
    — button    (1 file changed)
    — card      (2 files changed)

  ✅ UP-TO-DATE (5)
    — badge
    — dialog
    — input
    — select
    — toast

  Summary: 2 modified, 5 up-to-date, 0 local-only
```

## brutx-vue update

检查已安装组件是否有可用更新，并一键更新：

```bash
npx brutx-vue@latest update [components...]
```

update 命令内部复用 diff 逻辑检测过期组件，再执行覆盖安装。

### 示例

检查并更新所有已安装组件：

```bash
npx brutx-vue@latest update
```

更新指定组件：

```bash
npx brutx-vue@latest update button card
```

仅预览，不实际更新：

```bash
npx brutx-vue@latest update --dry-run
```

### 选项

| 标志                             | 描述        | 默认值     |
| ------------------------------ | --------- | ------- |
| `--all` / `-a`                 | 更新所有过期组件  | `false` |
| `--yes` / `-y`                 | 跳过确认提示    | `false` |
| `--cwd <path>`                 | 设置工作目录    | 当前目录    |
| `--dry-run`                    | 仅预览，不写入文件 | `false` |
| `--registry <registry>` / `-r` | 指定注册表 URL | —       |
| `--no-cache`                   | 跳过注册表缓存   | `false` |
| `--silent` / `-s`              | 静默输出      | `false` |
| `--across-versions`            | 允许跨版本更新已锁定的组件（见[版本锁定](#版本锁定)） | `false` |

## brutx-vue list

列出项目中已安装的组件及其信息：

```bash
npx brutx-vue@latest list
```

### 选项

| 标志                | 描述         | 默认值     |
| ----------------- | ---------- | ------- |
| `--cwd <path>`    | 设置工作目录     | 当前目录    |
| `--json`          | 输出 JSON 格式 | `false` |
| `--silent` / `-s` | 静默输出       | `false` |

### 输出示例

```text
Installed Components

  Name      Files   Dependencies
  ─────────────────────────────────
  badge     2       vue
  button    3       vue, reka-ui, @lucide/vue
  card      2       vue

  3 component(s) installed
```

## brutx-vue info

查看指定组件的详细信息：

```bash
npx brutx-vue@latest info <component>
```

### 示例

```bash
npx brutx-vue@latest info button
```

### 选项

| 标志                             | 描述           | 默认值     |
| ------------------------------ | ------------ | ------- |
| `--cwd <path>`                 | 设置工作目录       | 当前目录    |
| `--json`                       | 输出 JSON 格式   | `false` |
| `--registry <registry>` / `-r` | 指定注册表路径或 URL | —       |
| `--silent` / `-s`              | 静默输出         | `false` |

## brutx-vue remove

从项目中移除已安装的组件：

```bash
npx brutx-vue@latest remove <components...>
```

remove 命令会删除组件目录，并检测不再被其他组件引用的孤儿文件（composable / locale），提示是否一并清理。

### 示例

移除单个组件：

```bash
npx brutx-vue@latest remove button
```

移除多个组件：

```bash
npx brutx-vue@latest remove button card
```

仅预览，不实际删除：

```bash
npx brutx-vue@latest remove button --dry-run
```

### 选项

| 标志                | 描述        | 默认值     |
| ----------------- | --------- | ------- |
| `--yes` / `-y`    | 跳过确认提示    | `false` |
| `--cwd <path>`    | 设置工作目录    | 当前目录    |
| `--dry-run`       | 仅预览，不删除文件 | `false` |
| `--silent` / `-s` | 静默输出      | `false` |

## brutx-vue create

从零创建一个预配置 BrutxUI 的 Vue 3 项目：

```bash
npx brutx-vue@latest create <project-name>
```

create 命令会自动搭建项目脚手架、安装依赖并运行 `init`。

### 示例

```bash
npx brutx-vue@latest create my-app
```

使用 Nuxt 模板：

```bash
npx brutx-vue@latest create my-app --template nuxt
```

### 选项

| 标志                             | 描述                              | 默认值       |
| ------------------------------ | ------------------------------- | --------- |
| `--template <template>` / `-t` | 项目模板（`default`、`nuxt`）          | `default` |
| `--package-manager <pm>`       | 包管理器（`pnpm`、`npm`、`yarn`、`bun`） | `pnpm`    |
| `--cwd <path>`                 | 设置工作目录                          | 当前目录      |
| `--yes` / `-y`                 | 跳过确认提示                          | `false`   |

## components.json 配置文件

运行 `init` 后，项目根目录会生成 `components.json`：

```json
{
  "$schema": "https://lidaixingchen.github.io/brutxui-vue3/schema.json",
  "$version": 1,
  "style": "brutalism",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "composables": "@/composables"
  }
}
```

| 字段                    | 描述                          |
| --------------------- | --------------------------- |
| `$schema`             | JSON Schema URL，提供 IDE 校验   |
| `$version`            | 配置文件版本号，CLI 读取时自动迁移旧版本      |
| `style`               | 样式主题，当前仅支持 `brutalism`      |
| `tailwind.config`     | Tailwind 配置文件路径（v4 项目为空字符串） |
| `tailwind.css`        | 全局 CSS 文件路径                 |
| `aliases.components`  | 组件导入别名                      |
| `aliases.utils`       | 工具函数导入别名                    |
| `aliases.composables` | 组合式函数导入别名                   |

## 全局选项

以下选项适用于所有命令，需放在子命令之前：

```bash
npx brutx-vue@latest [global-options] <command> [command-options]
```

| 标志                       | 描述                                                | 默认值     |
| ------------------------ | ------------------------------------------------- | ------- |
| `--verbose`              | 显示详细错误输出（等价于 `-v`）                                | `false` |
| `--dry-run`              | 全局 dry-run：模拟所有写操作但不落盘（与命令级 `--dry-run` 叠加生效）      | `false` |
| `--require-signature`    | 严格签名模式：manifest 签名校验失败时升级为 error（默认为 warn，见[供应链安全](#供应链安全签名与-sbom)） | `false` |
| `--verbose-level <level>` | verbose 等级（`1`=步骤、`2`=缓存/网络细节、`3`=堆栈）           | `0`     |
| `-v`                     | 等价于 `--verbose-level 1`                           | —       |
| `-vv`                    | 等价于 `--verbose-level 2`                           | —       |
| `-vvv`                   | 等价于 `--verbose-level 3`                           | —       |

### 全局 dry-run

`--dry-run` 全局 flag 会激活所有命令的 dry-run 语义，无需在每个子命令后加 `--dry-run`。也可通过环境变量 `BRUTX_DRY_RUN=1` 激活：

```bash
# 以下两条等价
BRUTX_DRY_RUN=1 npx brutx-vue@latest add button
npx brutx-vue@latest --dry-run add button
```

激活后，`add`/`update`/`remove` 只打印将写入的路径，不修改任何文件。

### verbose 等级

通过 `-v`/`-vv`/`-vvv` 或环境变量 `BRUTX_VERBOSE=<n>` 控制输出详细程度：

| 等级 | 标签       | 含意                      |
| --- | --------- | ----------------------- |
| `1` | `[STEP]`  | 步骤级，如"正在解析依赖"           |
| `2` | `[DETAIL]` | 缓存/网络细节，如"缓存命中 button@v1" |
| `3` | `[TRACE]` | 堆栈/调试细节                 |

## 审计日志

`add`/`remove`/`update`/`diff` 命令执行后会在 `.brutx/audit.log` 追加一条 JSONL 记录，包含：

- `timestamp`：ISO 时间戳
- `command`：命令类型（`add`/`remove`/`update`/`diff`）
- `components`：操作的组件列表
- `registrySource`：注册表源
- `success`：是否成功
- `dryRun`：是否为 dry-run
- `error`：失败时的错误信息

`doctor` 会读取审计日志中最近 5 条失败记录，作为诊断线索：

```bash
npx brutx-vue@latest doctor
```

输出示例：

```text
⚠ audit log health — 1 recent failure(s) in audit log: update(button).
  Latest: update failed at 2026-07-16T02:30:00Z — Network unreachable
```

## 供应链安全：签名与 SBOM

P1-6 引入了 manifest Ed25519 签名校验与 CycloneDX 1.5 SBOM 生成，用于检测供应链篡改。

### Manifest 签名

注册表构建时，`registry-manifest.json` 会附带 `signature` + `keyId` 字段，对 `integrity` 字段做 Ed25519 签名。CLI 在拉取 manifest 时自动校验签名。

#### 信任公钥配置

通过 `BRUTX_REGISTRY_PUBLIC_KEYS` 环境变量注入受信任公钥列表（JSON 数组）：

```bash
BRUTX_REGISTRY_PUBLIC_KEYS='[{"keyId":"v1","publicKey":"<base64-SPKI-DER>"}]' \
  npx brutx-vue@latest add button
```

`publicKey` 为 base64 编码的 SPKI DER 格式（单行，便于嵌入 JSON）。未设置环境变量时，验签自动降级为跳过（向后兼容）。

#### 默认 warn 与严格模式

签名校验失败时，**默认行为是 warn**（打印警告并继续），避免迁移期未配置公钥的项目卡死：

```text
[Signature] Manifest signed with unknown keyId "v1". No matching trusted public key found.
  (use --require-signature to enforce)
```

如需在签名失败时直接拒绝执行，激活严格模式：

```bash
# 通过 flag
npx brutx-vue@latest --require-signature add button

# 或通过环境变量
BRUTX_REQUIRE_SIGNATURE=1 npx brutx-vue@latest add button
```

严格模式下签名失败会抛 `REGISTRY_SIGNATURE_INVALID`（exit 1）。`integrity` 字段仍兜底防篡改（即使签名跳过，被篡改的内容也会因 integrity 不匹配而失败）。

#### 密钥轮换

公钥列表按 `keyId` 索引。轮换密钥时：

1. 新 key 签发的 manifest：将新公钥加入 `BRUTX_REGISTRY_PUBLIC_KEYS` 即可
2. 过渡期：旧 key 仍在列表中，旧 manifest 仍可信
3. 撤销旧 key：从环境变量中移除即可

### SBOM 生成

#### 注册表 SBOM（构建时）

`pnpm --filter brutx-registry-vue build` 会自动生成 `packages/registry/registry/registry-sbom.json`，包含：

- 所有注册表组件（`type: application`，含 `bom-ref: brutx:<name>`）
- 所有 npm 依赖（`type: library`，含 `bom-ref: npm:<dep>`）
- `dependencies` 数组引用其他 bom-ref，构成依赖图
- `integrity` 字段（对 `bomFormat`/`specVersion`/`components` 的 sha256）
- `manifestIntegrity` 字段，绑定对应的 `registry-manifest.json` integrity

`serialNumber` 为随机 UUID（每次构建重新生成），不参与 integrity 计算，已加入 `build:verify` 的 diff 排除字段。

#### 项目 SBOM（doctor --sbom）

`doctor --sbom` 生成已安装组件的 SBOM，写入 `./brutx-sbom.json`（可用 `--sbom-output` 自定义路径）：

```bash
npx brutx-vue@latest doctor --sbom
npx brutx-vue@latest doctor --sbom --sbom-output ./reports/sbom.json
```

读取 `.brutx/components.json` manifest 中已安装组件的版本、依赖、`registryDependencies` 与 integrity，生成 CycloneDX 1.5 格式 SBOM。无组件安装时报错退出。
