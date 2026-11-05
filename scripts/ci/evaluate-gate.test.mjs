import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateGate, selectCiChecks } from './evaluate-gate.mjs'

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

test('documentation and release changes select the independent tooling chain', () => {
    assert.deepEqual(selectCiChecks({ docs: true }), ['tooling'])
    assert.deepEqual(selectCiChecks({ release: true }), ['tooling'])
    assert.deepEqual(selectCiChecks({ docs: true, site: true }), ['tooling', 'site'])
})

test('package and tooling changes retain the build and test chains', () => {
    for (const field of ['ui', 'cli', 'registry', 'tooling']) {
        const selected = selectCiChecks({ [field]: true })
        assert.ok(selected.includes('quality'), field)
        assert.ok(selected.includes('tooling'), field)
        assert.ok(selected.includes('test'), field)
    }
    assert.deepEqual(selectCiChecks({ cost: true }), ['tooling', 'browser'])
})

test('UI changes require source coverage and script contracts in the single-runtime gate', () => {
    const selected = selectCiChecks({ ui: true })
    assert.deepEqual(selected, ['tooling', 'quality', 'test', 'coverage-shard', 'coverage'])
    const needs = Object.fromEntries(selected.map(job => [job, { result: 'success' }]))
    assert.equal(evaluateGate({ classificationResult: 'success', selected, needs }).passed, true)
    for (const job of ['tooling', 'coverage-shard', 'coverage']) {
        for (const result of ['failure', 'cancelled', 'skipped']) {
            assert.equal(evaluateGate({
                classificationResult: 'success',
                selected,
                needs: { ...needs, [job]: { result } },
            }).passed, false, `${job}: ${result}`)
        }
    }
})

test('both independent quality chains must pass when selected', () => {
    const flags = { ui: true, cli: true, registry: true, tooling: true, browser: true, cost: true, consumers: true, site: true }
    const selected = selectCiChecks(flags)
    const needs = Object.fromEntries(selected.map(job => [job, { result: 'success' }]))
    assert.equal(evaluateGate({ classificationResult: 'success', selected, needs }).passed, true)
    for (const job of ['quality', 'tooling']) {
        for (const result of ['failure', 'cancelled', 'skipped']) {
            assert.equal(evaluateGate({
                classificationResult: 'success',
                selected,
                needs: { ...needs, [job]: { result } },
            }).passed, false, `${job}: ${result}`)
        }
    }
})
