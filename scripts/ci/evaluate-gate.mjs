import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const ALLOWED_RESULTS = new Set(['success', 'skipped', 'failure', 'cancelled'])

function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resultOf(entry) {
    if (typeof entry === 'string') return entry
    if (isRecord(entry) && typeof entry.result === 'string') return entry.result
    return undefined
}

export function evaluateGate(input) {
    const failures = []
    if (!isRecord(input)) {
        return { passed: false, selected: [], failures: [{ job: 'input', reason: 'expected an object' }] }
    }

    const selected = input.selected
    const needs = input.needs
    if (!Array.isArray(selected) || selected.some(name => typeof name !== 'string' || name.length === 0)) {
        failures.push({ job: 'input', reason: 'selected must be an array of non-empty check names' })
    }
    if (!isRecord(needs)) failures.push({ job: 'input', reason: 'needs must be an object of job results' })

    const selectedNames = Array.isArray(selected) ? selected : []
    const needsResults = isRecord(needs) ? needs : {}
    const selectedSet = new Set(selectedNames)

    if (selectedSet.size !== selectedNames.length) {
        failures.push({ job: 'input', reason: 'selected check names must be unique' })
    }
    if (selectedNames.length === 0) {
        failures.push({ job: 'input', reason: 'at least one check must be selected' })
    }

    if (input.classificationResult !== 'success') {
        failures.push({
            job: 'classification',
            result: input.classificationResult ?? 'missing',
            reason: 'change classification must succeed',
        })
    }

    const observedResults = new Map()
    for (const [job, entry] of Object.entries(needsResults)) {
        const result = resultOf(entry)
        observedResults.set(job, result)
        if (!ALLOWED_RESULTS.has(result)) {
            failures.push({ job, result: result ?? 'missing', reason: 'job result is missing or unsupported' })
        } else if (result === 'failure' || result === 'cancelled') {
            failures.push({ job, result, reason: 'failed or cancelled jobs block the gate' })
        }
    }

    for (const job of selectedSet) {
        const result = observedResults.get(job)
        if (result !== 'success') {
            failures.push({
                job,
                result: result ?? 'missing',
                reason: 'selected checks must succeed',
            })
        }
    }

    return {
        passed: failures.length === 0,
        selected: selectedNames,
        failures,
    }
}

function readInput(argv) {
    if (argv.length === 0 || (argv.length === 1 && argv[0] === '--stdin')) {
        return readFileSync(0, 'utf8')
    }
    if (argv.length === 2 && argv[0] === '--input') {
        return readFileSync(argv[1], 'utf8')
    }
    if (argv.length === 1 && argv[0] === '--help') {
        console.log('用法：node scripts/ci/evaluate-gate.mjs [--input <json-file> | --stdin]')
        return null
    }
    throw new Error('输入方式只能是 --input <json-file> 或 --stdin')
}

function main(argv) {
    const serialized = readInput(argv)
    if (serialized === null) return
    const result = evaluateGate(JSON.parse(serialized))
    console.log(JSON.stringify(result, null, 2))
    if (!result.passed) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        main(process.argv.slice(2))
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(message)
        process.exitCode = 2
    }
}
