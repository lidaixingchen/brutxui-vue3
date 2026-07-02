# CLI 改进建议

> 基于 `packages/cli/` v0.6.1 源码全面审查，按优先级分为 **高 / 中 / 低** 三档。

---

## 一、功能缺失

### 1. `update` 命令（高）

当前用户只能通过 `diff` 发现差异，再手动 `add --overwrite` 逐个更新。缺少一键批量更新能力。

**建议：**
- 新增 `brutx-vue update [components...]` 命令
- 内部复用 `diff` 逻辑检测过期组件，再走 `add --overwrite` 路径
- 支持 `--all` 全量更新、`--dry-run` 预览、`--json` 机器输出
- 交互模式下展示 changelog 摘要，让用户选择要更新的组件

### 2. `list` / `info` 命令（中）

用户无法快速查看已安装组件及其版本、依赖关系。

**建议：**
- `brutx-vue list` — 扫描组件目录，列出已安装组件 + 安装来源
- `brutx-vue info <component>` — 显示组件详情（版本、依赖树、文件列表、registry 来源）

### 3. `remove` 命令（中）

组件安装后无法通过 CLI 清理，只能手动删文件。

**建议：**
- `brutx-vue remove <component...>` — 删除组件文件 + 清理不再被其他组件引用的 composable / locale 文件
- 提供 `--dry-run` 预览受影响的文件
- 检查是否有其他已安装组件依赖被删除组件，给出警告

### 4. `init` 模板 / 脚手架（低）

`init` 只配置已有项目，不支持从零创建。

**建议：**
- `brutx-vue create <project-name>` — 基于 Vite + Vue 3 模板创建项目并自动 init
- 或提供 `--template` 选项，从预置模板（dashboard、blog、landing-page）快速搭建

---

## 二、架构与代码质量

### 5. `installPackages()` 同步阻塞（高）

`execFileSync` 在包安装期间完全阻塞 Node.js 事件循环，spinner 停止转动，用户体验差。

**现状：**
```ts
// packages/cli/src/lib/package-manager.ts
execFileSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
```

**建议：**
- 改用 `child_process.spawn()` + Promise 封装
- 保持 spinner 动画运行
- 支持 `SIGINT` 优雅中断
- 将 stdout/stderr 通过 logger 转发而非 `stdio: 'inherit'`，以便在 `--silent` 模式下抑制

### 6. Registry 网络请求无重试（高）

`getItem()` 只有单次 30s 超时，网络抖动直接失败。

**建议：**
- 添加指数退避重试（最多 3 次，间隔 1s → 2s → 4s）
- 首次超时后提示用户检查网络或切换 `--registry` 源
- 考虑添加本地缓存（`~/.brutx-vue/cache/`），减少重复请求

### 7. 无 Registry 缓存机制（中）

每次 `add` 都会重新 fetch 所有组件及其依赖的 JSON，包括重复请求。

**建议：**
- 引入带 TTL 的本地文件缓存（默认 1 小时）
- 缓存 key = `sha256(source + componentName)`
- `--no-cache` 跳过缓存强制刷新
- `brutx-vue cache clean` 清理缓存目录

### 8. 导入重写基于正则，存在误匹配风险（中）

`resolveImportAlias()` 用正则替换文件内容中的 `@/` 前缀，共处理 4 种别名路径（lib/utils、components、composables、locales）。

**现状：**
```ts
// packages/cli/src/lib/project.ts
return content
    .replace(/(["'])@\/lib\/utils\1/g, `$1${config.aliases.utils}$1`)
    .replace(/(["'])@\/components\/(.*?)\1/g, `$1${config.aliases.components}/$2$1`)
    .replace(/(["'])@\/composables\/(.*?)\1/g, `$1${composablesAlias}/$2$1`)
    .replace(/(["'])@\/locales\/(.*?)\1/g, `$1${localesAlias}/$2$1`);
```

**问题：**
- 正则使用捕获组 + 反向引号确保配对，但仍会匹配注释和字符串字面量中的伪 import 语句
- 新增导入路径格式时需手动添加正则

