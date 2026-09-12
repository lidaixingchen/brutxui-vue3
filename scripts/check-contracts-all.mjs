#!/usr/bin/env node
/**
 * 全量代码与规范契约门禁聚合入口（check:contracts）
 *
 * 遵循 Unix 沉默原则与 Agent Result Envelope 协议。
 * 底层调度、流解码、超时熔断与结果归约完全收敛至 scripts/lib/guard-runner.mjs。
 */

import { defineGuardSuite } from './lib/guard-runner.mjs'

const HEAVY_CONTRACT_TIMEOUT_MS = 60_000

const suite = defineGuardSuite({
  name: '规范契约门禁',
  suiteId: 'check:contracts',
  category: 'static_contract',
  errorCode: 'CONTRACT_VIOLATION',
  defaultCommand: 'pnpm check:contracts',
  silentSuccessMessage: '✓ contracts check passed',
  defaultTimeoutMs: 25000,
  guards: [
    {
      id: 'phantom-deps',
      desc: 'Monorepo 幽灵依赖防护',
      target: 'scripts/scan-phantom-deps.mjs',
      action: {
        type: 'manual_fix',
        command: null,
        description: '请检查报错包的 package.json，在 dependencies/devDependencies 中补充声明该依赖。',
      },
    },
    {
      id: 'fallback-vars',
      desc: '设计令牌 Fallback 覆盖率基线',
      target: 'packages/ui/scripts/audit-brutal-fallback.ts',
      args: ['--check-baseline'],
      fix: {
        command: 'pnpm --filter brutx-ui-vue audit:fallback:fix',
        description: '自动补全缺失的设计令牌 fallback。',
      },
      action: {
        type: 'auto_fix',
        command: 'pnpm --filter brutx-ui-vue audit:fallback:fix',
        description: '自动补全缺失的设计令牌 fallback（若属预期变更请运行 pnpm --filter brutx-ui-vue audit:fallback:update 更新基线）。',
      },
    },
    {
      id: 'class-literals',
      desc: 'Tailwind @source 类名字面量规约',
      target: 'packages/ui/scripts/check-class-literals.ts',
      action: {
        type: 'manual_fix',
        command: null,
        description: '避免动态拼接类名，确保 Tailwind class 以静态完整字符串形式出现在源码中。',
      },
    },
    {
      id: 'deprecated-utils',
      desc: '已废弃工具类防回潮基线',
      target: 'packages/ui/scripts/check-deprecated-utilities.ts',
      args: ['--check-baseline'],
      fix: {
        command: 'pnpm --filter brutx-ui-vue check:deprecated:update',
        description: '更新废弃类基线快照。',
      },
      action: {
        type: 'auto_fix',
        command: 'pnpm --filter brutx-ui-vue check:deprecated:update',
        description: '若废弃类变更属预期，运行此命令更新基线快照；否则请移除废弃的 ring 或 shadow-rgba 工具类。',
      },
    },
    {
      id: 'api-dependencies',
      desc: 'UI API 依赖分层与解析边界',
      target: 'packages/ui/scripts/check-api-dependencies.ts',
      timeoutMs: HEAVY_CONTRACT_TIMEOUT_MS,
      action: {
        type: 'manual_fix',
        command: null,
        description: '请根据依赖链诊断补充 API contract 归属或修正越层、未解析和编译工具依赖。',
      },
    },
    {
      id: 'api-exports',
      desc: 'UI API 契约投影与 exports 同步',
      target: 'packages/ui/scripts/check-exports.ts',
      timeoutMs: HEAVY_CONTRACT_TIMEOUT_MS,
      action: {
        type: 'manual_fix',
        command: null,
        description: '请从 API contract 生成并校验公共入口、组件 index 与 package exports 投影。',
      },
    },
    {
      id: 'tokens-alignment',
      desc: 'CLI 生成输出对齐',
      target: 'packages/cli/scripts/generate.ts',
      args: ['--check'],
      timeoutMs: HEAVY_CONTRACT_TIMEOUT_MS,
      fix: {
        command: 'pnpm --filter brutx-vue generate',
        description: '重新从 shared 单一信源生成 CLI 输出。',
      },
      action: {
        type: 'auto_fix',
        command: 'pnpm --filter brutx-vue generate',
        description: '重新从 shared 单一信源生成 CLI 输出。',
      },
    },
    {
      id: 'ui-generation-sync',
      desc: 'UI 生成输出对齐',
      target: 'packages/ui/scripts/generate.ts',
      args: ['--check'],
      timeoutMs: HEAVY_CONTRACT_TIMEOUT_MS,
      fix: {
        command: 'pnpm --filter brutx-ui-vue generate',
        description: '按 tokens、scan、component index、exports 顺序重新生成 UI 输出。',
      },
      action: {
        type: 'auto_fix',
        command: 'pnpm --filter brutx-ui-vue generate',
        description: '按 tokens、scan、component index、exports 顺序重新生成 UI 输出。',
      },
    },
  ],
})

suite.run()
