const ALLOWED_RESULTS = new Set(['success', 'skipped', 'failure', 'cancelled'])

const REQUIRED_CHECK = 'tooling'
const SCOPED_CHECKS = [
    { jobs: ['quality', 'test'], flags: ['ui', 'cli', 'registry', 'tooling'] },
    { jobs: ['coverage-shard', 'coverage'], flags: ['ui'] },
    { jobs: ['browser'], flags: ['browser', 'cost'] },
    { jobs: ['integration'], flags: ['cli'] },
    { jobs: ['consumers'], flags: ['consumers'] },
    { jobs: ['site'], flags: ['site'] },
]
const CI_CHECKS = new Set([REQUIRED_CHECK, ...SCOPED_CHECKS.flatMap(({ jobs }) => jobs)])

function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resultOf(entry) {
    if (typeof entry === 'string') return entry
    if (isRecord(entry) && typeof entry.result === 'string') return entry.result
    return undefined
}

export function selectCiChecks(flags) {
    const scopedJobs = SCOPED_CHECKS
        .filter(check => check.flags.some(flag => flags[flag]))
        .flatMap(check => check.jobs)
    return [REQUIRED_CHECK, ...scopedJobs]
}

export function evaluateGate(input) {
    const failures = []
    if (!isRecord(input)) {
        return { passed: false, selected: [], failures: [{ job: 'input', reason: 'expected an object' }] }
    }

    const selected = input.selected
    const needs = input.needs
    if (!Array.isArray(selected) || selected.some(job => !CI_CHECKS.has(job))) {
        failures.push({ job: 'input', reason: 'selected must be an array of recognized check names' })
    }
    if (!isRecord(needs)) failures.push({ job: 'input', reason: 'needs must be an object of job results' })

    const selectedNames = Array.isArray(selected) ? selected : []
    const needsResults = isRecord(needs) ? needs : {}
    const selectedSet = new Set(selectedNames)

    if (selectedSet.size !== selectedNames.length) {
        failures.push({ job: 'input', reason: 'selected check names must be unique' })
    }
    if (!selectedSet.has(REQUIRED_CHECK)) {
        failures.push({ job: 'input', reason: `${REQUIRED_CHECK} must be selected` })
    }

    const classificationResult = resultOf(needsResults.changes)
    if (classificationResult !== 'success') {
        failures.push({
            job: 'classification',
            result: classificationResult ?? 'missing',
            reason: 'change classification must succeed',
        })
    }

    const observedJobs = new Set([...CI_CHECKS, ...Object.keys(needsResults)])
    observedJobs.delete('changes')
    for (const job of observedJobs) {
        const result = resultOf(needsResults[job])
        if (!ALLOWED_RESULTS.has(result)) {
            failures.push({ job, result: result ?? 'missing', reason: 'job result is missing or unsupported' })
        } else if (selectedSet.has(job) && result !== 'success') {
            failures.push({ job, result, reason: 'selected checks must succeed' })
        } else if (result === 'failure' || result === 'cancelled') {
            failures.push({ job, result, reason: 'failed or cancelled jobs block the gate' })
        }
    }

    return {
        passed: failures.length === 0,
        selected: selectedNames,
        failures,
    }
}
