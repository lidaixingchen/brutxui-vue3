---
方案类型: CLI 规则引擎扩展与 CI/CD 基础设施深化
状态: done
日期: 2026-08-29
---

# CLI诊断引擎开放化与CI原生支持方案

---

## 一、 背景与第一性原理

### 1. 现状痛点与问题本质

在 BrutxUI Vue 3 CLI（`packages/cli`）现有的诊断引擎架构中，`DiagnosticEngine` 实现了五大领域内置规则集（`env` / `config` / `tailwind` / `structure` / `integrity`），并通过无副作用的纯数据巡检与原子自愈事务契约提供了健壮的健康检查能力。

然而，随着 BrutxUI 在企业级项目和复杂 Monorepo 中的广泛应用，现有的诊断引擎在**规则开放度**和**持续集成（CI/CD）集成度**两个维度暴露出明显的结构性瓶颈：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       现有 DiagnosticEngine 架构局限分析                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. 规则集完全内置硬编码 (Hardcoded BUILTIN_RULES)                            │
│    ├─ DiagnosticEngine 构造函数写死 BUILTIN_RULES，无动态加载外部规则的能力    │
│    ├─ 团队无法定义自身特有的架构合规规则（如“禁止在 UI 组件内直接导入全局     │
│    │  store”、“强制所有业务包装组件使用特定命名空间前缀”等）                 │
│    └─ 无法覆盖团队特有的代码规范、依赖限制与定制化目录拓扑规范              │
│                                                                             │
│ 2. 规则定制与严重级别调整能力缺失 (No Rule Overrides / Severity Tuning)      │
│    ├─ 用户无法在 components.json 中禁用特定内置规则 (如离线内网环境下跳过    │
│    │  网络源探活，或在特定微前端架构中放宽 structure 检查)                   │
│    └─ 无法将特定警告（warn）提升为阻断级错误（error）以实施严格架构把关      │
│                                                                             │
│ 3. CI/CD 原生输出与工作流集成不足 (Limited CI Integration)                   │
│    ├─ 终端输出深度绑定 chalk/ora 彩色交互文本，只适合开发者本地 TTY 调试     │
│    ├─ --json 仅简单打印 CheckResult[] 数组，缺乏机器可读的汇总统计与执行元数据│
│    ├─ 缺失 GitHub Actions Workflow Commands (::error / ::warning) 原生支持， │
│    │  无法在 GitHub PR 的 Files Changed 界面实现行级错误高亮与定位           │
│    ├─ 缺失 OASIS SARIF 2.1.0 标准输出，无法对接 GitHub Code Scanning /      │
│    │  GitLab SAST / VSCode 等主流静态分析安全平台                            │
│    └─ 缺乏细粒度 CI 门禁控制（如 --fail-on warn|error|drift 与 Step Summary）│
└─────────────────────────────────────────────────────────────────────────────┘
```

#### (1) 规则封闭性的第一性原理剖析
- **开闭原则（OCP）违背**：诊断系统的本质是一个**可插拔的静态分析与环境治理运行时**。当规则集被硬编码在包内部时，任何外部规范的扩展都被迫需要通过 fork 源码或编写外围脚本实现，割裂了统一的自愈与检查入口。
- **业务上下文与通用基座的分离**：BrutxUI 官方规则关注的是“BrutxUI 自身的正确安装与运行环境”，而工程团队关注的是“在消费 BrutxUI 时团队制定的架构红线与编码契约”。这两者应该在同一套引擎接口下协同执行。

#### (2) CI 输出割裂的第一性原理剖析
- **信息密度的分层消费模型**：
  - 本地交互（Local TTY）：强调视觉美观、颜色辨识度、动态进度与交互式一键自愈。
  - CI 执行日志（Raw CI Logs）：强调确定性、时间戳、免交互非阻塞（Non-Interactive TTY Guard）。
  - 代码评审界面（PR / MR View）：强调**行级精确定位**（Annotations）与**无侵入可视化**（Job Summary），让审查者在不翻阅几千行日志的情况下直击问题根源。
  - 平台安全分析（Security / SAST）：强调结构化资产、标准化 CWE / Rule 分类与统一的扫描结果互换格式。

---

## 二、 方案探索与架构突破

从模块隔离、跨环境兼容性、静态分析行业标准以及类型安全的第一性原理出发，探索更完备的架构方案：

### 1. 规则插件化扩展探索：从静态脚本引入到「多格式零配置动态加载沙箱」

| 维度 | 方案 A：原生 `require()` / `import()` 单文件 | 方案 B：仅支持配置 NPM 规则包 | 方案 C（推荐）：`CustomRuleLoader` + 故障隔离沙箱 + DSL 辅助函数 |
| :--- | :--- | :--- | :--- |
| **文件格式支持** | 仅支持 `.js` / `.cjs`（受 Node 模块解析限制） | 必须先发布或 link 到 node_modules | **全面支持** `.ts` / `.js` / `.mjs` / `.cjs` 及 NPM 包路径（基于 `jiti` 零配置即时转译） |
| **开发体验 (DX)** | 无类型提示，靠文档猜测入参类型 | 依赖外部包构建与发布流程 | **提供 `defineDiagnosticRule` / `defineDiagnosticRules`**，享有全量 TypeScript 类型推断与 IDE 自动补全 |
| **运行时健壮性** | 外部规则抛错直接导致 CLI 崩溃 | 外部规则抛错直接导致 CLI 崩溃 | **故障隔离沙箱（Fault Isolation）**：将自定义规则未捕获异常降级为规则级错误，保障主检查流程不中断 |
| **规则调优配置** | 无法调整已有规则 | 无法调整已有规则 | **支持规则覆盖机制（Rule Overrides）**：可在 `components.json` 中配置 `rules: { "id": "off" | "warn" | "error" }` |

#### 方案 C 核心突破点：
1. **零配置 TypeScript / ESM 脚本加载**：引入轻量级转译运行时 `jiti`，允许开发者直接在项目 `scripts/brutx-rules.ts` 中使用现代 TypeScript 编写自定义规则，无需任何前置构建步骤。
2. **规则定义 DSL 与类型安全**：对外导出强类型的 `defineDiagnosticRule` / `defineDiagnosticRules` 辅助工厂函数，开发者可以便捷地访问完整的 `DiagnosticContext` 与 `DiagnosticRepairContext`。
3. **故障隔离与上下文防御**：自定义规则在独立的 `try-catch` 沙箱切面中运行，规则执行抛错或未捕获异常会被自动转换为标准化的 `CheckResult`（`status: 'error'`, `category: 'custom'`），并在报告中精准指示出错的规则文件与调用栈。

---

### 2. CI 原生支持探索：从单一命令参数到「多态 Reporter 矩阵与 GitHub Step Summary」

| 维度 | 方案 A：仅增加 `--ci` 输出 `::error` | 方案 B：仅保留 `--json` 让用户自行解析 | 方案 C（推荐）：多态 Reporter 矩阵 + 智能 CI 环境感知 + Step Summary 看板 |
| :--- | :--- | :--- | :--- |
| **输出格式丰富度** | 单一，深度绑定 GitHub Actions 语法 | 单一，需要外部 jq / 脚本处理 | **多态矩阵**：`pretty` (TTY), `github` (Annotations), `json` (纯数据), `sarif` (OASIS 标准), `junit` (XML) |
| **CI 环境自适应** | 必须手动传 `--ci` 参数 | 必须手动编排流水线命令 | **自动嗅探 CI 环境变量**（`GITHUB_ACTIONS`, `GITLAB_CI`, `CI=true`），默认开启 CI 安全防御 |
| **PR 可视化呈现** | 仅有 Files Changed 行级 Annotation | 无 | **双轨协同**：Files Changed 标注行级错误 + `$GITHUB_STEP_SUMMARY` 输出 Markdown 汇总仪表盘看板 |
| **安全平台对接** | 不支持 | 需手动转换 | **SARIF 2.1.0 产物**直接对接 GitHub Code Scanning、GitLab SAST 与 SonarQube |
| **退出门禁策略** | 仅对 `error` 状态返回非零 | 固定退出码 | **细粒度门禁 `--fail-on <error|warn|drift>`**，支持零容忍严格模式 |

---

## 三、 详细架构设计

### 1. 全局架构拓扑图

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Diagnostic System Architecture                            │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│   components.json Configuration                                                           │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │ {                                                                                 │   │
│   │   "plugins": ["./scripts/custom-rules.ts", "@my-org/brutx-rules"],                │   │
│   │   "rules": {                                                                      │   │
│   │     "tailwind.tokens": "error",                                                   │   │
│   │     "env.node-version": "warn",                                                   │   │
│   │     "custom.no-global-store": "error"                                             │   │
│   │   }                                                                               │   │
│   │ }                                                                                 │   │
│   └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                               │
│                                           ▼                                               │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │ CustomRuleLoader (Jiti / Dynamic Import Pipeline)                                  │   │
│   │ ├─ 解析路径 (跨平台绝对路径 / TS 别名 / node_modules)                              │   │
│   │ ├─ Jiti 即时转译加载 TS/ESM 规则脚本 (支持 default 展开与路径规范化)              │   │
│   │ └─ 校验 DiagnosticRule 接口契约与唯一 ID 命名空间                                 │   │
│   └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                               │
│                                           ▼                                               │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │ DiagnosticEngine (Rule Registry & Execution Sandbox)                              │   │
│   │ ├─ 内置规则集 (BUILTIN_RULES: env / config / tailwind / structure / integrity)    │   │
│   │ ├─ 自定义插件规则集 (Custom Rules: custom.*)                                      │   │
│   │ ├─ 规则过滤与严重级别调优拦截器 (RuleFilter & SeverityOverride)                    │   │
│   │ ├─ 故障隔离执行器 (Fault-Isolated Sandbox Guard)                                  │   │
│   │ └─ 原子自愈事务绑定 (ProjectContext.bindConfig & FileTransaction)                  │   │
│   └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                               │
│                                           ▼                                               │
│                                    DiagnosticReport                                       │
│                                           │                                               │
│                                           ▼                                               │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │ Multi-Reporter Matrix                                                             │   │
│   │ ├─ PrettyReporter        ───▶ 终端彩色交互 / Ora Spinner / 树形展示               │   │
│   │ ├─ GithubReporter        ───▶ RFC 转义 ::error/::warning + Step Summary 追加MD    │   │
│   │ ├─ JsonReporter          ───▶ 完整机器可读 JSON (Metadata + Checks + Stats)       │   │
│   │ ├─ SarifReporter         ───▶ OASIS SARIF 2.1.0 (POSIX 相对路径 + ruleIndex 映射) │   │
│   │ └─ JunitReporter         ───▶ JUnit XML (GitLab CI / Jenkins 测试套件)            │   │
│   └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. 核心接口与数据模型

#### (1) 配置扩展契约（`components.json`）

在 `packages/cli/src/lib/types.ts` 与 `packages/cli/schema.json` 中同步扩充 `plugins` 与 `rules` 字段：

```typescript
export type RuleSeverity = 'off' | 'warn' | 'error';