**建议：**
- 短期：排除 `//` 单行注释和 `/* */` 块注释中的匹配
- 长期：使用轻量 AST 解析（如 `oxc-parser` 或 `magic-string` + `es-module-lexer`）仅替换 import 语句中的路径

### 9. `dist/index.d.ts` 为空（低）

tsup 生成的类型声明文件只有 `export { }`，程序化消费者无法获得类型信息。

**建议：**
- CLI 包通常不需要导出类型，但如果计划提供 programmatic API，需在 tsup 配置中启用 `dts: { resolve: true }`
- 或显式在 `package.json` 中移除 `"types"` 字段，避免误导

---

## 三、测试覆盖

### 10. `doctor` 命令无测试（高）

396 行代码、8 类检查、6 个自动修复，零测试覆盖。

**建议：**
- 为每个 check 编写单元测试（pass / warn / error 三种状态）
- 为每个 fix 编写测试（修复前 → 修复后断言）
- 边界场景：`components.json` 格式损坏、CSS 文件不存在、utils.ts 部分损坏

### 11. `diff` 命令无测试（高）

267 行代码，涉及文件匹配、行级 diff、状态判定，零测试覆盖。

**建议：**
- 单元测试：`matchFileByPath()` 的路径匹配逻辑（Windows 反斜杠、大小写）
- 单元测试：行结束符标准化（CRLF vs LF）
- 集成测试：mock registry 返回，验证 modified / unchanged / added / removed 状态

### 12. `add` 命令缺少集成测试（中）

当前集成测试覆盖了基本的 add 流程，但缺少以下场景：
- 依赖冲突（两个组件依赖同一个 composable 的不同版本）
- 大组件安装（date-picker 16 个文件 + 5 个 composable）
- `--path` 自定义安装路径
- 网络超时 / registry 不可达

---

## 四、用户体验

### 13. 无操作回滚（高）

`add` 命令写入文件后，如果后续步骤（依赖安装、alias 重写）失败，已写入的文件不会回滚，项目处于半安装状态。

**建议：**
- 写入文件前记录快照（原始内容 + 路径）
- 失败时自动回滚到写入前状态
- 或在失败时明确提示："部分文件已写入，可运行 `brutx-vue doctor --fix` 修复"

### 14. 多组件安装进度不透明（中）

安装多个组件时，只有一个全局 spinner，用户不知道当前在处理哪个组件。

**建议：**
- 使用 `ora` 的 multi-spinner 或逐行输出：`[2/5] Adding date-picker...`
- 依赖解析完成后先展示安装计划（组件列表 + 文件数 + 预计大小）

### 15. `doctor --fix --yes` 无逐项交互确认（中）

`--fix` 单独使用不会应用修复，仅提示用户加 `--yes`；但一旦传入 `--yes`，所有可修复项会被一次性应用，用户无法选择性跳过。

**现状：**
```ts
// packages/cli/src/commands/doctor.ts
if (!options.yes && !options.silent) {
    logger.warn(`Found ${fixable.length} fixable issue(s). Use --yes to auto-fix.`);
    return;
}
// --yes 后直接循环应用全部修复，无逐项确认
```

**建议：**
- 默认交互模式：逐项确认 `Apply fix: InjectCssTokens? [Y/n]`
- `--fix-all` 或保留 `--yes` 跳过确认
- `--fix-only <fixId>` 只应用指定修复

### 16. 错误信息不够友好（低）

未知错误被直接 re-throw，用户看到的是原始 stack trace。

**现状：**
```ts
// src/index.ts
catch (error) {
    if (error instanceof CliError) { ... }
    else throw error; // 未处理
}
```

**建议：**
- 未知错误也捕获，输出友好消息 + 引导用户运行 `brutx-vue doctor`
- 提供 `--verbose` 标志显示完整 stack trace
- 在错误消息中包含文档链接和 issue 报告链接

---

## 五、安全与健壮性

### 17. Registry 内容无完整性校验（中）

