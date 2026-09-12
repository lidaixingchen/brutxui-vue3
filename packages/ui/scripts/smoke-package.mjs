import { execFileSync, execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
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

    // CJS smoke is only meaningful when the package actually exposes CJS —
    // either via a `main` field or at least one `require` condition in exports.
    // ESM-only packages (no main, no require) cannot be require()'d by CJS
    // consumers, so attempting CJS resolution would always fail.
    const cjsSupported = Boolean(packageJson.main) || requireSpecifiers.size > 0

    return {
        resolveSpecifiers: [...resolveSpecifiers],
        importSpecifiers: [...importSpecifiers],
        requireSpecifiers: [...requireSpecifiers],
        cjsSupported,
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
    const packageDest = path.join(nodeModulesDir, packageJson.name)

    try {
        mkdirSync(nodeModulesDir, { recursive: true })
        writeFileSync(path.join(consumerRoot, 'package.json'), JSON.stringify({ type: 'module' }, null, 4))

        // 1. Pack tarball into isolated consumerRoot
        execSync('pnpm --config.ignore-scripts=true pack --pack-destination "' + consumerRoot + '"', {
            cwd: packageRoot,
            stdio: 'pipe',
            env: {
                ...process.env,
                npm_config_ignore_scripts: 'true',
            },
        })

        const tarballFiles = readdirSync(consumerRoot).filter(f => f.endsWith('.tgz'))
        if (tarballFiles.length === 0) {
            throw new Error('pnpm pack failed to generate UI tarball')
        }
        const tarballPath = path.join(consumerRoot, tarballFiles[0])

        // 2. Extract tarball
        const extractedDir = path.join(consumerRoot, 'extracted')
        mkdirSync(extractedDir, { recursive: true })
        execSync(`tar -xzf "${tarballPath}" -C "${extractedDir}"`, { stdio: 'pipe' })

        const unpackedPackage = path.join(extractedDir, 'package')
        if (!existsSync(unpackedPackage)) {
            throw new Error('Expected extracted package folder not found')
        }

        // 3. Verify private package is not in unpacked dependencies
        const unpackedPkgJson = JSON.parse(readFileSync(path.join(unpackedPackage, 'package.json'), 'utf-8'))
        const allDeps = {
            ...unpackedPkgJson.dependencies,
            ...unpackedPkgJson.peerDependencies,
            ...unpackedPkgJson.optionalDependencies,
        }
        if ('brutx-shared-vue' in allDeps) {
            throw new Error('Tarball leak: brutx-shared-vue found in unpacked package dependencies')
        }

        // 4. Install packed tarball and declared peer dependencies into consumer
        execSync(`pnpm --config.ignore-scripts=true add "${tarballPath}" vue reka-ui @lucide/vue @tanstack/vue-virtual embla-carousel-vue prismjs v-calendar vee-validate`, {
            cwd: consumerRoot,
            stdio: 'pipe',
            env: {
                ...process.env,
                NODE_PATH: '',
                npm_config_ignore_scripts: 'true',
            },
        })

        const specifiers = collectConsumerSmokeSpecifiers()
        const { importScriptPath, requireScriptPath } = writeConsumerProjectScripts(consumerRoot, specifiers)

        runConsumerScript(importScriptPath, 'consumer ESM package resolution')
        if (specifiers.cjsSupported) {
            runConsumerScript(requireScriptPath, 'consumer CJS package resolution')
        } else {
            console.log('• CJS smoke skipped (ESM-only package: no main field, no require conditions)')
        }

        for (const specifier of specifiers.resolveSpecifiers) {
            resolvedConsumerEntries.add(specifier)
        }
    } catch (error) {
        const stderr = error?.stderr ? error.stderr.toString() : ''
        const stdout = error?.stdout ? error.stdout.toString() : ''
        const reason = (stderr || stdout || (error instanceof Error ? error.message : String(error))).trim()
        addFailure(`consumer package setup failed: ${reason}`)
    } finally {
        try {
            rmSync(consumerRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
        } catch {
            // ignore cleanup failure in finally
        }
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
