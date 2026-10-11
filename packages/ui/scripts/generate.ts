import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    assertUniqueGeneratedOutputs,
    compareGeneratedOutputs,
    type GeneratedOutput,
    hasMissingGeneratedOutputs,
    withGenerateLock,
    writeGeneratedOutputs,
} from 'brutx-shared-vue/generation'
import { buildPublicEntryContent } from 'brutx-shared-vue/api-contract'
import { API_CONTRACT } from '../api-contract.js'
import { assertApiModuleCoverage } from './api-module-coverage.js'
import { collectComponentIndexOutputs } from './generate-component-index.js'
import { collectApiContractOutputs } from './generate-api-contract.js'
import { collectExportsOutput } from './generate-exports.js'
import { collectTokenOutputs } from './generate-styles-tokens.js'
import { collectScanGeneration } from './prebuild-scan.js'

const __filename = fileURLToPath(import.meta.url)
const PACKAGE_ROOT = path.resolve(path.dirname(__filename), '..')

export function collectExpectedOutputs(packageRoot: string = PACKAGE_ROOT): GeneratedOutput[] {
    const tokenOutputs = collectTokenOutputs(packageRoot)
    const scanGeneration = collectScanGeneration(packageRoot)
    const apiOutputs = collectApiContractOutputs(packageRoot)
    assertApiModuleCoverage(API_CONTRACT, packageRoot, apiOutputs)
    for (const entry of API_CONTRACT.entries) {
        buildPublicEntryContent(entry.exports, entry.sideEffects ?? [])
    }
    const componentIndexOutputs = collectComponentIndexOutputs(packageRoot)
    const exportsOutput = collectExportsOutput(scanGeneration.exportsManifest, packageRoot)
    const outputs = [
        ...tokenOutputs,
        ...scanGeneration.outputs,
        ...apiOutputs,
        ...componentIndexOutputs,
        exportsOutput,
    ]
    assertUniqueGeneratedOutputs(outputs)
    return outputs
}

export const collectGeneratedOutputs = collectExpectedOutputs

function run(): void {
    const isCheckMode = process.argv.includes('--check')
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v') || process.env.BRUTX_VERBOSE === '1'
    const outputs = collectExpectedOutputs()
    const differences = compareGeneratedOutputs(PACKAGE_ROOT, outputs)
    const hasMissingOutputs = hasMissingGeneratedOutputs(PACKAGE_ROOT, outputs)

    if (differences.length > 0 || (!isCheckMode && hasMissingOutputs)) {
        if (isCheckMode) {
            console.error('✗ UI 生成内容与磁盘不一致，请运行 `pnpm generate`。')
            for (const difference of differences) console.error(`  - ${difference.relativePath} (${difference.kind})`)
            throw new Error('UI 生成检查失败')
        }

        writeGeneratedOutputs(PACKAGE_ROOT, outputs)
        console.log(`✓ UI 生成输出已更新（${outputs.length} 项）`)
        return
    }

    if (isVerbose || isCheckMode) console.log(`✓ UI 生成输出已是最新（${outputs.length} 项）`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    const runPromise = process.argv.includes('--check')
        ? Promise.resolve().then(run)
        : withGenerateLock(
            { packageName: 'brutx-ui-vue', cacheDir: path.resolve(PACKAGE_ROOT, 'node_modules', '.cache') },
            run,
        )
    runPromise.catch((error) => {
        console.error(error)
        process.exit(1)
    })
}
