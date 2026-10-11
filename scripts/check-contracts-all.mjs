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
      desc: '设计令牌 Fallback 覆盖率检查',
      target: 'packages/ui/scripts/audit-brutal-fallback.ts',
      fix: {
        command: 'pnpm --filter brutx-ui-vue audit:fallback:fix',
        description: '自动补全缺失的设计令牌 fallback。',
      },
      action: {
        type: 'auto_fix',
        command: 'pnpm --filter brutx-ui-vue audit:fallback:fix',
        description: '自动补全缺失的设计令牌 fallback。',
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
      desc: '已废弃工具类检查',
      target: 'packages/ui/scripts/check-deprecated-utilities.ts',
      action: {
        type: 'manual_fix',
        command: null,
        description: '移除扫描报告中的 ring 或 shadow-rgba 工具类。',
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
  ],
})

suite.run()
