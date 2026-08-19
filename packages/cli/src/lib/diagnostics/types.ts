import type { BrutalistConfig, BrutxManifest, CheckStatus } from '../types.js';
import { FixId } from '../types.js';
import type { ProjectContext } from '../project-context.js';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import type { FileTransaction } from '../file-transaction.js';

export type { CheckStatus };
export { FixId };
export type DiagnosticCategory = 'env' | 'config' | 'tailwind' | 'structure' | 'integrity';

export type RuleFixStatus = 'applied' | 'skipped' | 'failed';

export interface CheckResult {
    /** 产生该检查项的规则唯一标识，如 'env.node-version' */
    readonly ruleId: string;
    /** 人类可读的检查项名称 */
    readonly name: string;
    /** 检查状态 */
    readonly status: CheckStatus;
    /** 详细描述信息 */
    readonly message: string;
    /** 可自愈的修复 ID 枚举 */
    readonly fixId?: FixId;
    /** 修复操作简要说明 */
    readonly fixDescription?: string;
    /** 关联的组件名（若为组件级检查） */
    readonly componentName?: string;
    /** 领域分类 */
    readonly category?: DiagnosticCategory;
}

export interface RuleFixResult {
    /** 修复执行状态 */
    readonly status: RuleFixStatus;
    /** 状态附带的详细说明或失败原因 */
    readonly message?: string;
}

export interface DiagnosticContext {
    /** 工作目录绝对路径 */
    readonly cwd: string;
    /** 项目上下文聚合根（内置路径解析与 VFS） */
    readonly projectContext: ProjectContext;
    /** 文件系统适配器（DiskFS 或 MemoryFS） */
    readonly fs: FileSystemAdapter;
    /** 解析到的项目配置；未初始化或无效时为 null */
    readonly config: BrutalistConfig | null;
    /** 解析到的组件清单；无清单时为 null */
    readonly manifest: BrutxManifest | null;
    /** 是否处于离线模式 */
    readonly offline: boolean;
}

export interface DiagnosticRepairContext extends DiagnosticContext {
    /** 当前自愈会话绑定的统一事务实例（确保原子写回与回滚） */
    readonly transaction: FileTransaction;
    /** 当前可变的内存配置引用（与 projectContext.config 保持同源绑定） */
    readonly mutableConfig: BrutalistConfig;
    /** 标记配置对象是否被修复规则修改（引擎据此在事务中写回 components.json） */
    markConfigDirty: () => void;
}

export interface DiagnosticRule {
    /** 规则唯一标识，如 'config.schema', 'tailwind.tokens', 'integrity.hash-drift' */
    readonly id: string;
    /** 规则所属领域分类 */
    readonly category: DiagnosticCategory;
    /** 人类可读名称 */
    readonly name: string;
    /** 是否需要有效的 components.json 配置（为 true 且 config 为 null 时引擎自动短路跳过） */
    readonly requiresConfig?: boolean;
    /** 是否涉及远端网络请求（离线模式下由规则优雅降级） */
    readonly network?: boolean;
    /** 巡检函数：纯只读、无副作用 */
    check(ctx: DiagnosticContext): Promise<CheckResult | CheckResult[]>;
    /** 可选的修复算子：通过 DiagnosticRepairContext 执行原子写操作 */
    fix?(ctx: DiagnosticRepairContext, result: CheckResult): Promise<RuleFixResult>;
}

export interface DiagnosticSummary {
    readonly total: number;
    readonly passed: number;
    readonly warnings: number;
    readonly errors: number;
    readonly fixable: number;
}

export interface DiagnosticReport {
    readonly checks: CheckResult[];
    readonly summary: DiagnosticSummary;
    readonly hasErrors: boolean;
    readonly hasWarnings: boolean;
    readonly fixableCount: number;
    /** 按分类获取结果子集 */
    getByCategory(category: DiagnosticCategory): CheckResult[];
    /** 按状态获取结果子集 */
    getByStatus(status: CheckStatus): CheckResult[];
    /** 按规则 ID 获取结果 */
    getByRuleId(ruleId: string): CheckResult[];
}

export interface DiagnoseOptions {
    cwd?: string;
    offline?: boolean;
    categories?: DiagnosticCategory[];
    ruleIds?: string[];
    context?: ProjectContext;
    fs?: FileSystemAdapter;
}

export interface RepairOptions extends DiagnoseOptions {
    fixOnly?: FixId | string;
    /** 是否以演练模式运行（不持久化写入） */
    dryRun?: boolean;
}

export interface RepairItemReport {
    readonly ruleId: string;
    readonly checkName: string;
    readonly fixId: FixId;
    readonly status: RuleFixStatus;
    readonly message?: string;
}

export interface RepairReport {
    readonly applied: RepairItemReport[];
    readonly skipped: RepairItemReport[];
    readonly failed: RepairItemReport[];
    readonly totalAttempted: number;
    readonly configUpdated: boolean;
    readonly freshReport: DiagnosticReport;
}
