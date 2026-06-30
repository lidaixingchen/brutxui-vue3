# CLI 技术债 P2 剩余任务方案

> **编写日期**：2026-06-30
> **关联报告**：[CLI_TECH_DEBT_REPORT.md](./CLI_TECH_DEBT_REPORT.md)
> **任务范围**：P2-13、P2-15、P2-16

---

## 一、P2-13: 统一同步/异步 API 风格 ✅

### 1.1 现状分析

CLI 中同步/异步 API 混用严重。共 **43 处同步调用**，分布在 7 个文件中：

| 文件 | 同步调用数 | 异步调用数 | 同步占比 |
| --- | --- | --- | --- |
| `lib/constants.ts` | 2 | 0 | 100% |
| `lib/project.ts` | 15 | 0 | 100% |
| `commands/doctor.ts` | 19 | 0 (直接) | 100% |
| `commands/diff.ts` | 6 | 0 (直接) | 100% |
| `lib/package-manager.ts` | 1 | 0 | 100% |
| `commands/add.ts` | 0 | 6 | 0% |
| `commands/init.ts` | 0 (直接) | 10 (直接) | 间接约 20+ |
| `lib/registry.ts` | 0 | 4 | 0% |

**关键发现**：`add.ts` 和 `registry.ts` 已完全异步化，其余文件仍大量使用同步 API。`package-manager.ts` 中的 `execFileSync` 会阻塞主线程等待 npm/pnpm 进程完成，可能耗时数秒到数十秒。

### 1.2 高风险调用（热路径/循环）

| 位置 | 函数 | API | 问题 |
| --- | --- | --- | --- |
| `project.ts:192-193` | `isSafePath()` | `realpathSync` x2 | 热路径，被 `resolveAliasPath()` 频繁调用 |
| `diff.ts:80` | `walkDir()` | `readdirSync` | 递归遍历，循环中使用 |
| `diff.ts:133,141` | `diffComponent()` | `existsSync` + `readFileSync` | for 循环中遍历注册表文件 |
| `doctor.ts:203,207` | `checkComponentIntegrity()` | `readdirSync` x2 | 嵌套 for 循环遍历组件目录 |

### 1.3 迁移方案

#### 阶段一：热路径修复（2-3 小时）

**目标**：消除 `isSafePath()` 中的 `realpathSync` 热路径瓶颈。

```typescript
// project.ts - 修改前
// normalize 是从外部导入的路径规范化函数
export function isSafePath(targetPath: string, cwd: string): boolean {
    let resolvedTarget: string;
    let resolvedCwd: string;
    try {
        resolvedTarget = normalize(fs.realpathSync(path.resolve(targetPath)));
        resolvedCwd = normalize(fs.realpathSync(path.resolve(cwd)));
    } catch {
        resolvedTarget = normalize(path.resolve(targetPath));
        resolvedCwd = normalize(path.resolve(cwd));
    }
    // ...
}

// project.ts - 修改后
// 变更说明：
// 1. 函数改为 async，使用 fs.promises.realpath 替代 realpathSync
// 2. 将外部导入的 normalize 替换为内联定义，增加 Windows 平台大小写不敏感处理
//    （Windows 路径不区分大小写，需统一转为小写比较）
export async function isSafePath(targetPath: string, cwd: string): Promise<boolean> {
    const normalize = process.platform === 'win32'
        ? (s: string) => s.toLowerCase()
        : (s: string) => s;

    let resolvedTarget: string;
    let resolvedCwd: string;
    try {
        resolvedTarget = normalize(await fs.promises.realpath(path.resolve(targetPath)));
        resolvedCwd = normalize(await fs.promises.realpath(path.resolve(cwd)));
    } catch {
        resolvedTarget = normalize(path.resolve(targetPath));
        resolvedCwd = normalize(path.resolve(cwd));
    }

    if (resolvedCwd === normalize(path.parse(resolvedCwd).root)) {
        return false;
    }

    return resolvedTarget.startsWith(resolvedCwd + path.sep) || resolvedTarget === resolvedCwd;
}
```

**影响范围**：`resolveAliasPath()` 需改为 async，影响 `add.ts`、`doctor.ts`、`diff.ts`、`init.ts` 中所有调用点。

#### 阶段二：命令函数异步化（3-4 小时）

**目标**：将 `doctor.ts` 和 `diff.ts` 中的同步检查函数改为 async。

doctor.ts 需修改的函数：

- `checkTailwindCss()` → async
- `checkAliases()` → async
- `checkDependencies()` → async
- `checkUtilsFunction()` → async
- `checkComponentIntegrity()` → async
- `applyFixes()` 内部同步调用 → 异步

diff.ts 需修改的函数：

- `getInstalledComponents()` → async
- `getLocalComponentFiles()` → async（含 `walkDir` 递归改异步）
- `diffComponent()` 循环内调用 → 异步