export interface BrutalistConfig {
    $schema?: string;
    $version?: number;
    style: string;
    tailwind: TailwindConfig;
    aliases: AliasConfig;
    sharedBase?: string;
    workspace?: BrutalistWorkspaceConfig;
    registries?: string[];
    requireSignature?: boolean;
    trustedPublicKeys?: TrustedPublicKey[];

    /**
     * 自定义诊断规则插件列表。
     * 支持本地相对路径（如 "./scripts/my-rule.ts"）或 npm 包（如 "@org/brutx-rules"）。
     */
    plugins?: string[];

    /**
     * 规则严重级别调优与开关映射表。
     * 键为 ruleId（如 "tailwind.tokens" 或 "custom.no-global-store"），
     * 值为 "off"（禁用）、"warn"（警告）或 "error"（错误）。
     */
    rules?: Record<string, RuleSeverity>;
}
```

#### (2) 自定义规则与位置契约（`DiagnosticRule`）

```typescript
export interface FileLocation {
    /** 相对工作区根目录的文件路径（统一使用 POSIX 格式） */
    readonly file: string;
    /** 起始行号（1-indexed） */
    readonly line?: number;
    /** 起始列号（1-indexed） */
    readonly column?: number;
    /** 结束行号（1-indexed） */
    readonly endLine?: number;
    /** 结束列号（1-indexed） */
    readonly endColumn?: number;
}

