import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export type { GenerateLockOptions, GenerateLockResult } from './lock.js'
export { acquireGenerateLock, withGenerateLock } from './lock.js'

export interface GeneratedOutput {
    relativePath: string
    content: string
    allowMissing?: boolean
}

export interface GeneratedOutputDifference {
    relativePath: string
    kind: 'missing' | 'changed'
}

function resolveOutputPath(rootDir: string, relativePath: string): string {
    const root = path.resolve(rootDir)
    const outputPath = path.resolve(root, relativePath)
    const relative = path.relative(root, outputPath)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`生成输出不能越过包目录: ${relativePath}`)
    }
    return outputPath
}

export function assertUniqueGeneratedOutputs(outputs: readonly GeneratedOutput[]): void {
    const seen = new Set<string>()
    for (const output of outputs) {
        const normalizedPath = path.posix.normalize(output.relativePath)
        if (seen.has(normalizedPath)) {
            throw new Error(`生成输出存在多个生产者: ${output.relativePath}`)
        }
        seen.add(normalizedPath)
    }
}

export function compareGeneratedOutputs(
    rootDir: string,
    outputs: readonly GeneratedOutput[],
): GeneratedOutputDifference[] {
    assertUniqueGeneratedOutputs(outputs)
    const differences: GeneratedOutputDifference[] = []

    for (const output of outputs) {
        const outputPath = resolveOutputPath(rootDir, output.relativePath)
        if (!fs.existsSync(outputPath)) {
            if (!output.allowMissing) {
                differences.push({ relativePath: output.relativePath, kind: 'missing' })
            }
            continue
        }

        if (fs.readFileSync(outputPath, 'utf-8') !== output.content) {
            differences.push({ relativePath: output.relativePath, kind: 'changed' })
        }
    }

    return differences
}

export function hasMissingGeneratedOutputs(
    rootDir: string,
    outputs: readonly GeneratedOutput[],
): boolean {
    assertUniqueGeneratedOutputs(outputs)
    return outputs.some(output => !fs.existsSync(resolveOutputPath(rootDir, output.relativePath)))
}

export function writeGeneratedOutputs(
    rootDir: string,
    outputs: readonly GeneratedOutput[],
): void {
    assertUniqueGeneratedOutputs(outputs)
    const backups = new Map<string, string | null>()
    const temporaryPaths: string[] = []
    const root = path.resolve(rootDir)

    try {
        for (const output of outputs) {
            const outputPath = resolveOutputPath(root, output.relativePath)
            if (
                fs.existsSync(outputPath) &&
                fs.readFileSync(outputPath, 'utf-8') === output.content
            ) {
                continue
            }
            if (!backups.has(outputPath)) {
                backups.set(outputPath, fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf-8') : null)
            }

            fs.mkdirSync(path.dirname(outputPath), { recursive: true })
            const temporaryPath = `${outputPath}.${crypto.randomUUID()}.tmp`
            temporaryPaths.push(temporaryPath)
            fs.writeFileSync(temporaryPath, output.content, 'utf-8')
            fs.renameSync(temporaryPath, outputPath)
        }
    } catch (error) {
        for (const [outputPath, original] of backups.entries()) {
            if (original === null) {
                try {
                    fs.rmSync(outputPath, { force: true })
                } catch {
                    // 保留原始错误；清理失败不能覆盖生成失败诊断。
                }
            } else {
                try {
                    fs.writeFileSync(outputPath, original, 'utf-8')
                } catch {
                    // 保留原始错误；恢复失败由上层重试时再次暴露。
                }
            }
        }
        throw new Error('生成输出写入失败，已尝试恢复已写入文件。', { cause: error })
    } finally {
        for (const temporaryPath of temporaryPaths) {
            try {
                fs.rmSync(temporaryPath, { force: true })
            } catch {
                // 临时文件清理失败不改变主流程结果。
            }
        }
    }
}
