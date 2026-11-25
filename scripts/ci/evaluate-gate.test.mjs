import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { evaluateGate, selectCiChecks } from './evaluate-gate.mjs'

const SCOPE_CASES = {
    ui: ['quality', 'test', 'coverage-shard', 'coverage'],
    cli: ['quality', 'test', 'integration'],
    registry: ['quality', 'test'],
    tooling: ['quality', 'test'],
    browser: ['browser'],
    cost: ['browser'],
    consumers: ['consumers'],
    site: ['site'],
}
const ALL_JOBS = [...new Set(['tooling', ...Object.values(SCOPE_CASES).flat()])]
const CI_WORKFLOW = new URL('../../.github/workflows/ci.yml', import.meta.url)

function jobResults(selected, classificationResult = 'success') {
    return {
        changes: { result: classificationResult },
        ...Object.fromEntries(ALL_JOBS.map(job => [job, { result: selected.includes(job) ? 'success' : 'skipped' }])),
    }
}

function gateInput(overrides = {}) {
    const selected = ['tooling', 'quality', 'test']
    return {
        selected,
        needs: jobResults(selected),
        ...overrides,
    }
}

function workflowJobs() {
    const workflow = readFileSync(CI_WORKFLOW, 'utf8')
    const [, ...sections] = workflow.split('\njobs:\n')[1].split(/^    ([\w-]+):\n/mu)
    const jobs = new Map()
    for (let index = 0; index < sections.length; index += 2) jobs.set(sections[index], sections[index + 1])
    return jobs
}

test('selected successful checks pass while unselected expected skips are allowed', () => {
    const result = evaluateGate(gateInput())
    assert.deepEqual(result, { passed: true, selected: ['tooling', 'quality', 'test'], failures: [] })
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
        const { selected } = gateInput()
        const evaluation = evaluateGate({ selected, needs: jobResults(selected, classificationResult) })
        assert.equal(evaluation.passed, false)
        assert.ok(evaluation.failures.some(failure => failure.job === 'classification'))
    }
})

test('missing results and unfinished job states block the gate', () => {
    for (const [job, failureJob] of [['changes', 'classification'], ['test', 'test'], ['coverage', 'coverage']]) {
        const { selected, needs } = gateInput()
        delete needs[job]
        const missing = evaluateGate({ selected, needs })
        assert.equal(missing.passed, false)
        assert.ok(missing.failures.some(failure => failure.job === failureJob && failure.result === 'missing'))
    }

    const unfinished = evaluateGate(gateInput({ needs: { ...gateInput().needs, coverage: { result: 'in_progress' } } }))
    assert.equal(unfinished.passed, false)
    assert.ok(unfinished.failures.some(failure => failure.job === 'coverage' && failure.result === 'in_progress'))
})

test('missing, empty and invalid check selections block the gate', () => {
    for (const selected of [undefined, [], ['quality'], ['tooling', ''], ['tooling', 'unknown'], ['tooling', 'tooling']]) {
        const evaluation = evaluateGate(gateInput({ selected }))
        assert.equal(evaluation.passed, false)
        assert.ok(evaluation.failures.some(failure => failure.job === 'input'))
    }
})

test('documentation and release changes select the independent tooling chain', () => {
    assert.deepEqual(selectCiChecks({ docs: true }), ['tooling'])
    assert.deepEqual(selectCiChecks({ release: true }), ['tooling'])
    assert.deepEqual(selectCiChecks({ docs: true, site: true }), ['tooling', 'site'])
})

test('every combination of job selection flags preserves the check scope', () => {
    const flags = Object.keys(SCOPE_CASES)
    for (let mask = 0; mask < 2 ** flags.length; mask += 1) {
        const enabled = flags.filter((_, index) => (mask & (1 << index)) !== 0)
        const selected = selectCiChecks(Object.fromEntries(enabled.map(flag => [flag, true])))
        const expected = new Set(['tooling', ...enabled.flatMap(flag => SCOPE_CASES[flag])])
        assert.deepEqual(new Set(selected), expected, enabled.join(','))
        assert.equal(selected.length, expected.size, enabled.join(','))
    }
})