export interface CheckResult {
    /** 规则唯一标识，如 'env.node-version', 'custom.no-global-store' */
    readonly ruleId: string;
    /** 人类可读的检查项名称 */
    readonly name: string;
    /** 检查状态 */
    readonly status: CheckStatus;
    /** 详细描述信息 */
    readonly message: string;
    /** 可选的具体文件行列位置（用于 CI Annotation 与 IDE 定位） */
    readonly location?: FileLocation;
    /** 可自愈的修复 ID 枚举或自定义修复标识 */
    readonly fixId?: FixId | string;
    /** 修复操作简要说明 */
    readonly fixDescription?: string;
    /** 关联的组件名（若为组件级检查） */
    readonly componentName?: string;
    /** 领域分类 */
    readonly category?: DiagnosticCategory | 'custom';
    /** 规则帮助文档 URL（在 CI / SARIF 中提供一键直达指引） */
    readonly helpUrl?: string;
}

export interface DiagnosticRule {
    /** 规则唯一标识，自定义规则推荐以 'custom.' 为前缀 */
    readonly id: string;
    /** 规则所属领域分类 */
    readonly category: DiagnosticCategory | 'custom';
    /** 人类可读名称 */
    readonly name: string;
    /** 默认严重级别（默认为 error） */
    readonly defaultSeverity?: 'warn' | 'error';
    /** 是否需要有效的 components.json 配置 */
    readonly requiresConfig?: boolean;
    /** 是否涉及网络请求 */
    readonly network?: boolean;
    /** 帮助文档链接 */
    readonly helpUrl?: string;
    /** 纯只读巡检算子 */
    check(ctx: DiagnosticContext): Promise<CheckResult | CheckResult[]>;
    /**
     * 可选的原子自愈算子。
     * 约束：禁止在 fix 中直接使用 node:fs 进行物理磁盘操作，
     * 所有文件写操作必须调用 ctx.transaction 或 ctx.fs，配置写操作必须调用 ctx.markConfigDirty()。
     */
    fix?(ctx: DiagnosticRepairContext, result: CheckResult): Promise<RuleFixResult>;
}
```

#### (3) 规则定义 DSL 辅助函数与导出

在 `packages/cli/src/api.ts` 与包根导出中导出工厂辅助函数：

```typescript
/**
 * 定义单个 BrutxUI 诊断规则（提供完整的 TypeScript 类型推导）
 */
