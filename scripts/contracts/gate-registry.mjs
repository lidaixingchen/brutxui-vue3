import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url))
export const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, '..', '..')

const SAMPLE_STATUS = Object.freeze({
    PASS: 'pass',
    FAIL: 'fail',
})

function freezeSamples(samples) {
    return Object.freeze({
        positive: Object.freeze(samples.positive.map(Object.freeze)),
        negative: Object.freeze(samples.negative.map(Object.freeze)),
    })
}

function freezeGate(gate) {
    return Object.freeze({
        ...gate,
        workflowJobs: Object.freeze([...gate.workflowJobs]),
        samples: freezeSamples(gate.samples),
    })
}

export const GATE_REGISTRY = Object.freeze([
    freezeGate({
        id: 'api-dependencies',
        risk: '跨层依赖、barrel 绕行、未解析引用或编译工具进入运行时',
        owner: 'packages/ui/scripts/check-api-dependencies.ts',
        command: 'pnpm --filter brutx-ui-vue check:api-dependencies',
        workflowJobs: ['quality'],
        samples: {
            positive: [
                {
                    file: 'packages/ui/scripts/check-api-dependencies.test.ts',
                    name: '通过相对路径、tsconfig alias、目录 index、Vue、重导出和静态动态导入',
                    status: SAMPLE_STATUS.PASS,
                },
            ],
            negative: [
                {
                    file: 'packages/ui/scripts/check-api-dependencies.test.ts',
                    name: '拒绝 foundation 直接依赖 higher composite',
                    status: SAMPLE_STATUS.FAIL,
                },
                {
                    file: 'packages/ui/scripts/check-api-dependencies.test.ts',
                    name: '明确报告大小写、未解析、动态引用和 runtime Node 依赖',
                    status: SAMPLE_STATUS.FAIL,
                },
            ],
        },
    }),
    freezeGate({
        id: 'api-exports',
        risk: '公开 API 契约、入口投影或 package exports 漂移',
        owner: 'packages/ui/scripts/check-exports.ts',
        command: 'pnpm --filter brutx-ui-vue check:exports',
        workflowJobs: ['quality'],
        samples: {
            positive: [
                {
                    file: 'packages/ui/scripts/api-contract.test.ts',
                    name: 'keeps the explicit entry inventory and symbol counts stable',
                    status: SAMPLE_STATUS.PASS,
                },
            ],
            negative: [
                {
                    file: 'packages/ui/scripts/api-contract.test.ts',
                    name: 'rejects duplicate projected names and does not discover extra files',
                    status: SAMPLE_STATUS.FAIL,
                },
                {
                    file: 'packages/ui/scripts/check-exports.ts',
                    name: 'API contract projection files are out of sync',
                    status: SAMPLE_STATUS.FAIL,
                },
            ],
        },
    }),
    freezeGate({
        id: 'generated-drift',
        risk: '生成文件或混合文件中的生成区域与完整输入闭包不一致',
        owner: 'packages/ui/scripts/generate.ts; packages/cli/scripts/generate.ts',
        command: 'pnpm check:generated',
        workflowJobs: ['quality'],
        outputOwnership: 'collectExpectedOutputs',
        samples: {
            positive: [
                {
                    file: 'packages/shared/tests/generation.test.ts',
                    name: 'does not replace unchanged files',
                    status: SAMPLE_STATUS.PASS,
                },
                {
                    file: 'packages/ui/scripts/api-contract.test.ts',
                    name: 'projects the loading component and directive as one named-only entry',
                    status: SAMPLE_STATUS.PASS,
                },
            ],
            negative: [
                {
                    file: 'packages/shared/tests/generation.test.ts',
                    name: 'restores earlier files when a later output cannot be written',
                    status: SAMPLE_STATUS.FAIL,
                },
                {
                    file: 'packages/ui/scripts/api-contract.test.ts',
                    name: 'rejects duplicate projected names and does not discover extra files',
                    status: SAMPLE_STATUS.FAIL,
                },
            ],
        },
    }),
    freezeGate({
        id: 'staged-snapshot',
        risk: '部分暂存、跨文件未暂存输入、未跟踪依赖或混合手写区域污染候选提交',
        owner: 'scripts/generation/check-staged-snapshot.mjs',
        command: 'node scripts/generation/check-staged-snapshot.mjs',
        workflowJobs: ['quality'],
        samples: {
            positive: [
                {
                    file: 'scripts/generation/check-staged-snapshot.test.mjs',
                    name: '只按 index 快照运行 UI 生成检查，并保持工作树和 index 不变',
                    status: SAMPLE_STATUS.PASS,
                },
                {
                    file: 'scripts/generation/check-staged-snapshot.test.mjs',
                    name: '混合输出只校验暂存生成区域并保留暂存手写区域',
                    status: SAMPLE_STATUS.PASS,
                },
            ],
            negative: [
                {
                    file: 'scripts/generation/check-staged-snapshot.test.mjs',
                    name: '候选组件引用未跟踪手写依赖时明确失败',
                    status: SAMPLE_STATUS.FAIL,
                },
                {
                    file: 'scripts/generation/check-staged-snapshot.test.mjs',
                    name: '生成漂移失败并指出文件和显式生成命令',
                    status: SAMPLE_STATUS.FAIL,
                },
            ],
        },
    }),
    freezeGate({
        id: 'generation-lock',
        risk: '独立进程并发生成互相覆盖或失败后锁无法恢复',
        owner: 'packages/shared/src/lock.ts',
        command: 'pnpm --filter brutx-shared-vue test tests/lock.test.ts',
        workflowJobs: ['quality'],
        samples: {
            positive: [
                {
                    file: 'packages/shared/tests/lock.test.ts',
                    name: 'serializes independent generator processes with the package lock',
                    status: SAMPLE_STATUS.PASS,
                },
                {
                    file: 'packages/shared/tests/lock.test.ts',
                    name: 'withGenerateLock automatically releases lock on completion and error',
                    status: SAMPLE_STATUS.PASS,
                },
            ],
            negative: [
                {
                    file: 'packages/shared/tests/lock.test.ts',
                    name: 'times out on an active lock without removing it',
                    status: SAMPLE_STATUS.FAIL,
                },
                {
                    file: 'packages/shared/tests/lock.test.ts',
                    name: 'recovers a lock whose owner process is no longer alive',
                    status: SAMPLE_STATUS.FAIL,
                },
            ],
        },
    }),
    freezeGate({
        id: 'task-graph-cache',
        risk: 'Turbo 任务递归、源码写入被缓存或混合输入未使 artifact 缓存失效',
        owner: 'packages/shared/tests/build-task-contract.test.ts',
        command: 'pnpm --filter brutx-shared-vue test tests/build-task-contract.test.ts',
        workflowJobs: ['quality'],
        samples: {
            positive: [
                {
                    file: 'packages/shared/tests/build-task-contract.test.ts',
                    name: 'a composite graph schedules each package generator once and keeps generators uncached',
                    status: SAMPLE_STATUS.PASS,
                },
                {
                    file: 'packages/shared/tests/build-task-contract.test.ts',
                    name: 'Registry and docs consume generated UI state through the artifact graph',
                    status: SAMPLE_STATUS.PASS,
                },
            ],
            negative: [
                {
                    file: 'packages/shared/tests/build-task-contract.test.ts',
                    name: 'source writers are uncached and artifact consumers own only build outputs',
                    status: SAMPLE_STATUS.FAIL,
                },
                {
                    file: 'packages/shared/tests/build-task-contract.test.ts',
                    name: 'cold and hot generate graph runs retain uncached writers and hash mixed inputs',
                    status: SAMPLE_STATUS.FAIL,
                },
            ],
        },
    }),
    freezeGate({
        id: 'public-consumer-isolation',
        risk: '公开类型消费或内部构建依赖进入发布产物',
        owner: 'packages/ui/package.json',
        command: 'pnpm --filter brutx-ui-vue test:types && pnpm --filter brutx-ui-vue check:isolation',
        workflowJobs: ['quality'],
        samples: {
            positive: [
                {
                    file: 'packages/ui/scripts/api-contract.test.ts',
                    name: 'keeps selection helpers internal while retaining public business entry points',
                    status: SAMPLE_STATUS.PASS,
                },
                {
                    file: 'packages/ui/scripts/check-exports.ts',
                    name: 'API contract projections in sync',
                    status: SAMPLE_STATUS.PASS,
                },
            ],
            negative: [
                {
                    file: 'packages/ui/scripts/check-exports.ts',
                    name: 'API contract projection files are out of sync',
                    status: SAMPLE_STATUS.FAIL,
                },
                {
                    file: 'packages/ui/scripts/check-bundle-isolation.ts',
                    name: 'Found forbidden dependency reference(s) in dist',
                    status: SAMPLE_STATUS.FAIL,
                },
            ],
        },
    }),
    freezeGate({
        id: 'button-resources-and-cost',
        risk: 'Button 浏览器生命周期资源泄漏或 JS/CSS 字节预算回归',
        owner: 'packages/ui/src/components/button/button.resources.test.ts; packages/ui/perf/cost-runner.ts',
        command: 'pnpm --filter brutx-ui-vue size && node --import tsx packages/ui/perf/cost-runner.ts --artifact <candidate.tgz> --output <result-dir> --assert-resources',
        workflowJobs: ['quality', 'browser'],
        samples: {
            positive: [
                {
                    file: 'packages/ui/src/components/button/button.resources.test.ts',
                    name: 'releases all effect resources when switching effect off',
                    status: SAMPLE_STATUS.PASS,
                },
                {
                    file: 'packages/ui/src/components/button/button-hydration.browser.test.ts',
                    name: 'hydrates without mismatch and initializes text after mount when enabled',
                    status: SAMPLE_STATUS.PASS,
                },
            ],
            negative: [
                {
                    file: 'packages/ui/src/components/button/button.resources.test.ts',
                    name: 'stops and resumes autoplay around loading and disabled states',
                    status: SAMPLE_STATUS.FAIL,
                },
                {
                    file: 'packages/ui/perf/cost-profile.ts',
                    name: 'browser resource expectations',
                    status: SAMPLE_STATUS.FAIL,
                },
            ],
        },
    }),
])

