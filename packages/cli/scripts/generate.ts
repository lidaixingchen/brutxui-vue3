import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    assertUniqueGeneratedOutputs,
    compareGeneratedOutputs,
    type GeneratedOutput,
    withGenerateLock,
    writeGeneratedOutputs,
} from 'brutx-shared-vue/generation'
import { collectTokenOutputs } from './generate-tokens.js'

const __filename = fileURLToPath(import.meta.url)
const PACKAGE_ROOT = path.resolve(path.dirname(__filename), '..')

export function collectExpectedOutputs(packageRoot: string = PACKAGE_ROOT): GeneratedOutput[] {
    const outputs = collectTokenOutputs(packageRoot)
    assertUniqueGeneratedOutputs(outputs)
    return outputs
}

export const collectGeneratedOutputs = collectExpectedOutputs

function run(): void {
    const isCheckMode = process.argv.includes('--check')
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v') || process.env.BRUTX_VERBOSE === '1'
    const outputs = collectExpectedOutputs()
    const differences = compareGeneratedOutputs(PACKAGE_ROOT, outputs)

    if (differences.length > 0) {
        if (isCheckMode) {
            console.error('✗ CLI 生成内容与磁盘不一致，请运行 `pnpm generate`。')
            for (const difference of differences) console.error(`  - ${difference.relativePath} (${difference.kind})`)
            throw new Error('CLI 生成检查失败')
        }

        writeGeneratedOutputs(PACKAGE_ROOT, outputs)
        console.log(`✓ CLI 生成输出已更新（${outputs.length} 项）`)
        return
    }

    if (isVerbose || isCheckMode) console.log(`✓ CLI 生成输出已是最新（${outputs.length} 项）`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    const runPromise = process.argv.includes('--check')
        ? Promise.resolve().then(run)
        : withGenerateLock(
            { packageName: 'brutx-vue', cacheDir: path.resolve(PACKAGE_ROOT, 'node_modules', '.cache') },
            run,
        )
    runPromise.catch((error) => {
        console.error(error)
        process.exit(1)
    })
}