export function defineDiagnosticRule(rule: DiagnosticRule): DiagnosticRule {
    return rule;
}

/**
 * 批量定义 BrutxUI 诊断规则插件
 */
export function defineDiagnosticRules(rules: DiagnosticRule[]): DiagnosticRule[] {
    return rules;
}
```

#### (4) 动态加载器与故障隔离沙箱实现契约（`CustomRuleLoader`）

```typescript
import { createJiti } from 'jiti';
import path from 'path';

export class CustomRuleLoader {
    private readonly jiti: ReturnType<typeof createJiti>;

    constructor(private readonly cwd: string) {
        this.jiti = createJiti(cwd, {
            interopDefault: true,
            esmResolve: true,
            cache: false,
        });
    }

    async loadPlugin(pluginPath: string): Promise<DiagnosticRule[]> {
        const resolvedPath = pluginPath.startsWith('.')
            ? path.resolve(this.cwd, pluginPath)
            : pluginPath;

        try {
            const rawModule = await this.jiti.import(resolvedPath);
            const exported = (rawModule && typeof rawModule === 'object' && 'default' in rawModule)
                ? (rawModule as { default: unknown }).default
                : rawModule;

            const rulesArray = Array.isArray(exported) ? exported : [exported];
            return rulesArray.filter((r): r is DiagnosticRule => this.validateRuleContract(r));
        } catch (error) {
            // 转换为规则加载失败的错误结果，防止主流程崩溃
            return [
                {
                    id: `custom.loader-error.${path.basename(pluginPath)}`,
                    category: 'custom',
                    name: `Plugin Load Error: ${pluginPath}`,
                    defaultSeverity: 'error',
                    check: async () => ({
                        ruleId: `custom.loader-error.${path.basename(pluginPath)}`,
                        category: 'custom',
                        name: `Failed to load plugin: ${pluginPath}`,
                        status: 'error',
                        message: error instanceof Error ? error.message : String(error),
                    }),
                },
            ];
        }
    }

