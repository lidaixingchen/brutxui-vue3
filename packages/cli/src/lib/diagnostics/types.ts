import type { BrutalistConfig, BrutxManifest, CheckStatus } from '../types.js';
import { FixId } from '../types.js';
import type { ProjectContext } from '../project-context.js';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';

export type { CheckStatus };
export { FixId };
export type DiagnosticCategory = 'env' | 'config' | 'tailwind' | 'structure' | 'integrity' | 'custom';

export type RuleFixStatus = 'applied' | 'skipped' | 'failed';

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

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
    /** 产生该检查项的规则唯一标识，如 'env.node-version', 'custom.no-global-store' */
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
    readonly category?: DiagnosticCategory;
    /** 规则帮助文档 URL（在 CI / SARIF 中提供一键直达指引） */
    readonly helpUrl?: string;
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

/** 纯数据自愈原子动作（100% 可序列化、无写副作用） */
export type RepairAction =
    | {
          readonly type: 'write-file';
          readonly filePath: string;
          readonly content: string;
          readonly description?: string;
      }
    | {
          readonly type: 'ensure-dir';
          readonly dirPath: string;
          readonly description?: string;
      }
    | {
          readonly type: 'remove-path';
          readonly targetPath: string;
          readonly recursive?: boolean;
          readonly description?: string;
      }
    | {
          readonly type: 'patch-config';
          readonly patch: DeepPartial<BrutalistConfig>;
          readonly description?: string;
      };

/** 单项自愈计划 */
export interface RepairPlan {
    readonly fixId: FixId | string;
    readonly ruleId: string;
    readonly description: string;
    readonly actions: readonly RepairAction[];
}

/** 规则自愈规划结果判别联合体 */
export type PlanFixResult =
    | {
          readonly status: 'planned';
          readonly plan: RepairPlan;
      }
    | {
          readonly status: 'skipped';
          readonly reason: string;
      }
    | {
          readonly status: 'failed';
          readonly reason: string;
      };

export interface DiagnosticRule {
    /** 规则唯一标识，如 'config.schema', 'tailwind.tokens', 'integrity.hash-drift' */
    readonly id: string;
    /** 规则所属领域分类 */
    readonly category: DiagnosticCategory;
    /** 人类可读名称 */
    readonly name: string;
    /** 默认严重级别（默认为 error） */
    readonly defaultSeverity?: 'warn' | 'error';
    /** 是否需要有效的 components.json 配置（为 true 且 config 为 null 时引擎自动短路跳过） */
    readonly requiresConfig?: boolean;
    /** 是否涉及远端网络请求（离线模式下由规则优雅降级） */
    readonly network?: boolean;
    /** 帮助文档链接 */
    readonly helpUrl?: string;
    /** 巡检函数：纯只读、无副作用 */
    check(ctx: DiagnosticContext): Promise<CheckResult | CheckResult[]>;
    /** 纯声明式自愈方案生成器（无写副作用） */
    planFix?(ctx: DiagnosticContext, result: CheckResult): Promise<PlanFixResult>;
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

/** 文件级差异预览项 */
export interface FileDiffPreview {
    readonly filePath: string;
    readonly changeType: 'create' | 'modify' | 'delete';
    readonly oldContent: string | null;
    readonly newContent: string | null;
    readonly unifiedDiff: string;
}

/** 全局自愈预览报告（用于 --dry-run 与交互式确认） */
export interface RepairPreviewReport {
    readonly plans: readonly RepairPlan[];
    readonly skipped: ReadonlyArray<{ readonly ruleId: string; readonly reason: string }>;
    readonly failed: ReadonlyArray<{ readonly ruleId: string; readonly reason: string }>;
    readonly fileDiffs: readonly FileDiffPreview[];
    readonly configChanges?: {
        readonly before: BrutalistConfig | null;
        readonly after: BrutalistConfig;
    };
}

export interface RepairItemReport {
    readonly ruleId: string;
    readonly checkName: string;
    readonly fixId: FixId | string;
    readonly status: RuleFixStatus;
    readonly message?: string;
}

export interface RepairReport {
    readonly applied: RepairItemReport[];
    readonly skipped: RepairItemReport[];
    readonly failed: RepairItemReport[];
    readonly totalAttempted: number;
    readonly configUpdated: boolean;
    readonly preview?: RepairPreviewReport;
    readonly freshReport: DiagnosticReport;
}
