import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageJsonPath = path.join(packageRoot, 'package.json')
const viteConfigPath = path.join(packageRoot, 'vite.config.ts')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const viteSource = ts.createSourceFile(
    viteConfigPath,
    readFileSync(viteConfigPath, 'utf-8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
)
const failures = []

function addFailure(message) {
    failures.push(message)
}

function getPropertyName(name) {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
        return name.text
    }

    return null
}

function extractViteEntryNames() {
    const entryNames = new Set()

    function visit(node) {
        if (
            ts.isPropertyAssignment(node)
            && getPropertyName(node.name) === 'entry'
            && ts.isObjectLiteralExpression(node.initializer)
        ) {
            for (const property of node.initializer.properties) {
                if (!ts.isPropertyAssignment(property)) continue

                const name = getPropertyName(property.name)
                if (name) {
                    entryNames.add(name)
                }
            }
        }

        ts.forEachChild(node, visit)
    }

    visit(viteSource)
    return entryNames
}

function expectedExportForEntry(entryName) {
    const subpath = entryName === 'index' ? '.' : `./${entryName}`

    return {
        subpath,
        types: `./dist/${entryName}.d.ts`,
        import: `./dist/${entryName}.js`,
        require: `./dist/${entryName}.cjs`,
    }
}

function collectPackageEntryExports() {
    const exportedEntries = new Set()

    for (const [subpath, value] of Object.entries(packageJson.exports ?? {})) {
        if (typeof value === 'string') continue

        const importTarget = value?.import
        const requireTarget = value?.require
        const typesTarget = value?.types
        if (!importTarget && !requireTarget && !typesTarget) continue

        const entryName = subpath === '.' ? 'index' : subpath.replace(/^\.\//, '')
        exportedEntries.add(entryName)

        const expected = expectedExportForEntry(entryName)
        for (const condition of ['types', 'import', 'require']) {
            if (value?.[condition] !== expected[condition]) {
                addFailure(`${subpath} ${condition} should be ${expected[condition]}, got ${value?.[condition] ?? '<missing>'}`)
            }
        }
    }

    return exportedEntries
}

const viteEntries = extractViteEntryNames()
const packageEntries = collectPackageEntryExports()

for (const entryName of viteEntries) {
    if (!packageEntries.has(entryName)) {
        addFailure(`vite entry "${entryName}" is missing from package.json exports`)
    }
}

for (const entryName of packageEntries) {
    if (!viteEntries.has(entryName)) {
        addFailure(`package export "${entryName}" is missing from vite build.lib.entry`)
    }
}

if (failures.length > 0) {
    console.error('Export validation failed:')
    for (const failure of failures) {
        console.error(`- ${failure}`)
    }
    process.exit(1)
}

console.log(`Export validation passed: ${viteEntries.size} Vite entries match ${packageEntries.size} package exports.`)
