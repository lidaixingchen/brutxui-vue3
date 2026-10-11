import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { evaluateGate } from './evaluate-gate.mjs'

const SCRIPT_PATH = fileURLToPath(new URL('./evaluate-gate.mjs', import.meta.url))

function gateInput(overrides = {}) {
    return {
        classificationResult: 'success',
        selected: ['quality', 'test'],
        needs: {
            quality: { result: 'success' },
            test: { result: 'success' },
            coverage: { result: 'skipped' },
            browser: { result: 'skipped' },
            integration: { result: 'skipped' },
            consumers: { result: 'skipped' },
            site: { result: 'skipped' },
        },
        ...overrides,
    }
}

test('selected successful checks pass while unselected expected skips are allowed', () => {
    const result = evaluateGate(gateInput())
    assert.deepEqual(result, { passed: true, selected: ['quality', 'test'], failures: [] })
})

test('selected checks must succeed, including checks reported as skipped', () => {
    for (const result of ['failure', 'cancelled', 'skipped']) {
        const gate = gateInput({ needs: { ...gateInput().needs, test: { result } } })
        const evaluation = evaluateGate(gate)
        assert.equal(evaluation.passed, false, `test result ${result} must block the gate`)
        assert.ok(evaluation.failures.some(failure => failure.job === 'test' && failure.reason === 'selected checks must succeed'))
    }
})

test('failures and cancellations block the gate even for an unselected check', () => {
    for (const result of ['failure', 'cancelled']) {
        const evaluation = evaluateGate(gateInput({ needs: { ...gateInput().needs, browser: { result } } }))
        assert.equal(evaluation.passed, false, `browser result ${result} must block the gate`)
        assert.ok(evaluation.failures.some(failure => failure.job === 'browser' && failure.result === result))
    }
})

test('classification failure or cancellation can never pass the gate', () => {
    for (const classificationResult of ['failure', 'cancelled', 'skipped']) {
        const evaluation = evaluateGate(gateInput({ classificationResult }))
        assert.equal(evaluation.passed, false)
        assert.ok(evaluation.failures.some(failure => failure.job === 'classification'))
    }
})

test('missing selected results and unfinished job states fail closed', () => {
    const missing = evaluateGate(gateInput({ needs: { quality: { result: 'success' } } }))
    assert.equal(missing.passed, false)
    assert.ok(missing.failures.some(failure => failure.job === 'test' && failure.result === 'missing'))

    const unfinished = evaluateGate(gateInput({ needs: { ...gateInput().needs, coverage: { result: 'in_progress' } } }))
    assert.equal(unfinished.passed, false)
    assert.ok(unfinished.failures.some(failure => failure.job === 'coverage' && failure.result === 'in_progress'))
})

test('an empty selection fails rather than turning the Gate into a no-op', () => {
    const evaluation = evaluateGate(gateInput({ selected: [] }))
    assert.equal(evaluation.passed, false)
    assert.ok(evaluation.failures.some(failure => failure.reason === 'at least one check must be selected'))
})

test('the CLI reads selected names and needs results from JSON stdin', () => {
    const processResult = spawnSync(process.execPath, [SCRIPT_PATH, '--stdin'], {
        encoding: 'utf8',
        input: JSON.stringify(gateInput()),
    })

    assert.equal(processResult.status, 0, processResult.stderr)
    assert.equal(JSON.parse(processResult.stdout).passed, true)
})
