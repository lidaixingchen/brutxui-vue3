import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getRunner,
  runWithConcurrency,
  killProcessTree,
  defineGuardSuite,
  TIMEOUT_EXIT_CODE,
  SUCCESS_EXIT_CODE,
  PROCESS_ERROR_EXIT_CODE,
} from './guard-runner.mjs'

describe('GuardRunner 模块核心与并发安全性测试', () => {
  it('getRunner 正确解析不同扩展名的脚本运行器', () => {
    const jsRunner = getRunner('scripts/test-sample.mjs', ['--flag'])
    assert.equal(jsRunner.cmd, process.execPath)
    assert.deepEqual(jsRunner.args, ['scripts/test-sample.mjs', '--flag'])

    const tsRunner = getRunner('packages/ui/scripts/test.ts')
    assert.ok(tsRunner.cmd.length > 0)
    assert.ok(tsRunner.args.some((a) => a.includes('test.ts')))
  })

  it('runWithConcurrency 防御性容错与并发度限制', async () => {
    // 空数组边界
    const emptyResults = await runWithConcurrency([])
    assert.deepEqual(emptyResults, [])

    // 默认与异常参数容错（不传、NaN）
    const fallbackResults = await runWithConcurrency([() => Promise.resolve('ok')], Number.NaN)
    assert.deepEqual(fallbackResults, ['ok'])

    let currentlyRunning = 0
    let maxRunning = 0
    const taskCount = 6
    const concurrencyLimit = 2
    const sleepDurationMs = 25

    const tasks = Array.from({ length: taskCount }, () => async () => {
      currentlyRunning++
      maxRunning = Math.max(maxRunning, currentlyRunning)
      await new Promise((resolve) => setTimeout(resolve, sleepDurationMs))
      currentlyRunning--
      return 'done'
    })

    const results = await runWithConcurrency(tasks, concurrencyLimit)
    assert.equal(results.length, taskCount)
    assert.ok(maxRunning <= concurrencyLimit, `最大并发数 (${maxRunning}) 应不超过限制 (${concurrencyLimit})`)
  })

  it('runWithConcurrency 在任务抛错时熔断且无未捕获异常', async () => {
    let executedCount = 0
    const tasks = [
      () => {
        executedCount++
        return Promise.reject(new Error('Simulated task error'))
      },
      () => {
        executedCount++
        return Promise.resolve('ok')
      },
    ]

    await assert.rejects(
      async () => {
        await runWithConcurrency(tasks, 1)
      },
      {
        message: 'Simulated task error',
      },
    )
  })

  it('killProcessTree 安全处理空或已终结进程无异常', () => {
    assert.doesNotThrow(() => {
      killProcessTree(null)
      killProcessTree({ pid: 0, killed: true })
    })
  })

  it('GuardSuite 保持全局信号监听器干净，无泄漏', async () => {
    const beforeSigint = process.listenerCount('SIGINT')
    const beforeSigterm = process.listenerCount('SIGTERM')

    const suite = defineGuardSuite({
      name: '信号隔离测试',
      suiteId: 'check:signals',
      category: 'test_category',
      errorCode: 'TEST_VIOLATION',
      defaultCommand: 'pnpm check:test',
      guards: [
        {
          id: 'mock-quick',
          desc: '极速项',
          target: '-e',
          args: ['process.exit(0)'],
          action: { type: 'manual_fix', command: null, description: '' },
        },
      ],
    })

    await suite.run({ autoExit: false, silent: true })

    assert.equal(process.listenerCount('SIGINT'), beforeSigint, 'SIGINT 监听器数量在套件执行完毕后应严格复原')
    assert.equal(process.listenerCount('SIGTERM'), beforeSigterm, 'SIGTERM 监听器数量在套件执行完毕后应严格复原')
  })

  it('GuardSuite 能正确调度任务并生成标准 Result Envelope 结构', async () => {
    const suite = defineGuardSuite({
      name: '测试套件',
      suiteId: 'check:test',
      category: 'test_category',
      errorCode: 'TEST_VIOLATION',
      defaultCommand: 'pnpm check:test',
      guards: [
        {
          id: 'mock-pass',
          desc: '模拟成功项',
          target: '-e',
          args: ['process.stdout.write("All good"); process.exit(0)'],
          action: {
            type: 'manual_fix',
            command: null,
            description: '测试说明',
          },
        },
      ],
    })

    const { envelope, failures, successes } = await suite.run({
      autoExit: false,
      silent: true,
      json: false,
      verbose: false,
    })

    assert.equal(failures.length, 0)
    assert.equal(successes.length, 1)
    assert.equal(envelope.status, 'success')
    assert.equal(envelope.result.summary.total, 1)
    assert.equal(envelope.result.summary.succeeded, 1)
    assert.equal(envelope.result.summary.failed, 0)
    assert.equal(envelope.error, null)
    assert.equal(envelope.effect.type, 'none')
    assert.ok(envelope.meta.duration_ms >= 0)
  })

  it('GuardSuite 在检查部分失败时正确归约 partial_success 状态机', async () => {
    const suite = defineGuardSuite({
      name: '混合失败测试套件',
      suiteId: 'check:mixed',
      category: 'test_category',
      errorCode: 'MIXED_VIOLATION',
      defaultCommand: 'pnpm check:mixed',
      guards: [
        {
          id: 'mock-fail',
          desc: '模拟失败项',
          target: '-e',
          args: ['process.stderr.write("Simulated failure"); process.exit(1)'],
          action: {
            type: 'auto_fix',
            command: 'pnpm fix:test',
            description: '运行修复命令',
          },
        },
        {
          id: 'mock-pass',
          desc: '模拟成功项',
          target: '-e',
          args: ['process.exit(0)'],
          action: {
            type: 'manual_fix',
            command: null,
            description: '无',
          },
        },
      ],
    })

    const { envelope, failures, successes } = await suite.run({
      autoExit: false,
      silent: true,
      json: false,
      verbose: false,
    })

    assert.equal(failures.length, 1)
    assert.equal(successes.length, 1)
    assert.equal(envelope.status, 'partial_success')
    assert.equal(envelope.error?.code, 'MIXED_VIOLATION')
    assert.equal(envelope.error?.category, 'test_category')
    assert.equal(envelope.control.suggested_actions.length, 1)
    assert.equal(envelope.control.suggested_actions[0].check_id, 'mock-fail')
    assert.equal(envelope.control.suggested_actions[0].command, 'pnpm fix:test')
  })

  it('GuardSuite 在检查全量失败时正确归约 error 状态机', async () => {
    const suite = defineGuardSuite({
      name: '全量失败测试套件',
      suiteId: 'check:allfail',
      category: 'test_category',
      errorCode: 'ALL_FAIL_VIOLATION',
      defaultCommand: 'pnpm check:allfail',
      guards: [
        {
          id: 'fail-1',
          desc: '失败项 1',
          target: '-e',
          args: ['process.exit(1)'],
          action: { type: 'manual_fix', command: null, description: '' },
        },
        {
          id: 'fail-2',
          desc: '失败项 2',
          target: '-e',
          args: ['process.exit(1)'],
          action: { type: 'manual_fix', command: null, description: '' },
        },
      ],
    })

    const { envelope, failures } = await suite.run({
      autoExit: false,
      silent: true,
    })

    assert.equal(failures.length, 2)
    assert.equal(envelope.status, 'error')
    assert.equal(envelope.result.summary.succeeded, 0)
    assert.equal(envelope.result.summary.failed, 2)
  })

  it('GuardSuite 超时熔断器在超时发生时准确中断并生成诊断', async () => {
    const shortTimeoutMs = 150
    const suite = defineGuardSuite({
      name: '超时测试套件',
      suiteId: 'check:timeout',
      category: 'test_category',
      errorCode: 'TIMEOUT_VIOLATION',
      defaultCommand: 'pnpm check:timeout',
      defaultTimeoutMs: shortTimeoutMs,
      guards: [
        {
          id: 'mock-hung',
          desc: '模拟挂起项',
          target: '-e',
          args: ['setTimeout(() => {}, 5000)'],
          timeoutMs: shortTimeoutMs,
          action: {
            type: 'manual_fix',
            command: null,
            description: '排查死循环',
          },
        },
      ],
    })

    const { envelope, failures } = await suite.run({
      autoExit: false,
      silent: true,
      json: false,
      verbose: false,
    })

    assert.equal(failures.length, 1)
    assert.equal(failures[0].code, TIMEOUT_EXIT_CODE)
    assert.ok(failures[0].stderr.includes('超时'))
    assert.equal(failures[0].diagnostics[0].ruleId, 'mock-hung/timeout')
    assert.equal(envelope.status, 'error')
  })

  it('GuardSuite 自愈生命周期支持 args 与 command 两种分发形态', async () => {
    const suite = defineGuardSuite({
      name: '双轨自愈测试套件',
      suiteId: 'check:autofix-dual',
      category: 'test_category',
      errorCode: 'AUTOFIX_VIOLATION',
      defaultCommand: 'pnpm check:autofix',
      guards: [
        {
          id: 'autofix-cmd',
          desc: '命令自愈',
          target: '-e',
          args: ['process.exit(0)'],
          fix: {
            command: `${process.execPath} -e "process.stdout.write('fixed cmd'); process.exit(0)"`,
            description: '命令自动修复',
          },
          action: { type: 'auto_fix', command: 'pnpm fix', description: '自动纠偏' },
        },
        {
          id: 'autofix-args',
          desc: '参数自愈',
          target: '-e',
          args: ['process.exit(0)'],
          fix: {
            args: ['process.stdout.write("fixed args"); process.exit(0)'],
            description: '参数自动修复',
          },
          action: { type: 'auto_fix', command: null, description: '自动纠偏' },
        },
      ],
    })

    const { envelope } = await suite.run({
      autoExit: false,
      silent: true,
      fix: true,
    })

    assert.equal(envelope.effect.type, 'updated')
    assert.equal(envelope.effect.details.success, true)
    assert.equal(envelope.effect.details.actions.length, 2)
    assert.equal(envelope.effect.details.actions[0].guardId, 'autofix-cmd')
    assert.equal(envelope.effect.details.actions[1].guardId, 'autofix-args')
  })
})
