import { existsSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageJsonPath = path.join(packageRoot, 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const require = createRequire(import.meta.url)
const failures = []
const checkedTargets = new Set()
const loadedEntries = new Set()

function addFailure(message) {
    failures.push(message)
}

function normalizeTarget(target) {
    if (!target.startsWith('./')) {
        addFailure(`export target must be relative: ${target}`)
        return null
    }

    const filePath = path.resolve(packageRoot, target)
    const relative = path.relative(packageRoot, filePath)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        addFailure(`export target escapes package root: ${target}`)
        return null
    }

    return filePath
}

function collectTargets(value, subpath, condition, targets) {
    if (typeof value === 'string') {
        targets.push({ subpath, condition, target: value })
        return
    }

    if (Array.isArray(value)) {
        for (const nested of value) {
            collectTargets(nested, subpath, condition, targets)
        }
        return
    }

    if (value && typeof value === 'object') {
        for (const [nestedCondition, nested] of Object.entries(value)) {
            collectTargets(nested, subpath, nestedCondition, targets)
        }
    }
}

function collectPackageTargets() {
    const targets = []

    if (packageJson.main) {
        targets.push({ subpath: '.', condition: 'main', target: packageJson.main })
    }
    if (packageJson.module) {
        targets.push({ subpath: '.', condition: 'module', target: packageJson.module })
    }
    if (packageJson.types) {
        targets.push({ subpath: '.', condition: 'types', target: packageJson.types })
    }

    for (const [subpath, value] of Object.entries(packageJson.exports ?? {})) {
        collectTargets(value, subpath, 'default', targets)
    }

    return targets
}

function assertTargetExists(entry) {
    const filePath = normalizeTarget(entry.target)
    if (!filePath) return null

    if (!existsSync(filePath)) {
        addFailure(`${entry.subpath} ${entry.condition} is missing: ${entry.target}`)
        return null
    }

    if (statSync(filePath).size === 0) {
        addFailure(`${entry.subpath} ${entry.condition} is empty: ${entry.target}`)
        return null
    }

    checkedTargets.add(entry.target)
    return filePath
}

async function loadEntry(entry, filePath) {
    if (entry.condition !== 'import' && entry.condition !== 'require') return

    const key = `${entry.condition}:${entry.target}`
    if (loadedEntries.has(key)) return
    loadedEntries.add(key)

    try {
        if (entry.condition === 'import') {
            await import(pathToFileURL(filePath).href)
        } else {
            require(filePath)
        }
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        addFailure(`${entry.subpath} ${entry.condition} failed to load ${entry.target}: ${reason}`)
    }
}

async function main() {
    for (const entry of collectPackageTargets()) {
        const filePath = assertTargetExists(entry)
        if (filePath) {
            await loadEntry(entry, filePath)
        }
    }

    if (failures.length > 0) {
        console.error('Package smoke check failed:')
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log(`Package smoke check passed: ${checkedTargets.size} files checked, ${loadedEntries.size} JS entries loaded.`)
}

main()