从远程获取的 registry JSON 未做 hash 校验，中间人攻击可注入恶意代码。

**建议：**
- `index.json` 中每个组件条目增加 `integrity` 字段（`sha256-xxx`）
- `getItem()` 下载后校验 hash，不匹配则拒绝并告警
- 或考虑对 registry 做签名验证

### 18. `components.json` 无版本迁移机制（中）

配置文件缺少 `version` 字段，未来如果配置结构变更，无法自动迁移。

**建议：**
- 在 `components.json` 中添加 `$version` 字段
- CLI 读取时检查版本，提示用户运行 `brutx-vue migrate` 或自动迁移
- `doctor` 命令增加版本兼容性检查

### 19. `isSafePath()` TOCTOU 竞态（低）

`isSafePath()` 先 `realpath()` 解析符号链接，再检查路径前缀。在检查和实际写入之间存在时间窗口，理论上可被符号链接攻击利用。

此外，当 `realpath()` 失败时（新建文件的常见情况），函数 fallback 到 `path.resolve()`，该调用**不解析符号链接**，导致新建文件场景下符号链接防御实际上完全失效。

**建议：**
- 在写入前再次验证路径
- 或使用 `O_NOFOLLOW` 标志打开文件（Node.js `fs.open` 支持）

---

## 六、生态与集成

### 20. Nuxt 深度集成缺失（中）

`init` 已能检测 Nuxt 项目（`detectProjectType()` 识别 `nuxt.config.{js,ts,mjs}`），并使用 Nuxt 专属 CSS 路径和 base 目录。但缺少深度集成：不会自动注册组件目录、不修改 `nuxt.config.ts`、不配置 auto-import。

**建议：**
- `init` 检测到 Nuxt 项目时，自动在 `nuxt.config.ts` 中添加 `components` 目录配置
- 或提供一个 `@brutx-vue/nuxt` 模块，自动注册组件目录和 CSS

### 21. IDE 集成（低）

**建议：**
- 提供 VS Code snippet 文件，包含常用组件的使用模板
- 或提供 VS Code 扩展，在 `add` 命令后自动 import 组件

### 22. Monorepo 支持（低）

当前 CLI 假设单 `package.json` 项目，monorepo 场景下可能找不到正确的根目录。

**建议：**
- `init` 时检测 workspace 根目录（pnpm-workspace.yaml / lerna.json）
- 支持 `--workspace-root` 指定安装位置
- `components.json` 支持 workspace 级别的共享配置

---

## 七、优先级排序建议

| 优先级 | 编号 | 改进项 | 工作量 |
|--------|------|--------|--------|
| P0 | #5 | `installPackages` 改异步 | 1d |
| P0 | #6 | Registry 请求重试 | 0.5d |
| P0 | #10 | `doctor` 测试 | 2d |
| P0 | #11 | `diff` 测试 | 1.5d |
| P0 | #13 | `add` 操作回滚 | 1d |
| P1 | #1 | `update` 命令 | 2d |
| P1 | #7 | Registry 缓存 | 1d |
| P1 | #14 | 多组件进度 | 0.5d |
| P1 | #15 | `doctor --fix --yes` 交互 | 0.5d |
| P1 | #17 | Registry 完整性校验 | 1d |
| P1 | #18 | 配置版本迁移 | 1d |
| P2 | #2 | `list` / `info` 命令 | 1d |
| P2 | #3 | `remove` 命令 | 1.5d |
| P2 | #8 | 导入重写改 AST | 2d |
| P2 | #12 | `add` 集成测试补全 | 1.5d |
| P2 | #16 | 错误信息优化 | 0.5d |
| P2 | #20 | Nuxt 深度集成 | 2d |
| P3 | #4 | 脚手架模板 | 3d |
| P3 | #9 | 类型声明修复 | 0.5d |
| P3 | #19 | TOCTOU 修复 | 0.5d |
| P3 | #21 | IDE 集成 | 3d |
| P3 | #22 | Monorepo 支持 | 2d |