#### 阶段三：project.ts 基础函数异步化（2-3 小时）

**目标**：将 `project.ts` 中的所有同步函数改为 async。

需修改的函数：

- `hasAnyFile()` → async
- `findFirstExisting()` → async
- `hasVueDependency()` → async
- `detectProjectType()` → async
- `detectPackageManager()` → async
- `detectTailwindVersion()` → async
- `readTsConfig()` → async
- `findTailwindConfig()` → async
- `findCssFile()` → async
- `getDefaultAliases()` → async

**风险**：高。具体风险点：

- 这些函数被 `doctor.ts`、`diff.ts`、`init.ts`、`add.ts` 等多个命令文件调用，改为 async 会引发级联修改
- `detectProjectType()` 和 `detectPackageManager()` 在 `init.ts` 中被多次调用，需逐一添加 await
- `readTsConfig()` 返回值被直接使用，改为 async 后所有消费方需适配
- 建议先做完整的调用链分析，确定影响范围后再动手

#### 阶段四：constants.ts 缓存函数异步化（1 小时）

**目标**：将 `getBrutalistCssStyles()` 改为 async。

**影响**：该函数在 `init.ts` 中被调用用于注入 CSS 样式。改为 async 后，调用方需使用 `await getBrutalistCssStyles()` 获取内容。由于当前已有懒加载缓存模式（`_brutalistCssStyles` 变量），异步化后可保留相同的缓存语义。

### 1.4 不可迁移的调用

| 调用 | 原因 |
| --- | --- |
| `index.ts:10` `createRequire` | 模块顶层，必须同步执行 |
| `constants.ts:16` `existsSync` | 懒加载缓存模式，收益不大 |

### 1.5 工作量汇总

| 阶段 | 工作量 | 风险 | 优先级 |
| --- | --- | --- | --- |
| 阶段一：热路径修复 | 2-3 小时 | 中 | 高 |
| 阶段二：命令函数异步化 | 3-4 小时 | 低 | 中 |
| 阶段三：基础函数异步化 | 2-3 小时 | 高 | 中 |
| 阶段四：缓存函数异步化 | 1 小时 | 低 | 低 |
| **总计** | **8-11 小时** | - | - |

### 1.6 额外建议

`package-manager.ts` 中的 `execFileSync`（第 27 行）也应改为 `execFile`（异步），因为它会阻塞主线程等待 npm/pnpm 进程完成，可能需要数秒到数十秒。

---

## 二、P2-15: 添加文件锁机制 ⏭️ 跳过

### 2.1 调研结论：不需要引入文件锁

经过全面分析，**建议跳过文件锁实现**。

### 2.2 理由

#### CLI 工具是交互式低频操作

| 命令 | 并发风险 | 说明 |
| --- | --- | --- |
| `init` | 零 | 每个项目只需运行一次，有 `--force` 保护 |
| `add` | 极低 | 写入独立组件文件，已有 `pathExists` + `--overwrite` 保护 |
| `doctor --fix` | 极低 | 诊断修复工具，用户不会同时运行两个 |
| `diff` | 零 | 只读命令 |

#### 现有代码已有充分保护

- `pathExists` 检查防止重复创建（`add.ts:112, 138`；`init.ts:122, 198`）
- CSS 注入有幂等标记检测（`init.ts:124-129` 检查 `--color-brutal-bg`）
- `--overwrite` 标志控制覆写行为
- `isSafePath` 防止路径穿越

#### 引入文件锁的代价远大于收益

- 增加 `proper-lockfile` 依赖及其依赖树
- 需要处理锁超时、死锁清理、Windows 文件锁行为差异
- 需要为每个写入操作添加锁获取/释放逻辑
- 锁文件本身的清理问题（程序崩溃后 `.lock` 文件残留）
- 用户在 CI 环境中可能遇到权限问题

### 2.3 读-修改-写场景分析

CLI 中存在 3 处读-修改-写模式：

| 场景 | 位置 | 风险 | 现有保护 |
| --- | --- | --- | --- |
| CSS 样式注入 | `init.ts:139`、`doctor.ts:292` | 中高 | 幂等标记检测 |
| utils 函数追加 | `doctor.ts:317` | 中 | 低频操作 |
| config 文件覆写 | `doctor.ts:332` | 低 | 完整覆写 |

### 2.4 如果未来确实需要保护

如果 CLI 被用作自动化流水线的一部分（如 monorepo 的 postinstall hook），可以考虑：

1. **原子写入**：将 `writeFile` 替换为先写入 `.tmp` 文件再 `rename`
2. **写入前备份**：对于 config 和 CSS 文件，写入前先备份一份（`.bak`）
3. **轻量级进程锁**：仅在 `doctor --fix` 涉及读-修改-写的操作上加锁

但以当前的使用场景和代码规模，这些都不必要。

#### 判断标准

如果未来出现以下情况，应重新评估是否需要文件保护机制：

