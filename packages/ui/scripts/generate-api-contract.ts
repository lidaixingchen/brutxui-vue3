import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    assertApiContractSourceExports,
    buildPublicEntryContent,
} from 'brutx-shared-vue/api-contract'
import type { GeneratedOutput } from 'brutx-shared-vue/generation'
import { API_CONTRACT } from '../api-contract.js'

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function getEntry(id: string) {
    const entry = API_CONTRACT.entries.find((candidate) => candidate.id === id)
    if (!entry) throw new Error(`API contract entry not found: ${id}`)
    return entry
}

function buildOutput(relativePath: string, entryId: string): GeneratedOutput {
    const entry = getEntry(entryId)
    return {
        relativePath,
        content: buildPublicEntryContent(entry.exports, entry.sideEffects ?? []),
        allowMissing: relativePath.startsWith('src/entries/'),
    }
}

export function collectApiContractOutputs(packageRoot: string = PACKAGE_ROOT): GeneratedOutput[] {
    assertApiContractSourceExports(API_CONTRACT, {
        packageRoot,
        tsconfigPath: path.resolve(packageRoot, 'tsconfig.json'),
    })
    const outputs: GeneratedOutput[] = [
        buildOutput('src/index.ts', 'root'),
        buildOutput('src/composables/index.ts', 'composables'),
    ]

    for (const entry of API_CONTRACT.entries) {
        if (entry.kind !== 'composable') continue
        const name = entry.subpath.slice(2)
        outputs.push(buildOutput(path.posix.join('src', 'entries', `${name}.ts`), entry.id))
    }

    for (const output of outputs) {
        const outputPath = path.resolve(packageRoot, output.relativePath)
        if (path.basename(outputPath) === 'index.ts' && output.relativePath.includes('/components/')) {
            throw new Error(`API contract generator cannot own component index: ${output.relativePath}`)
        }
        if (fs.existsSync(outputPath) && !fs.statSync(outputPath).isFile()) {
            throw new Error(`API contract output is not a file: ${output.relativePath}`)
        }
    }
    return outputs
}
