import path from 'node:path';
import type { WorkspaceTopology, WorkspacePackageInfo, BrutalistConfig } from '../types.js';

export interface ResolvedInstallationPlan {
    readonly targetDir: string;                  // 组件写入的物理目标目录
    readonly targetPackageRoot: string;          // 目标包 package.json 所在的根目录
    readonly targetPackageName: string;          // 目标包名称
    readonly effectiveConfig: BrutalistConfig;   // 针对该目标包计算出的有效别名与配置
    readonly depInstallTarget: {
        readonly packageRoot: string;
        readonly packageName: string;
    };
}

export class TargetResolver {
    /**
     * 按优先级决策树计算组件安装目标与有效配置
     */
    static resolvePlan(
        callerCwd: string,
        filterArg: string | undefined,
        topology: WorkspaceTopology,
        rootConfig?: BrutalistConfig
    ): ResolvedInstallationPlan {
        const resolvedCaller = path.resolve(callerCwd);

        if (!topology.isMonorepo) {
            const config = rootConfig ?? {
                style: 'default',
                tailwind: { config: 'tailwind.config.js', css: 'src/styles.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            };
            return {
                targetDir: path.join(resolvedCaller, 'src/components/ui'),
                targetPackageRoot: resolvedCaller,
                targetPackageName: 'standalone',
                effectiveConfig: config,
                depInstallTarget: { packageRoot: resolvedCaller, packageName: '' },
            };
        }

        // 1. P1: 命令行显式指定 --filter
        if (filterArg) {
            const targetPkg = topology.packages.get(filterArg) ??
                Array.from(topology.packages.values()).find(p => p.name === filterArg || p.relativeDir === filterArg || p.rootDir === path.resolve(filterArg));
            if (!targetPkg) {
                throw new Error(`Workspace package '${filterArg}' not found in monorepo.`);
            }
            return TargetResolver.buildPlanForPackage(targetPkg, rootConfig);
        }

        // 2. P2: 配置文件显式声明 workspace.targetPackage
        if (rootConfig?.workspace?.targetPackage) {
            const targetName = rootConfig.workspace.targetPackage;
            const targetPkg = topology.packages.get(targetName) ??
                Array.from(topology.packages.values()).find(p => p.name === targetName || p.relativeDir === targetName);
            if (targetPkg) {
                return TargetResolver.buildPlanForPackage(targetPkg, rootConfig);
            }
        }

        // 3. P3: 拓扑自动推断 sharedUiPackage (例如 packages/ui)
        if (topology.sharedUiPackage) {
            return TargetResolver.buildPlanForPackage(topology.sharedUiPackage, rootConfig);
        }

        // 4. P4 / P5: 回退到调用者当前目录
        const callerRelative = path.relative(topology.workspaceRoot, resolvedCaller).replace(/\\/g, '/');
        const callerPkg = topology.packages.get(callerRelative) ??
            Array.from(topology.packages.values()).find(p => p.rootDir === resolvedCaller);

        if (callerPkg) {
            return TargetResolver.buildPlanForPackage(callerPkg, rootConfig);
        }

        throw new Error('Multiple packages found in monorepo. Please specify target with --filter <package-name>.');
    }

    private static buildPlanForPackage(pkg: WorkspacePackageInfo, rootConfig?: BrutalistConfig): ResolvedInstallationPlan {
        const effectiveConfig: BrutalistConfig = {
            style: rootConfig?.style ?? 'default',
            tailwind: rootConfig?.tailwind ?? { config: 'tailwind.config.js', css: 'src/styles.css' },
            aliases: {
                components: rootConfig?.aliases.components ?? '@/components',
                utils: rootConfig?.aliases.utils ?? '@/lib/utils',
                composables: rootConfig?.aliases.composables ?? '@/composables',
                locales: rootConfig?.aliases.locales,
                directives: rootConfig?.aliases.directives,
            },
            workspace: rootConfig?.workspace,
        };

        return {
            targetDir: path.join(pkg.rootDir, 'src/components/ui'),
            targetPackageRoot: pkg.rootDir,
            targetPackageName: pkg.name,
            effectiveConfig,
            depInstallTarget: {
                packageRoot: pkg.rootDir,
                packageName: pkg.name,
            },
        };
    }
}
