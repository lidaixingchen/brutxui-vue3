# `packages/cli` 兼容性与历史包袱审查报告

> 审查日期：2026-06-30
> 审查范围：packages/cli 完整代码库
> 审查人：AI Assistant

---

## 目录

- [1. 依赖版本风险](#1-依赖版本风险)
- [2. 代码质量问题](#2-代码质量问题)
- [3. 安全隐患](#3-安全隐患)
- [4. 架构债务](#4-架构债务)
- [5. 配置与构建问题](#5-配置与构建问题)
- [6. 遗留代码与命名问题](#6-遗留代码与命名问题)
- [7. 测试覆盖分析](#7-测试覆盖分析)
- [8. 总结](#8-总结)
- [9. 优先修复建议](#9-优先修复建议)

---

## 1. 依赖版本风险

| 依赖 | 当前版本 | 问题 |
|------|----------|------|
| TypeScript | `^6.0.3` | 非常新，生态兼容性未充分验证 |
| Node.js | `@types/node: ^25.9.1` | 未来版本，可能包含不稳定 API |
| Vitest | `^4.1.8` | 较新版本 |
| chalk | `^5.3.0` | ESM-only，与 `createRequire` 混用存在风险 |
| commander | `^15.0.0` | 大版本跳跃，API 可能有 breaking changes |

**关键发现**：`tsconfig.json:10` 中 `"ignoreDeprecations": "6.0"` 表明存在 TypeScript 向后兼容问题需要忽略。

```json
{
    "compilerOptions": {
        "ignoreDeprecations": "6.0" // ← 技术债标记
    }
}
```

---

## 2. 代码质量问题

### 2.1 重新发明轮子

`project.ts:56-160` 中的 `stripJsonComments` 和 `stripJsonTrailingCommas` 函数是手写的 JSONC 解析器，共约 100 行代码。

**当前实现**：
```typescript
function stripJsonComments(content: string): string {
    // 约 50 行手写解析逻辑
}

function stripJsonTrailingCommas(content: string): string {
    // 约 50 行手写解析逻辑
}
```

**建议**：使用成熟的 `jsonc-parser` 库（VS Code 使用的同一库）。

### 2.2 类型安全改进建议

`registry.ts` 中的 `as` 类型断言已有运行时验证函数保护（`validateRegistryFile`、`validateBrutalistConfig`），但仍有改进空间：

```typescript
// registry.ts:15-16 - 在 validateRegistryFile 函数内，已有类型守卫
function validateRegistryFile(file: unknown, itemName: string): file is RegistryFile {
    // ... 运行时验证逻辑
    const f = file as Record<string, unknown>;  // 验证后使用，相对安全
}

// registry.ts:96 - 在 validateBrutalistConfig 函数内，已有类型守卫
function validateBrutalistConfig(data: unknown): asserts data is Record<string, unknown> {
    // ... 运行时验证逻辑
    const config = data as Record<string, unknown>;  // 验证后使用
}
```

**建议**：虽然已有验证，但可考虑使用 TypeScript 的类型窄化特性减少 `as` 断言：
```typescript
// 使用类型守卫替代 as
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

### 2.3 测试困难的设计

多个命令直接调用 `process.exit(1)`：

- `add.ts:37` - 配置文件未找到
- `add.ts:50` - 无效组件
- `add.ts:66` - 无组件指定
- `doctor.ts:368` - 存在错误
- `diff.ts:257` - 配置文件未找到

**建议**：抛出自定义错误，由入口点统一处理退出。

### 2.4 重复代码

`doctor.ts:12-18` 和 `diff.ts:9-15` 各自实现了相同的 `readConfigSafe` 函数：

```typescript
// doctor.ts
async function readConfigSafe(cwd: string): Promise<BrutalistConfig | null> {
    try {
        return await readConfig(cwd);
    } catch {
        return null;
    }
}

// diff.ts - 完全相同的实现
async function readConfigSafe(cwd: string): Promise<BrutalistConfig | null> {
    try {
        return await readConfig(cwd);
    } catch {
        return null;
    }
}
```

**建议**：提取到 `registry.ts` 中作为公共函数。

---

## 3. 安全隐患

### 3.1 命令注入防护（已缓解）

`package-manager.ts:27-31`：

```typescript
execFileSync(command, [...baseArgs, '--', ...sanitized], {
    stdio: 'inherit',
    cwd,
    shell: isWindows,  // Windows 上需要 shell: true 处理 .cmd/.bat 包装器
});
```

**现有防护措施**：

- ✅ 使用 `sanitizePackageName` 过滤非法字符
- ✅ 使用 `--` 分隔参数，防止参数注入
- ✅ 使用 `execFileSync` 而非 `exec`，避免 shell 注入

**说明**：Windows 上 `shell: true` 是处理 `.cmd`/`.bat` 包装器的必要做法，已有充分防护。

### 3.2 路径解析边界情况（已缓解）

`project.ts:286-310` 的 `isSafePath` 使用 `realpathSync`，对于不存在的路径会回退到 `path.resolve`：

```typescript
try {
    resolvedTarget = normalize(fs.realpathSync(path.resolve(targetPath)));
    resolvedCwd = normalize(fs.realpathSync(path.resolve(cwd)));
} catch {
    // 如果 realpathSync 失败（如路径不存在），回退到 path.resolve
    resolvedTarget = normalize(path.resolve(targetPath));
    resolvedCwd = normalize(path.resolve(cwd));
}
```

**分析**：

- 回退仅在路径不存在时触发
- 不存在的路径无法构成符号链接攻击
- 这是合理的防御性编程

**建议**：当前实现已足够安全，如需进一步加固，可添加日志记录回退情况。

---

## 4. 架构债务

### 4.1 单例 Logger 无依赖注入

`logger.ts` 使用全局单例：

```typescript
class Logger {
    private silent: boolean = false;
    // ...
}

export const logger = new Logger();
```

**问题**：
- 测试时难以捕获日志输出
- 无法在不同上下文中使用不同配置
- 违反依赖注入原则

**建议**：改为依赖注入或提供 logger 工厂。

### 4.2 错误处理不一致

| 文件 | 错误处理方式 |
|------|-------------|
| `init.ts` | `process.exit(1)` |
| `add.ts` | `process.exit(1)` |
| `doctor.ts` | `process.exit(1)` |
| `diff.ts` | `process.exit(1)` |

但没有统一的错误类型定义，建议定义：

```typescript
class CliError extends Error {
    constructor(message: string, public code: number = 1) {
        super(message);
    }
}
```

### 4.3 职责不清晰

`resolveAliasPath` 函数既负责路径解析又负责安全检查：

```typescript
export function resolveAliasPath(alias: string, cwd: string): string {
    // ... 路径解析逻辑 ...

    if (!isSafePath(resolvedPath, cwd)) {
        throw new Error(`安全检查失败...`);
    }

    return resolvedPath;
}
```

**建议**：将安全检查分离为独立的中间件或装饰器。

---

## 5. 配置与构建问题

### 5.1 TypeScript 配置

`tsconfig.json`：

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "lib": ["ES2022"],
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "ignoreDeprecations": "6.0",  // ← 技术债
        "esModuleInterop": true,
        "skipLibCheck": true,
        "declaration": true,
        "resolveJsonModule": true
    }
}
```

`"ignoreDeprecations": "6.0"` 是明确的技术债务标记，表明代码使用了 TypeScript 6.0 中已弃用的特性。

### 5.2 构建目标不匹配

`tsup.config.ts:9`：

```typescript
target: 'node22',
```

Node.js 22 是当前 LTS，但 `@types/node: ^25.9.1` 指向未来版本，存在类型与运行时不匹配风险。

**建议**：将 `@types/node` 降级到与 Node.js 22 匹配的版本。

### 5.3 ESM/CJS 混合

`index.ts:8-9`：

```typescript
const require = createRequire(import.meta.url);
const pkg = require('../package.json');
```

在 ESM 模块中使用 `createRequire` 加载 JSON，这是一种 workaround。建议使用：

```typescript
import pkg from '../package.json' with { type: 'json' };
```

或使用 `fs.readFileSync` + `JSON.parse`。

---

## 6. 遗留代码与命名问题

### 6.1 包名不一致

| 上下文 | 名称 |
|--------|------|
| npm 包名 | `brutx-vue` |
| CLI 命令 | `brutx-vue` |
| 代码注释 | `Brutx-Vue` |
| 仓库名 | `brutxui-vue3` |
| 文档链接 | `brutxui-vue3` |

建议统一命名规范。

### 6.2 类型别名保留

`types.ts:53`：

```typescript
export type { ComponentMeta as ComponentInfo } from 'brutx-shared-vue';
```

保留了旧名称 `ComponentInfo` 作为别名，增加了认知负担。如果不再需要向后兼容，建议移除。

### 6.3 CSS 常量文件

`constants.ts:56-199` 包含约 150 行 CSS 变量定义：

```typescript
export const BRUTALIST_CSS_STYLES = `
@theme {
    // ... 约 30 行主题变量
}

:root {
    // ... 约 30 行根变量
}

.dark {
    // ... 约 30 行暗色主题变量
}

.theme-classic {
    // ... 约 30 行经典主题变量
}

.dark .theme-classic,
.theme-classic.dark {
    // ... 约 30 行组合主题变量
}
`;
```

**建议**：

- 分离到独立 `.css` 文件
- 使用 CSS-in-JS 工具或 PostCSS 插件
- 或至少分割为多个逻辑块（主题、工具类、动画等）

### 6.4 魔法字符串

多处使用硬编码字符串：

```typescript
// init.ts:44
const fallbackCss = projectType === 'nuxt'
    ? 'assets/css/main.css'
    : (projectType.includes('src') ? 'src/index.css' : 'index.css');

// registry.ts:193
itemSource = `https://raw.githubusercontent.com/lidaixingchen/brutxui-vue3/${version}/packages/registry/registry`;
```

**建议**：提取为常量。

---

## 7. 测试覆盖分析

| 测试文件 | 覆盖范围 | 缺失 |
|----------|----------|------|
| `init.test.ts` | 样式注入 | 无配置文件场景、错误处理 |
| `registry.test.ts` | 依赖解析 | 超时处理、网络错误 |
| `project.test.ts` | 路径解析 | 边界情况、Windows 路径 |
| `security.test.ts` | 路径遍历 | 符号链接攻击 |

**严重缺失**：无以下命令的单元测试：
- `add.test.ts` - 添加组件命令
- `doctor.test.ts` - 健康检查命令
- `diff.test.ts` - 差异比较命令

**集成测试**：只有 `tests/integration/cli-smoke.test.ts`，覆盖有限。

---

## 8. 总结

| 类别 | 严重程度 | 数量 | 示例 |
|------|----------|------|------|
| 安全隐患 | 🟡 中 | 2 | 命令注入（已缓解）、路径解析（已缓解） |
| 架构债务 | 🟡 中 | 5 | 单例 Logger、错误处理 |
| 代码质量 | 🟡 中 | 4 | 重复代码、类型断言改进建议 |
| 依赖风险 | 🟡 中 | 3 | 版本不匹配、ESM/CJS |
| 遗留代码 | 🟢 低 | 4 | 命名不一致、魔法字符串 |

---

## 9. 优先修复建议

### 立即修复（P0）

1. **统一错误处理**
   - 定义 `CliError` 类
   - 移除所有 `process.exit()` 调用
   - 在入口点统一捕获并处理

2. **改进类型安全**
   - 优化现有类型守卫函数
   - 减少 `as` 断言的使用（当前已有运行时验证）

### 短期修复（P1）

3. **替换 JSONC 解析器**
   - 使用 `jsonc-parser` 库
   - 移除手写的 100 行解析代码

4. **提取重复代码**
   - 将 `readConfigSafe` 移到 `registry.ts`
   - 统一错误处理模式

### 中期修复（P2）

5. **重构 Logger**
   - 改为依赖注入模式
   - 支持测试时捕获输出

6. **对齐依赖版本**
   - 降级 `@types/node` 到 Node.js 22 匹配版本
   - 验证 TypeScript 6.0 兼容性

### 长期改进（P3）

7. **分离 CSS 常量**
   - 移到独立 `.css` 文件
   - 构建时注入

8. **补充测试覆盖**
   - 为 `add`、`doctor`、`diff` 命令添加单元测试
   - 增加边界情况测试

---

## 附录：相关文件清单

```
packages/cli/
├── src/
│   ├── index.ts              # 入口点
│   ├── commands/
│   │   ├── init.ts           # init 命令
│   │   ├── add.ts            # add 命令
│   │   ├── doctor.ts         # doctor 命令
│   │   └── diff.ts           # diff 命令
│   └── lib/
│       ├── index.ts          # 导出汇总
│       ├── types.ts          # 类型定义
│       ├── constants.ts      # 常量定义
│       ├── package-manager.ts # 包管理器
│       ├── project.ts        # 项目检测
│       ├── registry.ts       # 注册表操作
│       └── logger.ts         # 日志工具
├── tests/
│   ├── init.test.ts
│   ├── registry.test.ts
│   ├── project.test.ts
│   ├── security.test.ts
│   └── integration/
│       └── cli-smoke.test.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```