- CLI 被用于 CI/CD 流水线的 `postinstall` hook，且出现过文件损坏报告
- CLI 被集成到 monorepo 管理工具中，多个进程可能并发调用
- 用户反馈在正常使用中遇到配置文件损坏问题

---

## 三、P2-16: 添加依赖版本兼容性测试 ✅

### 3.1 依赖风险评估

#### runtime dependencies

| 包名 | 版本范围 | 风险 | 说明 |
| --- | --- | --- | --- |
| chalk | `^5.3.0` | 低 | 纯 ESM，API 稳定 |
| fs-extra | `^11.3.5` | 低 | 成熟稳定，`^11` 不跨大版本 |
| commander | `^15.0.0` | 低 | 向后兼容著称 |
| ora | `^9.4.0` | 低 | 纯 ESM，标准用法 |
| @inquirer/prompts | `^8.5.2` | 低 | 基础 prompt 类型 |
| diff | `^7.0.0` | 低 | 极其稳定 |
| jsonc-parser | `^3.3.1` | 极低 | VS Code 出品 |

**结论**：所有 runtime 依赖风险较低，使用方式为基础 API。

### 3.2 版本锁定机制

- `pnpm-lock.yaml` 存在，lockfile 版本 `9.0`
- CI 中使用 `pnpm install --frozen-lockfile`
- **缺失**：packages/cli 的 `package.json` 没有声明 `engines` 字段

### 3.3 当前 CI 问题

1. **无 Node.js 版本矩阵**：硬编码 `node-version: 22`
2. **无依赖兼容性测试**：只使用 `--frozen-lockfile`
3. **无 Dependabot 配置**：依赖更新完全手动
4. **单一平台**：仅 `ubuntu-latest`，无 Windows 测试

### 3.4 推荐方案

#### 方案 A：添加 Node.js 版本矩阵（推荐，最小改动）

修改 `.github/workflows/ci.yml`：

```yaml
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version: [22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      # ... 其余步骤不变
```

#### 方案 B：添加 engines 字段

在 `packages/cli/package.json` 中添加：

```json
{
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

**版本选择依据**：

- `node >= 22.0.0`：Node 22 是当前 LTS 版本，CLI 代码中使用了 `node:fs` 等新语法，需要 Node 18+；选择 22.0.0 作为下限是因为 CI 环境使用 Node 22，确保一致性
- `pnpm >= 9.0.0`：项目使用 pnpm lockfile v9 格式，低版本 pnpm 无法正确解析

这样用户通过 `npm install -g brutx-vue` 安装时，如果 Node/pnpm 版本不满足会收到警告。

#### 方案 C：添加 Dependabot 自动依赖更新（可选）

创建 `.github/dependabot.yml`：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "monthly"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
```

**安全审查建议**：Dependabot 自动创建的 PR 在合并前应进行人工审查，重点关注：

- 检查 changelog 中是否有破坏性变更
- 确认版本号跳跃幅度是否合理（如 `^1.0.0` → `^2.0.0` 需特别注意）
- 建议配置 GitHub 的 Dependabot alerts 功能，自动检测已知漏洞

#### 方案 D：跨平台测试（可选）

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    node-version: [22, 24]
runs-on: ${{ matrix.os }}
```

### 3.5 推荐优先级

| 方案 | 优先级 | 工作量 | 说明 |
| --- | --- | --- | --- |
| A: Node 版本矩阵 | 高 | 10 分钟 | 最小改动，最大收益 |
| B: engines 字段 | 高 | 2 分钟 | 一行改动 |
| C: Dependabot | 中 | 5 分钟 | 自动化依赖更新 |
| D: 跨平台测试 | 低 | 10 分钟 | CLI 已有 Windows 路径测试 |

---

## 四、总结与建议

| 任务 | 建议 | 工作量 | 理由 |
| --- | --- | --- | --- |
| P2-13 统一异步 API | **分阶段执行** | 8-11 小时 | 影响面大，需谨慎迁移 |
| P2-15 文件锁机制 | **跳过** | 0 | CLI 是交互式低频工具，现有保护充分 |
| P2-16 依赖兼容性测试 | **执行方案 A+B** | 15 分钟 | 最小改动，提升 CI 覆盖 |

### 建议执行顺序

1. **立即执行**：P2-16 方案 A+B（15 分钟）
2. **下一迭代**：P2-13 阶段一（热路径修复，2-3 小时）
3. **后续迭代**：P2-13 阶段三（基础函数异步化）→ 阶段二（命令函数异步化）→ 阶段四（缓存函数异步化）
4. **跳过**：P2-15（记录决策理由即可）

> **调整说明**：阶段三（project.ts 基础函数）应先于阶段二（doctor.ts/diff.ts 命令函数）执行，因为命令函数会调用基础函数。自底向上迁移可减少级联修改的复杂度。

---

**文档生成时间**：2026-06-30
