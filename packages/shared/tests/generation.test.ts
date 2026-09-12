import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
    assertUniqueGeneratedOutputs,
    compareGeneratedOutputs,
    hasMissingGeneratedOutputs,
    writeGeneratedOutputs,
} from '../src/generation.js'

describe('generation output contract', () => {
    const tempDirs: string[] = []

    afterEach(() => {
        for (const tempDir of tempDirs.splice(0)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
        }
    })

    function createTempDir(): string {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-generation-test-'))
        tempDirs.push(tempDir)
        return tempDir
    }

    it('rejects duplicate output ownership', () => {
        expect(() => assertUniqueGeneratedOutputs([
            { relativePath: 'src/a.ts', content: 'a' },
            { relativePath: 'src/a.ts', content: 'b' },
        ])).toThrow('生成输出存在多个生产者')
    })

    it('compares required files and permits virtual derived files to be absent', () => {
        const tempDir = createTempDir()
        fs.writeFileSync(path.join(tempDir, 'required.txt'), 'old', 'utf-8')

        expect(compareGeneratedOutputs(tempDir, [
            { relativePath: 'required.txt', content: 'new' },
            { relativePath: 'src/derived.ts', content: 'derived', allowMissing: true },
        ])).toEqual([
            { relativePath: 'required.txt', kind: 'changed' },
        ])
        expect(hasMissingGeneratedOutputs(tempDir, [
            { relativePath: 'src/derived.ts', content: 'derived', allowMissing: true },
        ])).toBe(true)
    })

    it('restores earlier files when a later output cannot be written', () => {
        const tempDir = createTempDir()
        const updatedPath = path.join(tempDir, 'updated.txt')
        fs.writeFileSync(path.join(tempDir, 'blocked'), 'file', 'utf-8')
        fs.writeFileSync(updatedPath, 'old', 'utf-8')

        expect(() => writeGeneratedOutputs(tempDir, [
            { relativePath: 'updated.txt', content: 'new' },
            { relativePath: 'created.txt', content: 'created' },
            { relativePath: 'blocked/second.txt', content: 'second' },
        ])).toThrow('生成输出写入失败')

        expect(fs.readFileSync(updatedPath, 'utf-8')).toBe('old')
        expect(fs.existsSync(path.join(tempDir, 'created.txt'))).toBe(false)
        expect(fs.readFileSync(path.join(tempDir, 'blocked'), 'utf-8')).toBe('file')
    })

    it('does not replace unchanged files', () => {
        const tempDir = createTempDir()
        const stablePath = path.join(tempDir, 'stable.txt')
        const changedPath = path.join(tempDir, 'changed.txt')
        fs.writeFileSync(stablePath, 'same', 'utf-8')
        fs.writeFileSync(changedPath, 'old', 'utf-8')
        const stableMtime = fs.statSync(stablePath).mtimeNs

        writeGeneratedOutputs(tempDir, [
            { relativePath: 'stable.txt', content: 'same' },
            { relativePath: 'changed.txt', content: 'new' },
        ])

        expect(fs.statSync(stablePath).mtimeNs).toBe(stableMtime)
        expect(fs.readFileSync(changedPath, 'utf-8')).toBe('new')
    })
})
