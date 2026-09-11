#!/usr/bin/env node
/**
 * 全量文档健康度门禁聚合入口（check:docs）
 *
 * 遵循 Unix 沉默原则与 Agent Result Envelope 协议。
 * 底层调度、流解码、自愈生命周期与结果归约完全收敛至 scripts/lib/guard-runner.mjs。
 */

import { defineGuardSuite } from '../lib/guard-runner.mjs'

const suite = defineGuardSuite({
  name: '文档健康度门禁',
  suiteId: 'check:docs',
  category: 'documentation_guard',
  errorCode: 'DOCUMENTATION_VIOLATION',
  defaultCommand: 'pnpm check:docs',
  silentSuccessMessage: '✓ docs check passed',
  defaultTimeoutMs: 15000,
  guards: [
    {
      id: 'links',
      desc: '文档链接与绝对路径',
      target: 'scripts/docs/check-doc-links.mjs',
      args: ['check'],
      fix: {
        args: ['fix'],
        silentStdoutFilter: (stdout) => stdout.includes('0 处'),
        description: '自动扫描并纠偏文档内的相对链接路径。',
      },
      action: {
        type: 'auto_fix',
        command: 'pnpm check:docs:fix',
        description: '自动扫描并纠偏文档内的相对链接路径。',
      },
    },
    {
      id: 'status',
      desc: '方案 Frontmatter 契约',
      target: 'scripts/docs/scan-doc-status.mjs',
      args: ['--check'],
      action: {
        type: 'manual_fix',
        command: null,
        description: '请检查并补充方案文档顶部的标准 YAML Frontmatter（title、status、author 等）。',
      },
    },
    {
      id: 'guides',
      desc: '规范指南类名守卫',
      target: 'scripts/docs/check-guide-conventions.mjs',
      action: {
        type: 'manual_fix',
        command: null,
        description: '请移除指南文档中已被废弃的类名或过时约定。',
      },
    },
    {
      id: 'refs',
      desc: '组件文档覆盖率守卫',
      target: 'scripts/check-guide-refs.ts',
      action: {
        type: 'manual_fix',
        command: null,
        description: '已登记组件缺少对应中英文使用文档或大小写不匹配，请按指引补充。',
      },
    },
    {
      id: 'templates',
      desc: '组件使用文档章节规范',
      target: 'scripts/check-doc-template.mjs',
      action: {
        type: 'manual_fix',
        command: null,
        description: '组件使用文档缺失必要章节（如用法、API 或无障碍说明），请补全对应章节。',
      },
    },
  ],
})

suite.run()