    private validateRuleContract(rule: unknown): rule is DiagnosticRule {
        return (
            typeof rule === 'object' &&
            rule !== null &&
            'id' in rule &&
            typeof (rule as DiagnosticRule).id === 'string' &&
            'check' in rule &&
            typeof (rule as DiagnosticRule).check === 'function'
        );
    }
}
```

**用户自定义规则编写示例（`scripts/custom-rules.ts`）**：

```typescript
import { defineDiagnosticRules } from 'brutx-vue/api';

export default defineDiagnosticRules([
    {
        id: 'custom.no-pinia-in-ui',
        category: 'custom',
        name: 'No Global Store in Base UI Components',
        defaultSeverity: 'error',
        requiresConfig: true,
        helpUrl: 'https://internal.wiki.org/arch/ui-guidelines',
        async check(ctx) {
            const results = [];
            const componentsDir = await ctx.projectContext.resolveAliasPath(ctx.config.aliases.components);
            const uiFiles = await ctx.fs.glob('**/*.vue', { cwd: componentsDir });

            for (const file of uiFiles) {
                const fullPath = ctx.fs.join(componentsDir, file);
                const content = await ctx.fs.readFile(fullPath, 'utf-8');
                const match = /import\s+.*from\s+['"]@\/stores\/.*['"]/.exec(content);

                if (match) {
                    const lines = content.slice(0, match.index).split('\n');
                    results.push({
                        ruleId: 'custom.no-pinia-in-ui',
                        category: 'custom' as const,
                        name: 'Forbidden Global Store Import',
                        status: 'error' as const,
                        message: `Base UI component should not depend on global store: ${file}`,
                        location: {
                            file: `src/components/${file}`,
                            line: lines.length,
                        },
                    });
                }
            }

            return results.length > 0
                ? results
                : {
                    ruleId: 'custom.no-pinia-in-ui',
                    category: 'custom',
                    name: 'No Global Store in Base UI Components',
                    status: 'pass',
                    message: 'All UI components follow architectural isolation rules.',
                };
        },
    },
]);
```

---

### 3. 多态 Reporter 与 CI 集成管线设计

#### (1) Reporter 抽象接口与分发器

```typescript
export interface ReporterOptions {
    cwd: string;
    failOn?: 'error' | 'warn' | 'drift';
    silent?: boolean;
    outputFile?: string;
}

export interface DiagnosticReporter {
    readonly name: string;
    render(report: DiagnosticReport, options: ReporterOptions): Promise<void>;
}
```

#### (2) GitHub Actions Reporter（Annotations 与 Step Summary 看板）

`GithubReporter` 必须严格遵循 GitHub Actions Workflow Commands RFC 转义规范与 Step Summary 追加写入契约：

##### 字符转义规范
```typescript
function escapeProperty(value: string): string {
    return value
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}

function escapeData(value: string): string {
    return value
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
```

##### Annotations 输出逻辑
- 遍历 `report.checks` 中状态为 `error` 或 `warn` 的项：
  - 若包含 `location`：输出 `::${command} file=${escapeProperty(location.file)},line=${location.line ?? 1},col=${location.column ?? 1},title=${escapeProperty(check.name)}::${escapeData(check.message)}`
  - 若无具体行号：输出 `::${command} title=${escapeProperty(check.name)}::${escapeData(check.message)}`

##### `$GITHUB_STEP_SUMMARY` 追加与安全截断防护
- 检测到 `process.env.GITHUB_STEP_SUMMARY` 时，必须使用追加模式（`fs.appendFile`）写入 Markdown。
- 设定最大渲染问题上限（50 项），超出部分输出省略提示，严格防范超出 GitHub 1MB 单文件限制：

```markdown
## 🎨 Brutx-Vue Doctor Report

| 规则指标 | 状态 | 数量 |
| :--- | :--- | :--- |
| ✅ Passed | 正常 | 18 |
| ⚠️ Warnings | 警告 | 2 |
| ❌ Errors | 失败 | 1 |
| 🔧 Fixable | 可自愈 | 1 |

### ❌ 待解决问题

- **Forbidden Global Store Import** (`src/components/ui/button/button.vue:1`)
  - 规则 ID: `custom.no-pinia-in-ui`
  - 详情: Base UI component should not depend on global store: button.vue
  - 修复建议: 请解耦 store 依赖，通过 props 或 inject 传递状态。
```

#### (3) OASIS SARIF 2.1.0 静态分析报告器契约

`SarifReporter` 生成符合 OASIS 标准的 JSON 产物，其文件路径必须统一归一化为相对于工作区根目录的 POSIX 相对路径，并在 `driver.rules` 与 `results` 之间建立精确的 `ruleIndex` 索引：

```json
{
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "version": "2.1.0",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "brutx-vue doctor",
          "version": "0.11.1",
          "informationUri": "https://github.com/lidaixingchen/brutxui-vue3",
          "rules": [
            {
              "id": "custom.no-pinia-in-ui",
              "name": "NoPiniaInUi",
              "shortDescription": { "text": "Base UI components must not import global store" },
              "helpUri": "https://internal.wiki.org/arch/ui-guidelines"
            }
          ]
        }
      },
      "results": [
        {
          "ruleId": "custom.no-pinia-in-ui",
          "ruleIndex": 0,
          "level": "error",
          "message": { "text": "Base UI component should not depend on global store: button.vue" },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": { "uri": "src/components/ui/button/button.vue" },
                "region": { "startLine": 1, "startColumn": 1 }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 4. 命令行契约、参数映射与退出码策略

#### (1) 参数映射与优先级收敛策略

| 参数 / 环境变量 | 解析行为与优先级 |
| :--- | :--- |
| `--reporter <format>` | 最高优先级。支持 `pretty` \| `github` \| `json` \| `sarif` \| `junit`。 |
| `--json` | 向后兼容映射。若未指定 `--reporter`，则等价于 `--reporter json`。 |
| `CI 环境变量` (`GITHUB_ACTIONS=true` / `CI=true`) | 当未指定 `--reporter` 且无 `--json` 时：在 GitHub Actions 环境中默认激活 `github` reporter；在常规 CI 环境中默认激活非交互式 `pretty` reporter。 |
| `--fail-on <error\|warn\|drift>` | 细粒度门禁控制。默认值为 `error`。 |

#### (2) 退出码（Exit Code）判定算法

```typescript
export function determineExitCode(
    report: DiagnosticReport,
    failOn: 'error' | 'warn' | 'drift' = 'error'
): number {
    if (failOn === 'warn') {
        return (report.hasErrors || report.hasWarnings) ? 1 : 0;
    }
    if (failOn === 'drift') {
        const hasDrift = report.checks.some(
            c => c.category === 'integrity' && c.status !== 'pass'
        );
        return (report.hasErrors || hasDrift) ? 1 : 0;
    }
    // 默认 failOn === 'error'
    return report.hasErrors ? 1 : 0;
}
```

#### (3) 命令行调用范式

```bash
# 1. 本地交互检查与一键自愈
brutx-vue doctor
brutx-vue doctor --fix

# 2. CI 门禁检查（自动探测 CI 环境并输出 GitHub Annotations + 阻断退出码）
brutx-vue doctor --ci

# 3. 显式指定 Reporter 格式与产物持久化
brutx-vue doctor --reporter github
brutx-vue doctor --reporter sarif --output-file ./reports/doctor.sarif
brutx-vue doctor --reporter junit --output-file ./reports/junit.xml
brutx-vue doctor --reporter json

# 4. 严格质量门禁（存在任何 warning 均阻断流水线）
brutx-vue doctor --ci --fail-on warn
```

---

## 四、 实施路线与测试验证

### 1. 实施阶段拆解

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   四阶段实施里程碑                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 阶段 1：Schema 同步、规则类型扩展与加载器构建                                            │
│   ├─ 更新 packages/cli/schema.json，同步扩充 plugins 与 rules 字段定义                  │
│   ├─ 引入 jiti 依赖并实现 CustomRuleLoader（支持 TS/ESM 动态即时转译与沙箱隔离）        │
│   └─ 重构 DiagnosticEngine，支持动态规则挂载与 components.json 中 rules 严重级别重写    │
│                                                                                        │
│ 阶段 2：多态 Reporter 体系实现与标准协议对齐                                          │
│   ├─ 实现 PrettyReporter（剥离终端交互，形成独立渲染层）                               │
│   ├─ 实现 GithubReporter（RFC 字符转义、::error/::warning、Step Summary 追加截断）     │
│   ├─ 实现 SarifReporter（POSIX 路径归一化、driver.rules 元数据字典与 ruleIndex 映射）  │
│   └─ 实现 JsonReporter 与 JunitReporter                                                │
│                                                                                        │
│ 阶段 3：CLI 命令层接入、CI 智能感知与门禁控制                                          │
│   ├─ 重构 packages/cli/src/commands/doctor.ts，接入 --reporter / --ci / --fail-on 选项 │
│   ├─ 实现参数优先级收敛与 CI 环境变量自动嗅探                                           │
│   └─ 落地细粒度 determineExitCode 退出码机制                                           │
│                                                                                        │
│ 阶段 4：公共 API 导出与文档同步                                                        │
│   ├─ packages/cli/src/api.ts 对外导出 defineDiagnosticRule 与 defineDiagnosticRules    │
│   └─ 更新使用文档与配置示例                                                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2. 自动化测试与质量门禁

- **单元测试（基于 MemoryFS 零 IO 测试套件）**：
  - **加载器测试**：测试 `CustomRuleLoader` 加载 `.ts`、`.js` 自定义规则及 NPM 模块。
  - **沙箱容错测试**：模拟自定义规则抛出未捕获异常，验证错误是否被安全捕获并降级为规则级 `error`。
  - **覆盖调优测试**：测试 `rules: { "env.node-version": "off" }` 规则禁用与 `warn -> error` 级别提升。
  - **GitHub Reporter 测试**：测试包含特殊字符（`%`、`\n`、`:`）的消息转义，测试 `$GITHUB_STEP_SUMMARY` 追加写入与 50 条上限截断。
  - **SARIF Reporter 测试**：验证输出产物符合 OASIS SARIF 2.1.0 规范，验证 Windows 路径是否被转换为 POSIX 相对路径，验证 `ruleIndex` 映射正确性。
  - **自愈事务隔离测试**：验证在 `--dry-run` 模式下自定义规则的 `fix` 算子不会引起磁盘持久化写入。
- **CI 门禁与环境模拟测试**：
  - 验证模拟 `GITHUB_ACTIONS=true` 环境变量下的默认行为。
  - 验证 `--fail-on warn` 与 `--fail-on error` 在不同检查结果下的进程退出码（`0` / `1`）。
