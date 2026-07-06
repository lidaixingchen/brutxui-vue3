import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageJsonPath = path.join(packageRoot, 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const require = createRequire(import.meta.url)
const failures = []
const checkedTargets = new Set()
const loadedEntries = new Set()
const resolvedConsumerEntries = new Set()

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

function toPackageSpecifier(subpath) {
    if (subpath === '.') {
        return packageJson.name
    }

    return `${packageJson.name}/${subpath.replace(/^\.\//, '')}`
}

function collectConsumerSmokeSpecifiers() {
    const resolveSpecifiers = new Set()
    const importSpecifiers = new Set()
    const requireSpecifiers = new Set()

    for (const [subpath, value] of Object.entries(packageJson.exports ?? {})) {
        const specifier = toPackageSpecifier(subpath)
        resolveSpecifiers.add(specifier)

        if (typeof value === 'string') continue

        if (value?.import) {
            importSpecifiers.add(specifier)
        }
        if (value?.require) {
            requireSpecifiers.add(specifier)
        }
    }

    return {
        resolveSpecifiers: [...resolveSpecifiers],
        importSpecifiers: [...importSpecifiers],
        requireSpecifiers: [...requireSpecifiers],
    }
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

function runConsumerScript(scriptPath, description) {
    try {
        execFileSync(process.execPath, [scriptPath], {
            cwd: path.dirname(scriptPath),
            stdio: 'pipe',
            windowsHide: true,
        })
    } catch (error) {
        const stderr = error?.stderr ? String(error.stderr).trim() : ''
        const stdout = error?.stdout ? String(error.stdout).trim() : ''
        const reason = stderr || stdout || (error instanceof Error ? error.message : String(error))
        addFailure(`${description} failed: ${reason}`)
    }
}

function writeConsumerProjectScripts(consumerRoot, specifiers) {
    const importScriptPath = path.join(consumerRoot, 'import-smoke.mjs')
    const requireScriptPath = path.join(consumerRoot, 'require-smoke.cjs')

    writeFileSync(
        importScriptPath,
        [
            `const resolveSpecifiers = ${JSON.stringify(specifiers.resolveSpecifiers)}`,
            `const importSpecifiers = ${JSON.stringify(specifiers.importSpecifiers)}`,
            'for (const specifier of resolveSpecifiers) {',
            '    import.meta.resolve(specifier)',
            '}',
            'for (const specifier of importSpecifiers) {',
            '    await import(specifier)',
            '}',
        ].join('\n'),
    )

    writeFileSync(
        requireScriptPath,
        [
            `const resolveSpecifiers = ${JSON.stringify(specifiers.resolveSpecifiers)}`,
            `const requireSpecifiers = ${JSON.stringify(specifiers.requireSpecifiers)}`,
            'for (const specifier of resolveSpecifiers) {',
            '    require.resolve(specifier)',
            '}',
            'for (const specifier of requireSpecifiers) {',
            '    require(specifier)',
            '}',
        ].join('\n'),
    )

    return { importScriptPath, requireScriptPath }
}

function smokeConsumerResolution() {
    const consumerRoot = mkdtempSync(path.join(tmpdir(), 'brutx-ui-package-smoke-'))
    const nodeModulesDir = path.join(consumerRoot, 'node_modules')
    const packageLink = path.join(nodeModulesDir, packageJson.name)

    try {
        mkdirSync(nodeModulesDir, { recursive: true })
        writeFileSync(path.join(consumerRoot, 'package.json'), JSON.stringify({ type: 'module' }, null, 4))
        symlinkSync(packageRoot, packageLink, process.platform === 'win32' ? 'junction' : 'dir')

        const specifiers = collectConsumerSmokeSpecifiers()
        const { importScriptPath, requireScriptPath } = writeConsumerProjectScripts(consumerRoot, specifiers)

        runConsumerScript(importScriptPath, 'consumer ESM package resolution')
        runConsumerScript(requireScriptPath, 'consumer CJS package resolution')

        for (const specifier of specifiers.resolveSpecifiers) {
            resolvedConsumerEntries.add(specifier)
        }
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        addFailure(`consumer package setup failed: ${reason}`)
    } finally {
        rmSync(consumerRoot, { recursive: true, force: true })
    }
}

async function main() {
    for (const entry of collectPackageTargets()) {
        const filePath = assertTargetExists(entry)
        if (filePath) {
            await loadEntry(entry, filePath)
        }
    }

    smokeConsumerResolution()

    if (failures.length > 0) {
        console.error('Package smoke check failed:')
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log(`Package smoke check passed: ${checkedTargets.size} files checked, ${loadedEntries.size} JS entries loaded, ${resolvedConsumerEntries.size} consumer specifiers resolved.`)
}

main()
