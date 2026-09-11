#!/usr/bin/env node
/**
 * 全量代码与规范契约门禁聚合入口（check:contracts）
 *
 * 遵循 Unix 沉默原则与 Agent Result Envelope 协议。
 * 底层调度、流解码、超时熔断与结果归约完全收敛至 scripts/lib/guard-runner.mjs。
 */

import { defineGuardSuite } from './lib/guard-runner.mjs'

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
      id: 'tokens-alignment',
      desc: 'CLI brutalist.css 令牌对齐',
      target: 'packages/cli/scripts/check-brutalist-tokens.ts',
      fix: {
        command: 'pnpm --filter brutx-vue prebuild:tokens',
        description: '重新从 shared 单一信源编译并同步 CLI brutalist.css 令牌。',
      },
      action: {
        type: 'auto_fix',
        command: 'pnpm --filter brutx-vue prebuild:tokens',
        description: '重新从 shared 单一信源编译并同步 CLI brutalist.css 令牌。',
      },
    },
    {
      id: 'exports-sync',
      desc: '组件重导出与 Manifest 同步',
      target: 'packages/ui/scripts/check-exports.ts',
      fix: {
        command: 'pnpm --filter brutx-ui-vue prebuild:exports && pnpm --filter brutx-ui-vue prebuild:scan',
        description: '重新扫描生成并同步组件导出与 manifest 清单。',
      },
      action: {
        type: 'auto_fix',
        command: 'pnpm --filter brutx-ui-vue prebuild:exports && pnpm --filter brutx-ui-vue prebuild:scan',
        description: '重新扫描生成并同步组件导出与 manifest 清单。',
      },
    },
  ],
})

suite.run()