export const GATE_REPLACEMENTS = Object.freeze([
    Object.freeze({
        id: 'cli-token-aggregate',
        riskId: 'generated-drift',
        legacyTarget: 'packages/cli/scripts/check-brutalist-tokens.ts',
        replacementTarget: 'packages/cli/scripts/generate.ts',
        replacementArgs: Object.freeze(['--check']),
        samples: freezeSamples({
            positive: [
                {
                    file: 'scripts/contracts/gate-equivalence.test.mjs',
                    name: 'isolated fixture: legacy token check and CLI generate check both accept synchronized outputs',
                    status: SAMPLE_STATUS.PASS,
                },
            ],
            negative: [
                {
                    file: 'scripts/contracts/gate-equivalence.test.mjs',
                    name: 'isolated fixture: legacy token check and CLI generate check both reject edited token output',
                    status: SAMPLE_STATUS.FAIL,
                },
            ],
        }),
    }),
    Object.freeze({
        id: 'ui-export-aggregate',
        riskId: 'generated-drift',
        legacyTarget: 'packages/ui/scripts/check-exports.ts',
        replacementTarget: 'packages/ui/scripts/generate.ts',
        replacementArgs: Object.freeze(['--check']),
        samples: freezeSamples({
            positive: [
                {
                    file: 'scripts/contracts/gate-equivalence.test.mjs',
                    name: 'isolated fixture: legacy exports check and UI generate check both accept synchronized outputs',
                    status: SAMPLE_STATUS.PASS,
                },
            ],
            negative: [
                {
                    file: 'scripts/contracts/gate-equivalence.test.mjs',
                    name: 'isolated fixture: legacy exports check and UI generate check both reject edited exports',
                    status: SAMPLE_STATUS.FAIL,
                },
            ],
        }),
    }),
])