test('the gate requires success from every selected check', () => {
    const selected = ALL_JOBS
    const needs = jobResults(selected)
    assert.equal(evaluateGate({ selected, needs }).passed, true)
    for (const job of ALL_JOBS) {
        for (const result of ['failure', 'cancelled', 'skipped']) {
            assert.equal(evaluateGate({
                selected,
                needs: { ...needs, [job]: { result } },
            }).passed, false, `${job}: ${result}`)
        }
    }
})

test('the workflow schedules each managed job from the shared selection and reports each result to the gate', () => {
    const jobs = workflowJobs()
    assert.match(jobs.get('changes'), /^ {12}selected: \$\{\{ steps\.scope\.outputs\.selected \}\}$/mu)
    for (const job of ALL_JOBS) {
        const section = jobs.get(job)
        assert.equal(section.match(/^ {8}if: (.+)$/mu)?.[1], `contains(fromJSON(needs.changes.outputs.selected || '[]'), '${job}')`)
        const dependencies = job === 'coverage' ? '[changes, coverage-shard]' : 'changes'
        assert.equal(section.match(/^ {8}needs: (.+)$/mu)?.[1], dependencies)
    }

    const gate = jobs.get('ci-gate')
    assert.equal(gate.match(/^ {8}if: (.+)$/mu)?.[1], 'always()')
    const dependencies = gate.match(/^ {8}needs: \[([^\]]+)\]$/mu)?.[1].split(', ')
    assert.deepEqual(new Set(dependencies), new Set(['changes', ...ALL_JOBS]))
    assert.match(gate, /^ {18}SELECTED_CHECKS: \$\{\{ needs\.changes\.outputs\.selected \}\}$/mu)
    assert.match(gate, /^ {18}RESULTS: \$\{\{ toJSON\(needs\) \}\}$/mu)
})

test('the workflow gate consumes the supplied selection and rejects broken outputs and dependencies', () => {
    const gate = workflowJobs().get('ci-gate')
    const gateScript = gate.match(/^ {18}node --input-type=module <<'NODE'\n([\s\S]+?)^ {18}NODE$/mu)?.[1]
    assert.ok(gateScript)

    const toolingOnly = jobResults(['tooling'])
    const cases = [
        { selected: '["tooling"]', needs: toolingOnly, passed: true },
        { selected: '["tooling","quality"]', needs: toolingOnly, failureJob: 'quality' },
        { selected: '', needs: toolingOnly, failureJob: 'input' },
        { selected: '[]', needs: toolingOnly, failureJob: 'input' },
        { selected: '"tooling"', needs: toolingOnly, failureJob: 'input' },
        { selected: '["tooling","unknown"]', needs: toolingOnly, failureJob: 'input' },
        { selected: '["tooling"', needs: toolingOnly, failureJob: 'input', invalidJson: true },
        { needs: toolingOnly, failureJob: 'input' },
        { selected: '', needs: jobResults([], 'failure'), failureJob: 'classification' },
        { selected: '', needs: jobResults([], 'cancelled'), failureJob: 'classification' },
    ]
    for (const { selected, needs, passed = false, failureJob, invalidJson } of cases) {
        const env = { ...process.env, RESULTS: JSON.stringify(needs) }
        if (selected === undefined) delete env.SELECTED_CHECKS
        else env.SELECTED_CHECKS = selected
        const run = spawnSync(process.execPath, ['--input-type=module'], {
            cwd: new URL('../../', import.meta.url),
            encoding: 'utf8',
            env,
            input: gateScript,
        })
        assert.equal(run.status, passed ? 0 : 1, run.stderr)
        const result = JSON.parse(run.stdout)
        assert.equal(result.passed, passed)
        if (failureJob) assert.ok(result.failures.some(failure => failure.job === failureJob))
        if (invalidJson) assert.match(run.stderr, /Selected CI checks output must contain valid JSON/u)
    }
})
