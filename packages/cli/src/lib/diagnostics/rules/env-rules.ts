import path from 'path';
import type { CheckResult, DiagnosticContext, DiagnosticRule } from '../types.js';

const MIN_NODE_VERSION = '22.5.0';

export function isNodeVersionSupported(version: string): boolean {
    const cleanVersion = version.split('-')[0];
    const [major = 0, minor = 0, patch = 0] = cleanVersion.split('.').map(Number);
    const [minMajor, minMinor, minPatch] = MIN_NODE_VERSION.split('.').map(Number);

    if (major !== minMajor) return major > minMajor;
    if (minor !== minMinor) return minor > minMinor;
    return patch >= minPatch;
}

export const nodeVersionRule: DiagnosticRule = {
    id: 'env.node-version',
    category: 'env',
    name: 'Node.js version',
    async check(_ctx: DiagnosticContext): Promise<CheckResult> {
        const version = process.versions.node;
        if (!isNodeVersionSupported(version)) {
            return {
                ruleId: 'env.node-version',
                category: 'env',
                name: 'Node.js version',
                status: 'error',
                message: `Node.js ${version} is unsupported. brutx-vue requires Node.js >=${MIN_NODE_VERSION}.`,
            };
        }

        return {
            ruleId: 'env.node-version',
            category: 'env',
            name: 'Node.js version',
            status: 'pass',
            message: `Node.js ${version} satisfies >=${MIN_NODE_VERSION}.`,
        };
    },
};

export const workspaceHintRule: DiagnosticRule = {
    id: 'env.workspace-hint',
    category: 'env',
    name: 'Workspace hint',
    async check(ctx: DiagnosticContext): Promise<CheckResult[]> {
        const workspaceRoot = ctx.projectContext.env.workspaceRoot;
        const resolvedCwd = path.resolve(ctx.cwd);

        if (!workspaceRoot || workspaceRoot === resolvedCwd) {
            return [];
        }

        const relativeRoot = path.relative(resolvedCwd, workspaceRoot) || '.';
        return [{
            ruleId: 'env.workspace-hint',
            category: 'env',
            name: 'workspace hint',
            status: 'warn',
            message: `Detected monorepo subpackage (workspace root: ${relativeRoot}). BrutxUI does not provide cross-package batch init/add/remove; run \`brutx-vue init\`/\`add\` independently inside each package, and manage shared dependencies via pnpm-workspace.yaml.`,
        }];
    },
};

export const envRules: DiagnosticRule[] = [
    nodeVersionRule,
    workspaceHintRule,
];