function validateSamples(samples, label, errors) {
    if (!samples || !Array.isArray(samples.positive) || samples.positive.length === 0) {
        errors.push(`${label} 缺少 positive 样本`)
    }
    if (!samples || !Array.isArray(samples.negative) || samples.negative.length === 0) {
        errors.push(`${label} 缺少 negative 样本`)
    }
    for (const kind of ['positive', 'negative']) {
        for (const sample of samples?.[kind] ?? []) {
            if (!sample?.file || !sample?.name || ![SAMPLE_STATUS.PASS, SAMPLE_STATUS.FAIL].includes(sample.status)) {
                errors.push(`${label}.${kind} 样本字段不完整`)
            }
        }
    }
}

export function validateGateRegistry(registry = GATE_REGISTRY) {
    const errors = []
    const ids = new Set()
    for (const gate of registry) {
        if (!gate?.id || ids.has(gate.id)) errors.push(`门禁 id 缺失或重复：${gate?.id ?? '<missing>'}`)
        ids.add(gate?.id)
        if (!gate?.risk || !gate?.owner || !gate?.command) errors.push(`门禁 ${gate?.id ?? '<missing>'} 缺少风险、所有者或命令`)
        if (!Array.isArray(gate?.workflowJobs) || gate.workflowJobs.length === 0) errors.push(`门禁 ${gate?.id ?? '<missing>'} 缺少 workflow job`)
        validateSamples(gate?.samples, `门禁 ${gate?.id ?? '<missing>'}`, errors)
        if (gate?.id === 'generated-drift' && gate.outputOwnership !== 'collectExpectedOutputs') {
            errors.push('generated-drift 必须登记完整输出采集入口')
        }
    }
    return { valid: errors.length === 0, errors }
}

export function validateGateReplacements(replacements = GATE_REPLACEMENTS) {
    const errors = []
    const ids = new Set()
    for (const replacement of replacements) {
        if (!replacement?.id || ids.has(replacement.id)) errors.push(`替换 id 缺失或重复：${replacement?.id ?? '<missing>'}`)
        ids.add(replacement?.id)
        if (!replacement?.legacyTarget || !replacement?.replacementTarget) {
            errors.push(`替换 ${replacement?.id ?? '<missing>'} 缺少旧入口或替代入口`)
        }
        if (!replacement?.riskId || !GATE_REGISTRY.some((gate) => gate.id === replacement.riskId)) {
            errors.push(`替换 ${replacement?.id ?? '<missing>'} 缺少有效目标风险`)
        }
        validateSamples(replacement?.samples, `替换 ${replacement?.id ?? '<missing>'}`, errors)
    }
    return { valid: errors.length === 0, errors }
}

export { SAMPLE_STATUS }
